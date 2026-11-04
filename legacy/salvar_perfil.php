<?php
session_start();
require_once 'conexao.php';

header('Content-Type: application/json');

if (empty($_SESSION['usuario_id'])) {
    echo json_encode(['erro' => 'Não autenticado.']);
    exit;
}

$uid  = (int) $_SESSION['usuario_id'];
$pdo  = conectar();

$nome     = trim($_POST['nome']     ?? '');
$username = ltrim(trim($_POST['username'] ?? ''), '@');
$bio      = trim($_POST['bio']      ?? '');

if (!$nome || !$username) {
    echo json_encode(['erro' => 'Nome e usuário são obrigatórios.']);
    exit;
}

// Verifica se username já existe em outra conta
$chk = $pdo->prepare('SELECT id FROM usuarios WHERE username = ? AND id != ? LIMIT 1');
$chk->execute([$username, $uid]);
if ($chk->fetch()) {
    echo json_encode(['erro' => 'Nome de usuário já em uso.']);
    exit;
}

$fotoPath = null;

// Upload de foto
if (!empty($_FILES['foto']['tmp_name'])) {
    $ext     = strtolower(pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg','jpeg','png','webp','gif'];
    if (!in_array($ext, $allowed)) {
        echo json_encode(['erro' => 'Formato de foto inválido.']);
        exit;
    }
    $dir = 'upload/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $fotoPath = $dir . 'foto_' . $uid . '.' . $ext;
    move_uploaded_file($_FILES['foto']['tmp_name'], $fotoPath);
}

// Monta query
if ($fotoPath) {
    $stmt = $pdo->prepare('UPDATE usuarios SET nome=?, username=?, bio=?, foto_perfil=? WHERE id=?');
    $stmt->execute([$nome, $username, $bio, $fotoPath, $uid]);
} else {
    $stmt = $pdo->prepare('UPDATE usuarios SET nome=?, username=?, bio=? WHERE id=?');
    $stmt->execute([$nome, $username, $bio, $uid]);
}

// Atualiza sessão
$_SESSION['nome']     = $nome;
$_SESSION['username'] = '@' . $username;

// Busca foto atual se não foi alterada
if (!$fotoPath) {
    $row = $pdo->prepare('SELECT foto_perfil FROM usuarios WHERE id=?');
    $row->execute([$uid]);
    $fotoPath = $row->fetchColumn() ?: null;
}

echo json_encode([
    'ok'       => true,
    'nome'     => $nome,
    'username' => '@' . $username,
    'bio'      => $bio,
    'foto'     => $fotoPath
]);
