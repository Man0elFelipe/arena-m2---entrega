<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Descobrir Comunidades | Arena+</title>
    <link rel="stylesheet" href="style.css?v=31">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="icon" href="LOGOARENA+PST.png" type="image/x-icon">
</head>
<body data-page="comunidades-descobrir" {{BODY_DATA}}>
<header>
    <div class="header-content">
        <div class="logo"><img src="LOGOARENA+PST.png" alt="LOGOARENA+PST"></div>
        <div class="search-bar"><i class="fas fa-search"></i><input type="text" id="communities-search" placeholder="Buscar comunidades"></div>
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
                <li><a href="/comunidades"><i class="fas fa-users"></i> Esportes</a></li>
                <li><a href="/feed"><i class="fas fa-home"></i> Feed geral</a></li>
                <li><a id="alterar-tema"><i class="fas fa-moon"></i> Alterar Tema</a></li>
                <li><a href="/logout"><i class="fas fa-sign-out-alt"></i> Sair</a></li>
            </ul>
        </nav>
    </aside>
    <main class="communities-main">
        <div class="communities-header">
            <h2>Descobrir comunidades</h2>
            <p>Encontre grupos por esporte, categoria ou assunto e entre no feed dedicado.</p>
        </div>
        <div class="post-options">
            <button class="community-filter active" data-category=""><i class="fas fa-layer-group"></i> Todas</button>
            <button class="community-filter" data-category="futebol">Futebol</button>
            <button class="community-filter" data-category="academia">Academia</button>
            <button class="community-filter" data-category="lutas">Lutas</button>
            <button class="community-filter" data-category="quadra">Quadra</button>
        </div>
        <div class="create-post-box">
            <div class="top-create">
                <textarea id="new-community-name" placeholder="Criar comunidade esportiva..." rows="1"></textarea>
            </div>
            <div class="config-form-group"><input id="new-community-category" type="text" placeholder="Categoria: futebol, corrida, academia..."></div>
            <div class="config-form-group"><textarea id="new-community-description" rows="2" placeholder="Descrição da comunidade"></textarea></div>
            <div class="post-options"><button id="new-community-btn"><i class="fas fa-plus"></i> Criar comunidade</button></div>
        </div>
        <div class="sports-grid" id="communities-list"></div>
    </main>
</div>

<script src="index.js?v=31"></script>
<script src="comunidade_app.js?v=1"></script>
</body>
</html>
