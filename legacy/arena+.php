<?php
require_once 'auth.php';
require_once 'get_user_data.php';
$titulo = "Arena+ | Sua rede social esportiva";
$usuarioAtual = usuarioLogadoDados();
$fotoPerfil = $usuarioAtual['foto'] ?: 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg';
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $titulo; ?></title>

    <link rel="stylesheet" href="style.css?v=31">
    <link rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="icon" href="LOGOARENA+PST.png" type="image/x-icon">
</head>

<body <?php echo bodyDataAtributos(); ?>>
<header>
    <div class="header-content">
        <div class="logo">
            <img src="LOGOARENA+PST.png" alt="LOGOARENA+PST">
        </div>

        <div class="search-bar">
            <i class="fas fa-search"></i>
            <input type="text" id="global-search" placeholder="Pesquisar na Arena+ (comunidades)">
        </div>

        <nav class="main-nav">
            <ul>
                <li><a href="/feed" class="active"><i class="fas fa-home"></i> Início</a></li>
                <li><a href="/comunidades"><i class="fas fa-users"></i> Comunidades</a></li>
                <li><a href="/coach"><i class="fas fa-comments"></i> Chat</a></li>
                <li><a href="#" id="notif-toggle"><i class="fas fa-bell"></i> Notificações</a></li>
            </ul>
        </nav>

        <div class="user-profile">
            <a href="/profile">
                <img src="<?= htmlspecialchars($fotoPerfil) ?>" class="js-profile-photo">
            </a>
            <button class="publish-btn" id="btn-publicar-header">
                <i class="fas fa-plus"></i> Publicar
            </button>
        </div>
    </div>
</header>

<!-- PAINEL DE NOTIFICAÇÕES -->
<div id="notif-panel" class="notif-panel">
    <div class="notif-header">
        <h4>Notificações</h4>
        <button id="notif-close"><i class="fas fa-times"></i></button>
    </div>
    <ul class="notif-list">
        <li>
            <span class="notif-dot"></span>
            <p><strong>Muscle Gang</strong> acabou de postar um novo treino de pernas 💪</p>
            <span class="notif-time">Há 5 min</span>
        </li>
        <li>
            <span class="notif-dot"></span>
            <p><strong>Fãs de Basquete</strong> criou um evento: “Pickup Game no parque” 🏀</p>
            <span class="notif-time">Há 30 min</span>
        </li>
        <li>
            <p><strong>Gpiloto</strong> começou a seguir você.</p>
            <span class="notif-time">Há 2 h</span>
        </li>
    </ul>
</div>

<div class="main-container">

    <!-- SIDEBAR ESQUERDA -->
    <aside class="left-sidebar">
        <div class="profile-info">
            <img src="<?= htmlspecialchars($fotoPerfil) ?>" class="js-profile-photo">
            <h4 class="js-profile-name"><?= htmlspecialchars($usuarioAtual['nome']) ?></h4>
            <p class="js-profile-username"><?= htmlspecialchars($usuarioAtual['username']) ?></p>
        </div>

        <nav class="sidebar-nav">
            <ul>
                <li><a href="/profile"><i class="fas fa-user"></i> Perfil</a></li>
                <li><a id="link-criar"><i class="fas fa-plus-circle"></i> Criar Publicação</a></li>
                <li><a id="alterar-tema"><i class="fas fa-moon"></i> Alterar Tema</a></li>
                <li><a href="/settings" class="config-link"><i class="fas fa-cog"></i> Configurações</a></li>
                <li><a href="/admin"><i class="fas fa-shield-alt"></i> Admin</a></li>
                <li><a href="/logout"><i class="fas fa-sign-out-alt"></i> Sair</a></li>
            </ul>
        </nav>
    </aside>

    <!-- FEED CENTRAL -->
    <main class="feed-container">

        <!-- CRIAR POST -->
        <div class="create-post-box">
            <div class="top-create">
                <img src="<?= htmlspecialchars($fotoPerfil) ?>" class="js-profile-photo">
                <textarea id="post-text"
                          placeholder="Compartilhe algo..."
                          rows="2"></textarea>
            </div>

            <input type="file" id="post-media" accept="image/*,video/*" hidden>

            <div class="post-options">
                <button id="btn-media"><i class="fas fa-image"></i> Foto/Vídeo</button>
                <button id="btn-publicar"><i class="fas fa-paper-plane"></i> Publicar</button>
            </div>

            <div id="post-preview"></div>
        </div>

        <!-- FEED DINÂMICO DO BANCO DE DADOS -->
        <div id="feed-posts">
            <!-- Posts carregados via JavaScript (api_posts.php) -->
            <div id="feed-loading" style="text-align:center;padding:30px;color:#888;">
                <i class="fas fa-spinner fa-spin"></i> Carregando posts...
            </div>
        </div>

        <div id="feed-fim" style="display:none;text-align:center;padding:20px;color:#aaa;font-size:13px;">
            Você chegou ao fim do feed 🏁
        </div>

    </main>

    <!-- SIDEBAR DIREITA -->
    <aside class="right-sidebar">
        <div class="sidebar-section coach-promo">
            <h4>Arena Coaching</h4>
            <p>IA para treino, alimentação, análise de imagem e posts esportivos.</p>
            <a href="/coach" class="coach-link"><i class="fas fa-dumbbell"></i> Abrir coach</a>
        </div>

        <div class="sidebar-section">
            <h4>Desafios ativos</h4>
            <div class="mini-challenge">
                <strong>Gym Rats 21 dias</strong>
                <span>450 pts</span>
            </div>
            <div class="mini-challenge">
                <strong>Prato de Campeão</strong>
                <span>220 pts</span>
            </div>
        </div>

        <div class="sidebar-section">
            <h4>Comunidades sugeridas</h4>

            <div class="community-card">
                <img src="Gemini_Generated_Image_kb5xt0kb5xt0kb5x.png" alt="Basquete">
                <div>
                    <h5>Fãs de Basquete</h5>
                    <p>12k membros</p>
                </div>
                <button class="follow-btn">Seguir</button>
            </div>

        <div class="community-card">
                <img src="academia.png" alt="Academia">
                <div>
                    <h5>Muscle Gang</h5>
                    <p>5k membros</p>
                </div>
                <button class="follow-btn">Seguir</button>
            </div>
        </div>

        <div class="sidebar-section">
            <h4>Quem seguir</h4>

            <div class="follow-card">
                <img src="g.png" alt="Gpiloto">
                <div>
                    <h5>Gpiloto</h5>
                    <p>@_djvanjr</p>
                </div>
                <button class="follow-btn">Seguir</button>
            </div>

            <div class="follow-card">
                <img src="Captura de tela 2025-09-23 214159.png" alt="Emerigoniok">
                <div>
                    <h5>emerigoniok</h5>
                    <p>@Emi_Rigoni</p>
                </div>
                <button class="follow-btn">Seguir</button>
            </div>
        </div>

    </aside>
</div>

<!-- MODAL CONFIG -->
<div id="config-modal" class="config-modal">
    <div class="config-modal-content">
        <button id="close-config" class="config-close">&times;</button>
        <iframe src="/settings"></iframe>
    </div>
</div>

<script src="index.js?v=31"></script>
<script src="feed_db.js?v=31"></script>
</body>
</html>
