<?php
require_once 'auth.php';
require_once 'get_user_data.php';
$titulo = "Comunidades | Arena+";
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
            <input type="text" id="global-search" placeholder="Buscar comunidades (ex: futebol, vôlei, capoeira)">
        </div>

        <nav class="main-nav">
            <ul>
                <li><a href="/feed"><i class="fas fa-home"></i> Início</a></li>
                <li><a href="/comunidades" class="active"><i class="fas fa-users"></i> Comunidades</a></li>
                <li><a href="/coach"><i class="fas fa-comments"></i> Chat</a></li>
                <li><a href="#" id="notif-toggle"><i class="fas fa-bell"></i> Notificações</a></li>
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

<!-- PAINEL DE NOTIFICAÇÕES -->
<div id="notif-panel" class="notif-panel">
    <div class="notif-header">
        <h4>Notificações</h4>
        <button id="notif-close"><i class="fas fa-times"></i></button>
    </div>
    <ul class="notif-list">
        <li>
            <span class="notif-dot"></span>
            <p>Você começou a seguir <strong>Futebol</strong>.</p>
            <span class="notif-time">Há 1 h</span>
        </li>
        <li>
            <p>Nova publicação em <strong>Capoeira</strong>.</p>
            <span class="notif-time">Há 3 h</span>
        </li>
    </ul>
</div>

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
                <li><a href="/settings" class="config-link"><i class="fas fa-cog"></i> Configurações</a></li>
                <li><a href="/logout"><i class="fas fa-sign-out-alt"></i> Sair</a></li>
            </ul>
        </nav>
    </aside>

    <!-- CONTEÚDO CENTRAL -->
    <main class="communities-main">
        <div class="communities-header">
            <h2>Escolha os esportes que você curte</h2>
            <p>Seguindo uma comunidade, você recebe mais conteúdos desse esporte no seu feed e entra em desafios da Arena.</p>
            <a class="coach-link" href="/communities/discover"><i class="fas fa-compass"></i> Descobrir todas</a>
        </div>

        <section class="challenge-strip">
            <article class="challenge-card featured">
                <span>Gym Rats</span>
                <h3>21 dias de treino</h3>
                <p>Check-in diário, ranking por pontos e posts de evolução.</p>
                <button class="challenge-btn" data-desafio-id="1"><i class="fas fa-fire"></i> Entrar no desafio</button>
            </article>
            <article class="challenge-card">
                <span>Cardio</span>
                <h3>90 min na semana</h3>
                <p>Corrida, bike, escada ou corda. O suor conta.</p>
                <button class="challenge-btn" data-desafio-id="2"><i class="fas fa-bolt"></i> Participar</button>
            </article>
            <article class="challenge-card">
                <span>Nutrição</span>
                <h3>Prato de Campeão</h3>
                <p>Poste refeições equilibradas e receba dicas do Arena Coaching.</p>
                <button class="challenge-btn" data-desafio-id="3"><i class="fas fa-apple-alt"></i> Participar</button>
            </article>
        </section>

        <div id="no-results" class="no-results" style="display:none;">
            Nenhuma comunidade encontrada para essa busca. Tente outro esporte 😉
        </div>

        <div class="sports-grid" id="sports-grid">
            <!-- FUTEBOL -->
            <div class="sport-card" data-name="futebol bola copa champions" data-community-name="Futebol">
                <img src="images.jpeg" alt="Futebol">
                <div class="sport-info">
                    <h3>Futebol</h3>
                    <p>Clássicos, Libertadores, Copa do Mundo e muito mais. Onde a bola rola, a Arena+ tá junto!</p>
                </div>
                <button class="follow-btn community-join-btn" data-community-name="Futebol">Seguir</button>
            </div>

            <!-- GINÁSTICA -->
            <div class="sport-card" data-name="ginastica rítmica olimpíadas solo fita" data-community-name="Ginástica Rítmica">
                <img src="ginastica.jpeg" alt="Ginástica Rítmica">
                <div class="sport-info">
                    <h3>Ginástica Rítmica</h3>
                    <p>Elegância, força e precisão em cada movimento. Campeonatos, treinos e apresentações.</p>
                </div>
                <button class="follow-btn community-join-btn" data-community-name="Ginástica Rítmica">Seguir</button>
            </div>

            <!-- VÔLEI -->
            <div class="sport-card" data-name="volei quadra praia saque bloqueio" data-community-name="Vôlei">
                <img src="volei.jpg.jpeg" alt="Vôlei">
                <div class="sport-info">
                    <h3>Vôlei</h3>
                    <p>Saques, bloqueios e defesas incríveis. Quadra e praia, tudo no mesmo lugar.</p>
                </div>
                <button class="follow-btn community-join-btn" data-community-name="Vôlei">Seguir</button>
            </div>

            <!-- CAPOEIRA -->
            <div class="sport-card" data-name="capoeira luta cultura berimbau roda" data-community-name="Capoeira">
                <img src="capoeira-og.jpg.webp" alt="Capoeira">
                <div class="sport-info">
                    <h3>Capoeira</h3>
                    <p>História, cultura e ginga. Rodas, treinos, eventos e tudo sobre a arte da capoeira.</p>
                </div>
                <button class="follow-btn community-join-btn" data-community-name="Capoeira">Seguir</button>
            </div>

            <!-- VÔLEI PROFISSIONAL (GIBA) -->
            <div class="sport-card" data-name="volei profissional giba seleção" data-community-name="Vôlei Profissional">
                <img src="giba.jpg.jpeg" alt="Vôlei Profissional">
                <div class="sport-info">
                    <h3>Vôlei Profissional</h3>
                    <p>Jogos da seleção, ligas internacionais e os monstros da quadra – do saque ao bloqueio.</p>
                </div>
                <button class="follow-btn community-join-btn" data-community-name="Vôlei Profissional">Seguir</button>
            </div>

            <!-- BOXE -->
            <div class="sport-card" data-name="boxe luta ringue nocaute" data-community-name="Boxe">
                <img src="boxe.jpeg" alt="Boxe">
                <div class="sport-info">
                    <h3>Boxe</h3>
                    <p>Treinos, cinturões, história e grandes lutas. Onde o jab e o direto falam mais alto.</p>
                </div>
                <button class="follow-btn community-join-btn" data-community-name="Boxe">Seguir</button>
            </div>
        </div>
    </main>

    <!-- SIDEBAR DIREITA -->
    <aside class="right-sidebar">
        <div class="sidebar-section">
            <h4>Comunidades sugeridas</h4>
            <div class="community-card" data-community-name="Fãs de Basquete">
                <img src="Gemini_Generated_Image_kb5xt0kb5xt0kb5x.png" alt="Basquete">
                <div>
                    <h5>Fãs de Basquete</h5>
                    <p>12k membros</p>
                </div>
                <button class="follow-btn" data-community-name="Fãs de Basquete">Seguir</button>
            </div>
            <div class="community-card" data-community-name="Muscle Gang">
                <img src="academia.png" alt="Musculação">
                <div>
                    <h5>Muscle Gang</h5>
                    <p>5k membros</p>
                </div>
                <button class="follow-btn" data-community-name="Muscle Gang">Seguir</button>
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
                <img src="Captura de tela 2025-09-23 214159.png" alt="emerigoniok">
                <div>
                    <h5>emerigoniok</h5>
                    <p>@Emi_Rigoni</p>
                </div>
                <button class="follow-btn">Seguir</button>
            </div>
        </div>
    </aside>
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
