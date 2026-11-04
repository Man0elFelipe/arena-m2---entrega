<?php
// ============================================================
//  Arena+ | Configurar Perfil — aparece após o cadastro
// ============================================================
session_start();
require_once 'conexao.php';

if (empty($_SESSION['usuario_id'])) {
    header('Location: /login');
    exit;
}

$uid = (int)$_SESSION['usuario_id'];
$pdo = conectar();

$erro    = '';
$sucesso = '';

// Busca dados atuais do usuário
$row = $pdo->prepare('SELECT nome, username, bio, foto_perfil FROM usuarios WHERE id=?');
$row->execute([$uid]);
$u = $row->fetch();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome     = trim($_POST['nome']     ?? '');
    $username = ltrim(trim($_POST['username'] ?? ''), '@');
    $bio      = trim($_POST['bio']      ?? '');

    if (!$nome || !$username) {
        $erro = 'Nome e usuário são obrigatórios.';
    } else {
        // Verifica username único
        $chk = $pdo->prepare('SELECT id FROM usuarios WHERE username=? AND id!=?');
        $chk->execute([$username, $uid]);
        if ($chk->fetch()) {
            $erro = 'Nome de usuário já em uso. Escolha outro.';
        } else {
            $fotoPath = $u['foto_perfil'];

            if (!empty($_FILES['foto']['tmp_name'])) {
                $ext     = strtolower(pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION));
                $allowed = ['jpg','jpeg','png','webp'];
                if (in_array($ext, $allowed)) {
                    $dir = 'upload/';
                    if (!is_dir($dir)) mkdir($dir, 0755, true);
                    $fotoPath = $dir . 'foto_' . $uid . '.' . $ext;
                    move_uploaded_file($_FILES['foto']['tmp_name'], $fotoPath);
                }
            }

            if ($fotoPath) {
                $stmt = $pdo->prepare('UPDATE usuarios SET nome=?,username=?,bio=?,foto_perfil=? WHERE id=?');
                $stmt->execute([$nome, $username, $bio, $fotoPath, $uid]);
            } else {
                $stmt = $pdo->prepare('UPDATE usuarios SET nome=?,username=?,bio=? WHERE id=?');
                $stmt->execute([$nome, $username, $bio, $uid]);
            }

            $_SESSION['nome']     = $nome;
            $_SESSION['username'] = '@' . $username;

            header('Location: /feed');
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Configurar Perfil | Arena+</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css?v=31">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="icon" href="LOGOARENA+PST.png" type="image/x-icon">
    <style>
        .setup-wrapper {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-light, #f3f4f6);
        }
        .setup-card {
            background: #fff;
            border-radius: 16px;
            padding: 36px 32px;
            width: 100%;
            max-width: 460px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.10);
        }
        .setup-card .logo-topo {
            text-align: center;
            margin-bottom: 20px;
        }
        .setup-card .logo-topo img {
            height: 52px;
        }
        .setup-card h2 {
            font-size: 22px;
            margin-bottom: 4px;
            text-align: center;
        }
        .setup-card p.sub {
            text-align: center;
            font-size: 13px;
            color: #888;
            margin-bottom: 22px;
        }
        .setup-form label {
            display: block;
            font-size: 13px;
            font-weight: bold;
            margin-top: 14px;
            margin-bottom: 4px;
        }
        .setup-form input,
        .setup-form textarea {
            width: 100%;
            padding: 9px 12px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            font-size: 13px;
            box-sizing: border-box;
            outline: none;
            transition: border .15s;
        }
        .setup-form input:focus,
        .setup-form textarea:focus {
            border-color: var(--primary-blue, #4f6ef7);
        }
        .foto-preview-row {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-top: 8px;
        }
        .foto-preview-row img {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #e5e7eb;
        }
        .setup-btn {
            display: block;
            width: 100%;
            margin-top: 22px;
            padding: 11px;
            border-radius: 999px;
            border: none;
            background: var(--primary-blue, #4f6ef7);
            color: #fff;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            transition: opacity .15s;
        }
        .setup-btn:hover { opacity: .88; }
        .skip-link {
            display: block;
            text-align: center;
            margin-top: 14px;
            font-size: 13px;
            color: #888;
            text-decoration: none;
        }
        .skip-link:hover { text-decoration: underline; }
        .msg-erro { color:#e03e3e; font-size:13px; margin-bottom:10px; }
        .step-indicator {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 20px;
        }
        .step-dot {
            width: 8px; height: 8px;
            border-radius: 50%;
            background: #d1d5db;
        }
        .step-dot.active { background: var(--primary-blue, #4f6ef7); }
    </style>
</head>
<body class="login-body">

<div class="setup-wrapper">
    <div class="setup-card">
        <div class="logo-topo">
            <img src="LOGOARENA+PST.png" alt="Arena+">
        </div>

        <div class="step-indicator">
            <div class="step-dot"></div>
            <div class="step-dot active"></div>
            <div class="step-dot"></div>
        </div>

        <h2>Configure seu perfil</h2>
        <p class="sub">Personalize sua identidade na Arena+ antes de entrar.</p>

        <?php if ($erro): ?>
            <p class="msg-erro"><i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($erro) ?></p>
        <?php endif; ?>

        <form class="setup-form" method="POST" enctype="multipart/form-data">

            <label>Foto de perfil</label>
            <div class="foto-preview-row">
                <img id="foto-preview"
                     src="<?= $u['foto_perfil'] ? htmlspecialchars($u['foto_perfil']) : 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg' ?>"
                     alt="Foto">
                <div>
                    <input type="file" id="foto-input" name="foto" accept="image/*">
                    <small style="font-size:11px;color:#999;display:block;margin-top:3px;">JPG, PNG ou WebP</small>
                </div>
            </div>

            <label>Nome completo *</label>
            <input type="text" name="nome"
                   value="<?= htmlspecialchars($u['nome'] ?? '') ?>"
                   placeholder="Seu nome" required>

            <label>Nome de usuário *</label>
            <input type="text" name="username"
                   value="<?= htmlspecialchars($u['username'] ?? '') ?>"
                   placeholder="@seuuser" required>

            <label>Biografia</label>
            <textarea name="bio" rows="3"
                      placeholder="Fale sobre seus esportes favoritos, conquistas..."><?= htmlspecialchars($u['bio'] ?? '') ?></textarea>

            <button type="submit" class="setup-btn">
                <i class="fas fa-check"></i> Salvar e entrar na Arena+
            </button>
        </form>

        <a href="/feed" class="skip-link">Pular por agora</a>
    </div>
</div>

<script>
document.getElementById('foto-input').addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => document.getElementById('foto-preview').src = e.target.result;
    reader.readAsDataURL(file);
});
</script>
</body>
</html>
