<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Comunidade | Arena+</title>
    <link rel="stylesheet" href="/style.css?v=31">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="icon" href="/LOGOARENA+PST.png" type="image/x-icon">
</head>
<body data-page="comunidade-admin" data-community-id="{{COMMUNITY_ID}}" {{BODY_DATA}}>
<header>
    <div class="header-content">
        <div class="logo"><img src="/LOGOARENA+PST.png" alt="LOGOARENA+PST"></div>
        <div class="search-bar"><i class="fas fa-search"></i><input type="text" placeholder="Administração"></div>
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
        <nav class="sidebar-nav">
            <ul>
                <li><a id="admin-back-link"><i class="fas fa-arrow-left"></i> Voltar à comunidade</a></li>
                <li><a id="alterar-tema"><i class="fas fa-moon"></i> Alterar Tema</a></li>
            </ul>
        </nav>
    </aside>
    <main class="communities-main">
        <div class="communities-header"><h2>Painel da comunidade</h2><p id="admin-status">Carregando permissões...</p></div>
        <section class="create-post-box" id="admin-panel" hidden>
            <div class="config-form-group"><label>Nome</label><input id="admin-name" type="text"></div>
            <div class="config-form-group"><label>Categoria</label><input id="admin-category" type="text" placeholder="futebol, academia, lutas..."></div>
            <div class="config-form-group"><label>Avatar da comunidade</label><input id="admin-avatar" type="text" placeholder="URL ou caminho da imagem"></div>
            <div class="config-form-group"><label>Foto de capa</label><input id="admin-cover" type="text" placeholder="URL ou caminho da imagem"></div>
            <div class="config-form-group"><label>Descrição</label><textarea id="admin-description" rows="3"></textarea></div>
            <div class="post-options"><button id="admin-save"><i class="fas fa-save"></i> Salvar</button></div>
        </section>
        <section id="admin-members"></section>
        <section id="admin-posts"></section>
    </main>
</div>
<script src="/index.js?v=31"></script>
<script src="/comunidade_app.js?v=1"></script>
</body>
</html>
