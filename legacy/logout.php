<?php
// ============================================================
//  Arena+ | Logout
//  Destrói a sessão e volta para a tela de login.
//  Uso: simplesmente aponte o link "Sair" para /logout
//       (substitui o href="/login" nos seus arquivos)
// ============================================================

session_start();

// Limpa todas as variáveis de sessão
$_SESSION = [];

// Apaga o cookie de sessão do navegador
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

// Destrói a sessão no servidor
session_destroy();

// Volta para o login
header('Location: /login');
exit;
