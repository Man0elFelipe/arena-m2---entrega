<?php
// ============================================================
//  Arena+ | Login + Cadastro (integrado ao banco)
// ============================================================
session_start();
require_once 'conexao.php';

// Se já está logado, vai pro feed
if (!empty($_SESSION['usuario_id'])) {
    header('Location: /feed');
    exit;
}

$erro    = '';
$sucesso = '';

function garantirColunasPerfilEsportivo(PDO $pdo): void {
    $cols = $pdo->query("SHOW COLUMNS FROM usuarios")->fetchAll(PDO::FETCH_COLUMN);
    $alter = [];
    if (!in_array('esporte_favorito', $cols, true)) $alter[] = "ADD COLUMN esporte_favorito VARCHAR(80) DEFAULT NULL";
    if (!in_array('objetivo', $cols, true)) $alter[] = "ADD COLUMN objetivo VARCHAR(120) DEFAULT NULL";
    if (!in_array('nivel', $cols, true)) $alter[] = "ADD COLUMN nivel VARCHAR(40) DEFAULT NULL";
    if ($alter) $pdo->exec('ALTER TABLE usuarios ' . implode(', ', $alter));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $acao = $_POST['acao'] ?? '';
    $pdo  = conectar();
    garantirColunasPerfilEsportivo($pdo);

    // ── CADASTRO ─────────────────────────────────────────────
    if ($acao === 'cadastro') {
        $nome     = trim($_POST['nome']     ?? '');
        $username = trim($_POST['username'] ?? '');
        $email    = trim($_POST['email']    ?? '');
        $senha    = trim($_POST['senha']    ?? '');
        $bio      = trim($_POST['bio']      ?? '');
        $esporte  = trim($_POST['esporte_favorito'] ?? '');
        $objetivo = trim($_POST['objetivo'] ?? '');
        $nivel    = trim($_POST['nivel'] ?? '');

        // Limpa @ do username se o usuário digitou
        $username = ltrim($username, '@');

        if (!$nome || !$username || !$email || !$senha) {
            $erro = 'Preencha todos os campos obrigatórios.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $erro = 'E-mail inválido.';
        } elseif (strlen($senha) < 6) {
            $erro = 'A senha deve ter pelo menos 6 caracteres.';
        } else {
            // Verifica duplicata
            $chk = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? OR username = ? LIMIT 1');
            $chk->execute([$email, $username]);
            if ($chk->fetch()) {
                $erro = 'E-mail ou nome de usuário já cadastrado.';
            } else {
                $hash = password_hash($senha, PASSWORD_DEFAULT);
                $ins  = $pdo->prepare(
                    'INSERT INTO usuarios (nome, username, email, senha_hash, bio, esporte_favorito, objetivo, nivel)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $ins->execute([$nome, $username, $email, $hash, $bio, $esporte ?: null, $objetivo ?: null, $nivel ?: null]);

                $uid = $pdo->lastInsertId();

                // Cria configurações padrão
                $pdo->prepare(
                    'INSERT INTO configuracoes_usuario (usuario_id) VALUES (?)'
                )->execute([$uid]);

                // Loga automaticamente e redireciona para configurar perfil
                session_regenerate_id(true);
                $_SESSION['usuario_id'] = $uid;
                $_SESSION['nome']       = $nome;
                $_SESSION['username']   = '@' . $username;
                header('Location: /setup-profile');
                exit;
            }
        }
    }

    // ── LOGIN ─────────────────────────────────────────────────
    if ($acao === 'login') {
        $email = trim($_POST['email'] ?? '');
        $senha = trim($_POST['senha'] ?? '');

        if (!$email || !$senha) {
            $erro = 'Preencha e-mail e senha.';
        } else {
            $stmt = $pdo->prepare(
                'SELECT id, nome, username, senha_hash FROM usuarios WHERE email = ? LIMIT 1'
            );
            $stmt->execute([$email]);
            $usuario = $stmt->fetch();

            if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
                $erro = 'E-mail ou senha incorretos.';
            } else {
                session_regenerate_id(true);
                $_SESSION['usuario_id'] = $usuario['id'];
                $_SESSION['nome']       = $usuario['nome'];
                $_SESSION['username']   = '@' . $usuario['username'];
                header('Location: /feed');
                exit;
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Login | Arena+</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css?v=31">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="icon" href="LOGOARENA+PST.png" type="image/x-icon">
    <style>
        .tab-btns { display:flex; gap:8px; margin-bottom:18px; }
        .tab-btn {
            flex:1; padding:9px; border:none; border-radius:8px;
            cursor:pointer; font-size:14px; font-weight:bold;
            background:#e9eaf0; color:#555;
        }
        .tab-btn.active { background:var(--primary-blue,#4f6ef7); color:#fff; }
        .tab-content { display:none; }
        .tab-content.active { display:block; }
        .msg-erro   { color:#e03e3e; font-size:13px; margin-bottom:10px; }
        .msg-ok     { color:#2e7d32; font-size:13px; margin-bottom:10px; }
        .login-form label { display:block; font-size:13px; font-weight:bold; margin-bottom:3px; margin-top:10px; }
        .login-form input, .login-form textarea, .login-form select {
            width:100%; padding:9px 10px; border-radius:8px;
            border:1px solid #ccc; font-size:13px; box-sizing:border-box;
            background:#fff;
        }
    </style>
</head>
<body class="login-body">

<div class="login-wrapper">
    <div class="login-card">
        <!-- LADO ESQUERDO -->
        <div class="login-left">
            <img src="academia.png" alt="Arena+ esportes">
            <div class="login-left-overlay">
                <img src="LOGOARENA+PST.png" class="login-logo" alt="Arena+">
                <h2>Bem-vindo à Arena+</h2>
                <p>Sua rede social esportiva para compartilhar treinos, jogos e conquistas.</p>
            </div>
        </div>

        <!-- LADO DIREITO -->
        <div class="login-right">

            <?php if ($erro):   ?><p class="msg-erro"><i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($erro) ?></p><?php endif; ?>
            <?php if ($sucesso):?><p class="msg-ok"><i class="fas fa-check-circle"></i> <?= htmlspecialchars($sucesso) ?></p><?php endif; ?>

            <!-- ABAS -->
            <div class="tab-btns">
                <button class="tab-btn <?= (!$sucesso ? 'active' : '') ?>" onclick="trocarAba('login')">Entrar</button>
                <button class="tab-btn <?= ($sucesso  ? 'active' : '') ?>" onclick="trocarAba('cadastro')">Criar conta</button>
            </div>

            <!-- LOGIN -->
            <div id="tab-login" class="tab-content <?= (!$sucesso ? 'active' : '') ?>">
                <h2>Entrar</h2>
                <p class="login-subtitle">Acesse sua conta e entre na Arena.</p>
                <form class="login-form" method="POST">
                    <input type="hidden" name="acao" value="login">
                    <label>E-mail</label>
                    <input type="email" name="email" placeholder="seu@email.com" required>
                    <label>Senha</label>
                    <input type="password" name="senha" placeholder="••••••" required>
                    <button type="submit" class="login-btn" style="margin-top:16px;">
                        Entrar na Arena+
                    </button>
                </form>
            </div>

            <!-- CADASTRO -->
            <div id="tab-cadastro" class="tab-content <?= ($sucesso ? 'active' : '') ?>">
                <h2>Criar conta</h2>
                <p class="login-subtitle">Junte-se à Arena+ agora.</p>
                <form class="login-form" method="POST">
                    <input type="hidden" name="acao" value="cadastro">
                    <label>Nome *</label>
                    <input type="text" name="nome" placeholder="Seu nome completo" required>
                    <label>Nome de usuário *</label>
                    <input type="text" name="username" placeholder="@seuuser" required>
                    <label>E-mail *</label>
                    <input type="email" name="email" placeholder="seu@email.com" required>
                    <label>Senha * (mín. 6 caracteres)</label>
                    <input type="password" name="senha" placeholder="••••••" required>
                    <label>Esporte favorito</label>
                    <input type="text" name="esporte_favorito" placeholder="Musculação, futebol, corrida...">
                    <label>Objetivo principal</label>
                    <select name="objetivo">
                        <option value="">Escolha seu objetivo</option>
                        <option value="Ganhar massa">Ganhar massa</option>
                        <option value="Perder gordura">Perder gordura</option>
                        <option value="Melhorar performance">Melhorar performance</option>
                        <option value="Criar rotina saudável">Criar rotina saudável</option>
                    </select>
                    <label>Nível</label>
                    <select name="nivel">
                        <option value="">Escolha seu nível</option>
                        <option value="Iniciante">Iniciante</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                    </select>
                    <label>Biografia (opcional)</label>
                    <textarea name="bio" rows="2" placeholder="Fale um pouco sobre você"></textarea>
                    <button type="submit" class="login-btn" style="margin-top:16px;">
                        Criar minha conta
                    </button>
                </form>
            </div>

        </div>
    </div>
</div>

<script>
function trocarAba(aba) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + aba).classList.add('active');
    event.target.classList.add('active');
}
</script>
</body>
</html>
