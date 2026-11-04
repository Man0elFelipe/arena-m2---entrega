<?php
session_start();
require_once 'conexao.php';
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['usuario_id'])) {
    echo json_encode(['erro' => 'Não autenticado.']);
    exit;
}

$uid = (int) $_SESSION['usuario_id'];
$pdo = conectar();
$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

function comunidadesEnsureSchema(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS desafios (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            comunidade_id INT UNSIGNED DEFAULT NULL,
            titulo VARCHAR(120) NOT NULL,
            descricao TEXT NOT NULL,
            estilo VARCHAR(40) DEFAULT 'gym-rats',
            pontos INT UNSIGNED DEFAULT 100,
            data_fim DATE DEFAULT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS usuarios_desafios (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            desafio_id INT UNSIGNED NOT NULL,
            usuario_id INT UNSIGNED NOT NULL,
            status ENUM('ativo','concluido') DEFAULT 'ativo',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unico_usuario_desafio (desafio_id, usuario_id),
            FOREIGN KEY (desafio_id) REFERENCES desafios(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $count = (int) $pdo->query('SELECT COUNT(*) FROM desafios')->fetchColumn();
    if ($count === 0) {
        $pdo->exec("
            INSERT INTO desafios (titulo, descricao, estilo, pontos, data_fim) VALUES
            ('Gym Rats 21 dias', 'Faça check-in de treino por 21 dias e poste sua evolução na comunidade.', 'gym-rats', 450, DATE_ADD(CURDATE(), INTERVAL 21 DAY)),
            ('Cardio da Semana', 'Complete 90 minutos de cardio na semana e compartilhe seu melhor tempo.', 'cardio', 180, DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
            ('Prato de Campeão', 'Publique 3 refeições equilibradas com proteína, carboidrato e vegetais.', 'nutricao', 220, DATE_ADD(CURDATE(), INTERVAL 10 DAY))
        ");
    }
}

comunidadesEnsureSchema($pdo);

if ($acao === 'entrar') {
    $nome = trim($_POST['nome'] ?? '');
    if (!$nome) {
        echo json_encode(['erro' => 'Comunidade inválida.']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id FROM comunidades WHERE nome = ? LIMIT 1');
    $stmt->execute([$nome]);
    $id = $stmt->fetchColumn();

    if (!$id) {
        $ins = $pdo->prepare('INSERT INTO comunidades (nome, descricao) VALUES (?, ?)');
        $ins->execute([$nome, 'Comunidade criada pela Arena+.']);
        $id = $pdo->lastInsertId();
    }

    $pdo->prepare('INSERT IGNORE INTO membros_comunidade (comunidade_id, usuario_id) VALUES (?, ?)')->execute([$id, $uid]);
    $total = $pdo->prepare('SELECT COUNT(*) FROM membros_comunidade WHERE comunidade_id = ?');
    $total->execute([$id]);

    echo json_encode(['ok' => true, 'membros' => (int) $total->fetchColumn()]);
    exit;
}

if ($acao === 'desafio') {
    $desafioId = (int) ($_POST['desafio_id'] ?? 0);
    if (!$desafioId) {
        echo json_encode(['erro' => 'Desafio inválido.']);
        exit;
    }
    $pdo->prepare('INSERT IGNORE INTO usuarios_desafios (desafio_id, usuario_id) VALUES (?, ?)')->execute([$desafioId, $uid]);
    echo json_encode(['ok' => true]);
    exit;
}

echo json_encode(['erro' => 'Ação desconhecida.']);
