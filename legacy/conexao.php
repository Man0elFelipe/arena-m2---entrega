<?php
// ============================================================
//  Arena+ | Conexão com o banco de dados
//  Configurado para MAMP (Mac)
// ============================================================

define('DB_HOST', '127.0.0.1');
define('DB_PORT', 8889);          // Porta padrão do MAMP para MySQL
define('DB_NAME', 'arena_plus');
define('DB_USER', 'root');
define('DB_PASS', 'root');        // Senha padrão do MAMP
define('DB_CHARSET', 'utf8mb4');

function conectar(): PDO {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
    );

    $opcoes = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $opcoes);
    } catch (PDOException $e) {
        // Em produção, nunca exiba detalhes do erro para o usuário
        error_log('Erro de conexão: ' . $e->getMessage());
        die(json_encode(['erro' => 'Não foi possível conectar ao banco de dados.']));
    }

    return $pdo;
}
