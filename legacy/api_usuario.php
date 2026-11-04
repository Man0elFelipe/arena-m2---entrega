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

$stmt = $pdo->prepare('SELECT nome, username, bio, foto_perfil FROM usuarios WHERE id = ? LIMIT 1');
$stmt->execute([$uid]);
$u = $stmt->fetch();

if (!$u) {
    echo json_encode(['erro' => 'Usuário não encontrado.']);
    exit;
}

$_SESSION['nome'] = $u['nome'] ?: 'Usuário';
$_SESSION['username'] = '@' . ltrim($u['username'] ?: 'usuario', '@');

echo json_encode([
    'ok' => true,
    'usuario' => [
        'nome' => $_SESSION['nome'],
        'username' => $_SESSION['username'],
        'bio' => $u['bio'] ?? '',
        'foto' => $u['foto_perfil'] ?? '',
    ],
]);
