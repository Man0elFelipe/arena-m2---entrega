<?php
// ============================================================
//  Arena+ | API de Seguir / Deixar de Seguir
// ============================================================
session_start();
require_once 'conexao.php';
header('Content-Type: application/json');

if (empty($_SESSION['usuario_id'])) {
    echo json_encode(['erro' => 'Não autenticado.']);
    exit;
}

$uid  = (int) $_SESSION['usuario_id'];
$pdo  = conectar();
$acao = $_GET['acao'] ?? $_POST['acao'] ?? '';

// ── SEGUIR / DEIXAR DE SEGUIR ─────────────────────────────────
if ($acao === 'toggle') {
    $alvoId = (int)($_POST['usuario_id'] ?? 0);
    if (!$alvoId || $alvoId === $uid) {
        echo json_encode(['erro' => 'Usuário inválido.']);
        exit;
    }

    $chk = $pdo->prepare('SELECT id FROM seguidores WHERE seguidor_id=? AND seguido_id=?');
    $chk->execute([$uid, $alvoId]);

    if ($chk->fetch()) {
        $pdo->prepare('DELETE FROM seguidores WHERE seguidor_id=? AND seguido_id=?')->execute([$uid, $alvoId]);
        $acao_feita = 'deixou_de_seguir';
    } else {
        $pdo->prepare('INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?,?)')->execute([$uid, $alvoId]);
        $acao_feita = 'seguindo';
    }

    $totalSeguidores = $pdo->prepare('SELECT COUNT(*) FROM seguidores WHERE seguido_id=?');
    $totalSeguidores->execute([$alvoId]);

    echo json_encode(['ok' => true, 'acao' => $acao_feita, 'total_seguidores' => (int)$totalSeguidores->fetchColumn()]);
    exit;
}

// ── CONTAGENS DO PERFIL ───────────────────────────────────────
if ($acao === 'contagens') {
    $alvoId = (int)($_GET['usuario_id'] ?? $uid);

    $seguidores = $pdo->prepare('SELECT COUNT(*) FROM seguidores WHERE seguido_id=?');
    $seguidores->execute([$alvoId]);

    $seguindo = $pdo->prepare('SELECT COUNT(*) FROM seguidores WHERE seguidor_id=?');
    $seguindo->execute([$alvoId]);

    $posts = $pdo->prepare('SELECT COUNT(*) FROM posts WHERE usuario_id=?');
    $posts->execute([$alvoId]);

    $eu_sigo = false;
    if ($alvoId !== $uid) {
        $chk = $pdo->prepare('SELECT id FROM seguidores WHERE seguidor_id=? AND seguido_id=?');
        $chk->execute([$uid, $alvoId]);
        $eu_sigo = (bool)$chk->fetch();
    }

    echo json_encode([
        'ok'              => true,
        'seguidores'      => (int)$seguidores->fetchColumn(),
        'seguindo'        => (int)$seguindo->fetchColumn(),
        'posts'           => (int)$posts->fetchColumn(),
        'eu_sigo'         => $eu_sigo,
        'e_meu_perfil'    => ($alvoId === $uid)
    ]);
    exit;
}

// ── SUGESTÕES DE QUEM SEGUIR ──────────────────────────────────
if ($acao === 'sugestoes') {
    $stmt = $pdo->prepare("
        SELECT u.id, u.nome, u.username, u.foto_perfil,
               (SELECT COUNT(*) FROM seguidores WHERE seguido_id = u.id) AS total_seguidores
        FROM usuarios u
        WHERE u.id != :uid
          AND u.id NOT IN (
              SELECT seguido_id FROM seguidores WHERE seguidor_id = :uid2
          )
        ORDER BY total_seguidores DESC
        LIMIT 5
    ");
    $stmt->bindValue(':uid',  $uid, PDO::PARAM_INT);
    $stmt->bindValue(':uid2', $uid, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode(['ok' => true, 'sugestoes' => $stmt->fetchAll()]);
    exit;
}

echo json_encode(['erro' => 'Ação desconhecida.']);
