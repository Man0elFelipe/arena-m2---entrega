<?php
// ============================================================
//  Arena+ | API de Posts (criar, listar, curtir, comentar)
// ============================================================
session_start();
require_once 'conexao.php';
header('Content-Type: application/json');

if (empty($_SESSION['usuario_id'])) {
    echo json_encode(['erro' => 'Não autenticado.']);
    exit;
}

$uid    = (int) $_SESSION['usuario_id'];
$pdo    = conectar();
$acao   = $_GET['acao'] ?? $_POST['acao'] ?? '';

// ── LISTAR POSTS DO FEED ─────────────────────────────────────
if ($acao === 'feed') {
    $pagina = max(1, (int)($_GET['pagina'] ?? 1));
    $limite = 10;
    $offset = ($pagina - 1) * $limite;

    $stmt = $pdo->prepare("
        SELECT p.id, p.texto, p.midia_url, p.midia_tipo, p.criado_em,
               u.nome, u.username, u.foto_perfil,
               COUNT(DISTINCT c.id) AS total_curtidas,
               MAX(CASE WHEN c.usuario_id = :uid THEN 1 ELSE 0 END) AS curtido_por_mim,
               COUNT(DISTINCT cm.id) AS total_comentarios
        FROM posts p
        JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN curtidas c ON c.post_id = p.id
        LEFT JOIN comentarios cm ON cm.post_id = p.id
        GROUP BY p.id
        ORDER BY p.criado_em DESC
        LIMIT :limite OFFSET :offset
    ");
    $stmt->bindValue(':uid',    $uid,    PDO::PARAM_INT);
    $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $posts = $stmt->fetchAll();

    echo json_encode(['ok' => true, 'posts' => $posts]);
    exit;
}

// ── CRIAR POST ───────────────────────────────────────────────
if ($acao === 'criar') {
    $texto = trim($_POST['texto'] ?? '');
    $midiaUrl  = null;
    $midiaTipo = null;

    if (!$texto && empty($_FILES['midia']['tmp_name'])) {
        echo json_encode(['erro' => 'Post vazio.']);
        exit;
    }

    if (!empty($_FILES['midia']['tmp_name'])) {
        $ext     = strtolower(pathinfo($_FILES['midia']['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg','jpeg','png','webp','gif','mp4','mov','webm'];
        if (!in_array($ext, $allowed)) {
            echo json_encode(['erro' => 'Formato de mídia inválido.']);
            exit;
        }
        $dir = 'upload/';
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $fname    = 'post_' . $uid . '_' . time() . '.' . $ext;
        $midiaUrl = $dir . $fname;
        move_uploaded_file($_FILES['midia']['tmp_name'], $midiaUrl);
        $midiaTipo = in_array($ext, ['mp4','mov','webm']) ? 'video' : 'image';
    }

    $stmt = $pdo->prepare('INSERT INTO posts (usuario_id, texto, midia_url, midia_tipo) VALUES (?,?,?,?)');
    $stmt->execute([$uid, $texto ?: null, $midiaUrl, $midiaTipo]);
    $postId = $pdo->lastInsertId();

    // Retorna o post completo
    $row = $pdo->prepare('SELECT p.*, u.nome, u.username, u.foto_perfil FROM posts p JOIN usuarios u ON u.id=p.usuario_id WHERE p.id=?');
    $row->execute([$postId]);
    $post = $row->fetch();
    $post['total_curtidas']     = 0;
    $post['curtido_por_mim']    = 0;
    $post['total_comentarios']  = 0;

    echo json_encode(['ok' => true, 'post' => $post]);
    exit;
}

// ── CURTIR / DESCURTIR ───────────────────────────────────────
if ($acao === 'curtir') {
    $postId = (int)($_POST['post_id'] ?? 0);
    if (!$postId) { echo json_encode(['erro' => 'Post inválido.']); exit; }

    $chk = $pdo->prepare('SELECT id FROM curtidas WHERE post_id=? AND usuario_id=?');
    $chk->execute([$postId, $uid]);

    if ($chk->fetch()) {
        // Já curtiu → descurtir
        $pdo->prepare('DELETE FROM curtidas WHERE post_id=? AND usuario_id=?')->execute([$postId, $uid]);
        $acao_feita = 'descurtido';
    } else {
        $pdo->prepare('INSERT INTO curtidas (post_id, usuario_id) VALUES (?,?)')->execute([$postId, $uid]);
        $acao_feita = 'curtido';
    }

    $total = $pdo->prepare('SELECT COUNT(*) FROM curtidas WHERE post_id=?');
    $total->execute([$postId]);

    echo json_encode(['ok' => true, 'acao' => $acao_feita, 'total' => (int)$total->fetchColumn()]);
    exit;
}

// ── COMENTAR ─────────────────────────────────────────────────
if ($acao === 'comentar') {
    $postId = (int)($_POST['post_id'] ?? 0);
    $texto  = trim($_POST['texto'] ?? '');

    if (!$postId || !$texto) { echo json_encode(['erro' => 'Dados incompletos.']); exit; }

    $pdo->prepare('INSERT INTO comentarios (post_id, usuario_id, texto) VALUES (?,?,?)')->execute([$postId, $uid, $texto]);

    echo json_encode(['ok' => true, 'comentario' => [
        'texto'     => htmlspecialchars($texto),
        'nome'      => $_SESSION['nome'],
        'username'  => $_SESSION['username'],
        'criado_em' => date('Y-m-d H:i:s')
    ]]);
    exit;
}

// ── LISTAR COMENTÁRIOS DE UM POST ────────────────────────────
if ($acao === 'comentarios') {
    $postId = (int)($_GET['post_id'] ?? 0);
    if (!$postId) { echo json_encode(['erro' => 'Post inválido.']); exit; }

    $stmt = $pdo->prepare("
        SELECT cm.texto, cm.criado_em, u.nome, u.username, u.foto_perfil
        FROM comentarios cm
        JOIN usuarios u ON u.id = cm.usuario_id
        WHERE cm.post_id = ?
        ORDER BY cm.criado_em ASC
    ");
    $stmt->execute([$postId]);
    echo json_encode(['ok' => true, 'comentarios' => $stmt->fetchAll()]);
    exit;
}

// ── DELETAR POST ─────────────────────────────────────────────
if ($acao === 'deletar') {
    $postId = (int)($_POST['post_id'] ?? 0);
    if (!$postId) { echo json_encode(['erro' => 'Post inválido.']); exit; }

    // Verifica dono
    $chk = $pdo->prepare('SELECT id, midia_url FROM posts WHERE id=? AND usuario_id=?');
    $chk->execute([$postId, $uid]);
    $post = $chk->fetch();
    if (!$post) { echo json_encode(['erro' => 'Sem permissão.']); exit; }

    // Remove arquivo físico se existir
    if ($post['midia_url'] && file_exists($post['midia_url'])) {
        unlink($post['midia_url']);
    }

    $pdo->prepare('DELETE FROM posts WHERE id=?')->execute([$postId]);
    echo json_encode(['ok' => true]);
    exit;
}

echo json_encode(['erro' => 'Ação desconhecida.']);
