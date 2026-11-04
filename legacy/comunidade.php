<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comunidade | Arena+</title>
    <link rel="stylesheet" href="/style.css?v=31">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="icon" href="/LOGOARENA+PST.png" type="image/x-icon">
</head>
<body data-page="comunidade" data-community-id="{{COMMUNITY_ID}}" {{BODY_DATA}}>
<header>
    <div class="header-content">
        <div class="logo"><img src="/LOGOARENA+PST.png" alt="LOGOARENA+PST"></div>
        <div class="search-bar"><i class="fas fa-search"></i><input type="text" id="global-search" placeholder="Pesquisar comunidades"></div>
        <nav class="main-nav">
            <ul>
                <li><a href="/feed"><i class="fas fa-home"></i> Início</a></li>
                <li><a href="/communities/discover" class="active"><i class="fas fa-users"></i> Comunidades</a></li>
                <li><a href="/coach"><i class="fas fa-comments"></i> Chat</a></li>
            </ul>
        </nav>
        <div class="user-profile"><a href="/profile"><img src="{{USER_PHOTO}}" class="js-profile-photo"></a></div>
    </div>
</header>

<div class="main-container">
    <aside class="left-sidebar">
        <div class="profile-info">
            <img src="{{USER_PHOTO}}" class="js-profile-photo">
            <h4 class="js-profile-name">{{USER_NAME}}</h4>
            <p class="js-profile-username">{{USER_USERNAME}}</p>
        </div>
        <nav class="sidebar-nav">
            <ul>
                <li><a href="/communities/discover"><i class="fas fa-compass"></i> Descobrir</a></li>
                <li><a href="/feed"><i class="fas fa-home"></i> Feed geral</a></li>
                <li><a id="alterar-tema"><i class="fas fa-moon"></i> Alterar Tema</a></li>
                <li><a href="/logout"><i class="fas fa-sign-out-alt"></i> Sair</a></li>
            </ul>
        </nav>
    </aside>

    <main class="profile-container">
        <section class="profile-header" id="community-header">
            <div class="profile-cover" id="community-cover"></div>
            <img src="/LOGOARENA+PST.png" class="profile-photo" id="community-avatar" alt="Comunidade">
            <div class="profile-info-details">
                <h2 id="community-name">Comunidade</h2>
                <p id="community-meta">Carregando...</p>
            </div>
            <p class="profile-bio" id="community-description"></p>
            <button id="community-join-toggle" class="edit-profile-btn"><i class="fas fa-user-plus"></i> Entrar</button>
        </section>

        <nav class="profile-nav">
            <a class="profile-nav-item active" id="community-feed-link">Feed</a>
            <a class="profile-nav-item" id="community-members-link">Membros</a>
            <a class="profile-nav-item" id="community-admin-link">Admin</a>
        </nav>

        <section class="profile-content">
            <div class="create-post-box">
                <div class="top-create">
                    <img src="{{USER_PHOTO}}" class="js-profile-photo">
                    <textarea id="community-post-text" placeholder="Publique nesta comunidade..." rows="2"></textarea>
                </div>
                <div class="post-options">
                    <button id="community-post-btn"><i class="fas fa-paper-plane"></i> Publicar</button>
                </div>
            </div>
            <div id="pinned-posts"></div>
            <div id="community-feed"></div>
        </section>
    </main>
</div>

<script src="/index.js?v=31"></script>
<script src="/comunidade_app.js?v=1"></script>
</body>
</html>
