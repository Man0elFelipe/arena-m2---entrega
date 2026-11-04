<?php
// ============================================================
//  Arena+ | Guard de autenticação
//  Inclua no TOPO de: /feed, /profile, /coach,
//  /comunidades, /settings
//  Exemplo: <?php require_once 'auth.php'; ?>
// ============================================================

session_start();

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if (empty($_SESSION['usuario_id'])) {
    header('Location: /login');
    exit;
}

// Variáveis prontas para usar nas páginas
$sessao_id       = (int) $_SESSION['usuario_id'];
$sessao_nome     = htmlspecialchars($_SESSION['nome']     ?? 'Usuário');
$sessao_username = htmlspecialchars($_SESSION['username'] ?? '@usuario');
