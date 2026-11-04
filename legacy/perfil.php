<?php
require_once 'auth.php';
require_once 'get_user_data.php';
$titulo = "Perfil | Arena+";
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
            <input type="text" placeholder="Pesquisar na Arena+">
        </div>

        <nav class="main-nav">
            <ul>
                <li><a href="/feed"><i class="fas fa-home"></i> Início</a></li>
                <li><a href="/comunidades"><i class="fas fa-users"></i> Comunidades</a></li>
                <li><a href="/coach"><i class="fas fa-comments"></i> Chat</a></li>
                <li><a href="#"><i class="fas fa-bell"></i> Notificações</a></li>
            </ul>
        </nav>

        <div class="user-profile">
            <a href="/profile">
                <img src="jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg" class="js-profile-photo">
            </a>
            <button class="publish-btn">
                <i class="fas fa-plus"></i> Publicar
            </button>
        </div>
    </div>
</header>

<div class="main-container">
    <!-- SIDEBAR ESQUERDA -->
    <aside class="left-sidebar">
        <div class="profile-info">
            <img src="jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg" class="js-profile-photo">
            <h4 class="js-profile-name">Xandela.xt</h4>
            <p class="js-profile-username">@__ale_vm</p>
        </div>

        <nav class="sidebar-nav">
            <ul>
                <li><a href="/profile"><i class="fas fa-user"></i> Perfil</a></li>
                <li><a href="/feed"><i class="fas fa-plus-circle"></i> Criar Publicação</a></li>
                <li><a id="alterar-tema"><i class="fas fa-moon"></i> Alterar Tema</a></li>
                <li><a href="/settings"><i class="fas fa-cog"></i> Configurações</a></li>
                <li><a href="/logout"><i class="fas fa-sign-out-alt"></i> Sair</a></li>
            </ul>
        </nav>
    </aside>

    <!-- CONTEÚDO PERFIL -->
    <main class="profile-container">
        <section class="profile-header">
            <div class="profile-cover"></div>
            <img src="jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg" class="profile-photo js-profile-photo">

            <div class="profile-info-details">
                <h2 class="js-profile-name">Xandela.xt</h2>
                <p class="js-profile-username">@__ale_vm</p>
            </div>

            <p class="profile-bio js-profile-bio">
                Entusiasta de esportes, apaixonado por futebol, treino e desafios! ⚽🔥
            </p>
            <p class="profile-bio">
                <span class="js-profile-city"></span>
                <span class="js-profile-sport"></span>
                <span class="js-profile-role"></span>
            </p>

            <button id="edit-profile-btn" class="edit-profile-btn">
                <i class="fas fa-pen"></i> Editar Perfil
            </button>
        </section>

        <!-- NAV DAS ABAS -->
        <nav class="profile-nav">
            <div class="profile-nav-item active">Publicações</div>
            <div class="profile-nav-item">Conquistas</div>
            <div class="profile-nav-item">Comunidades</div>
        </nav>

        <!-- CONTEÚDOS -->
        <section class="profile-content">
            <div class="tab-content active">
                <div class="post">
                    <div class="post-header">
                        <img src="jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg" class="js-profile-photo">
                        <div class="post-info">
                            <h4 class="js-profile-name">Xandela.xt</h4>
                            <span class="js-profile-username">@__ale_vm</span>
                            <p class="post-time">Há 3 dias</p>
                        </div>
                    </div>
                    <div class="post-content">
                        <p>Mais um treino concluído com sucesso! 💪🔥</p>
                        <img src="agradecimento.png" alt="Treino">
                    </div>
                    <div class="post-actions">
                        <button><i class="fas fa-heart"></i> Curtir</button>
                        <button><i class="fas fa-comment"></i> Comentar</button>
                        <button><i class="fas fa-share"></i> Compartilhar</button>
                    </div>
                </div>
            </div>

            <div class="tab-content">
                <div class="achievement-card">
                    <i class="fas fa-trophy"></i>
                    <div>
                        <h4>Maratona concluída</h4>
                        <p>Completou sua primeira maratona com pace estável e foco total.</p>
                    </div>
                </div>
                <div class="achievement-card">
                    <i class="fas fa-medal"></i>
                    <div>
                        <h4>30 dias de treino</h4>
                        <p>Manteve uma rotina de treinos por 30 dias seguidos.</p>
                    </div>
                </div>
            </div>

            <div class="tab-content">
                <div class="community-item">
                    <i class="fas fa-futbol"></i>
                    <div>
                        <h4>Futebol Raiz</h4>
                        <p>Grupo focado em peladas, campeonatos de bairro e histórias de vestiário.</p>
                    </div>
                </div>
                <div class="community-item">
                    <i class="fas fa-dumbbell"></i>
                    <div>
                        <h4>Vida de Gym</h4>
                        <p>Relatos de treino, evolução física e dicas de academia.</p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- SIDEBAR DIREITA -->
    <aside class="right-sidebar">
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
                <img src="academia.png" alt="Muscle Gang">
                <div>
                    <h5>Muscle Gang</h5>
                    <p>5k membros</p>
                </div>
                <button class="follow-btn">Seguir</button>
            </div>
        </div>
    </aside>
</div>

<!-- MODAL EDITAR PERFIL -->
<div id="edit-profile-modal" class="edit-profile-modal">
    <div class="edit-profile-content">
        <h3>Editar Perfil</h3>
        <form id="edit-profile-form">
            <label for="edit-name">Nome</label>
            <input type="text" id="edit-name" required>

            <label for="edit-username">Nome de usuário</label>
            <input type="text" id="edit-username" required>

            <label for="edit-bio">Biografia</label>
            <textarea id="edit-bio" rows="3"></textarea>

            <label for="edit-city">Cidade</label>
            <input type="text" id="edit-city">

            <label for="edit-sport">Esporte favorito</label>
            <input type="text" id="edit-sport">

            <label for="edit-role">Posição ou modalidade</label>
            <input type="text" id="edit-role">

            <label for="edit-photo">Foto de perfil</label>
            <input type="file" id="edit-photo" accept="image/*">

            <div class="edit-profile-buttons">
                <button type="button" id="cancel-edit">Cancelar</button>
                <button type="submit">Salvar</button>
            </div>
        </form>
    </div>
</div>

<div id="config-modal" class="config-modal">
    <div class="config-modal-content">
        <button id="close-config" class="config-close">&times;</button>
        <iframe src="/settings"></iframe>
    </div>
</div>

<script src="index.js?v=31"></script>
</body>
</html>
