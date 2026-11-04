<?php
function usuarioLogadoDados(): array {
    global $sessao_id;
    static $usuario = null;
    if ($usuario !== null) return $usuario;

    require_once __DIR__ . '/conexao.php';
    $pdo  = conectar();
    $stmt = $pdo->prepare('SELECT nome, username, bio, foto_perfil FROM usuarios WHERE id = ? LIMIT 1');
    $stmt->execute([$sessao_id]);
    $u = $stmt->fetch();

    if (!$u) {
        $usuario = [
            'nome' => $_SESSION['nome'] ?? 'Usuário',
            'username' => $_SESSION['username'] ?? '@usuario',
            'bio' => '',
            'foto' => '',
        ];
        return $usuario;
    }

    $nomeRaw = trim($u['nome'] ?? '') ?: ($_SESSION['nome'] ?? 'Usuário');
    $usernameRaw = trim($u['username'] ?? '') ?: ltrim(($_SESSION['username'] ?? 'usuario'), '@');

    $_SESSION['nome'] = $nomeRaw;
    $_SESSION['username'] = '@' . ltrim($usernameRaw, '@');

    $usuario = [
        'nome' => $nomeRaw,
        'username' => '@' . ltrim($usernameRaw, '@'),
        'bio' => $u['bio'] ?? '',
        'foto' => $u['foto_perfil'] ?? '',
    ];

    return $usuario;
}

// Retorna os atributos data- do usuário logado para o <body>
// Requer que auth.php já tenha sido incluído antes
function bodyDataAtributos(): string {
    static $cache = null;
    if ($cache !== null) return $cache;

    $u = usuarioLogadoDados();
    $nome     = htmlspecialchars($u['nome'], ENT_QUOTES);
    $username = htmlspecialchars($u['username'], ENT_QUOTES);
    $bio      = htmlspecialchars($u['bio'] ?? '', ENT_QUOTES);
    $foto     = htmlspecialchars($u['foto'] ?? '', ENT_QUOTES);

    $cache = "data-nome=\"{$nome}\" data-username=\"{$username}\" data-bio=\"{$bio}\" data-foto=\"{$foto}\"";
    return $cache;
}
