<?php
require_once 'auth.php';
require_once 'get_user_data.php';
$titulo = "Chat | Arena+";
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
                <li><a href="/feed"><i class="fas fa-home"></i> Início</a></li>
                <li><a href="/comunidades"><i class="fas fa-users"></i> Comunidades</a></li>
                <li><a href="/coach" class="active"><i class="fas fa-comments"></i> Chat</a></li>
                <li><a href="#" id="notif-toggle"><i class="fas fa-bell"></i> Notificações</a></li>
            </ul>
        </nav>

        <div class="user-profile">
            <a href="/profile">
                <img src="<?= htmlspecialchars($fotoPerfil) ?>" class="js-profile-photo">
            </a>
            <button class="publish-btn">
                <i class="fas fa-plus"></i> Publicar
            </button>
        </div>
    </div>
</header>

<div id="notif-panel" class="notif-panel">
    <div class="notif-header">
        <h4>Notificações</h4>
        <button id="notif-close"><i class="fas fa-times"></i></button>
    </div>
    <ul class="notif-list">
        <li>
            <p><strong>ArenaBot</strong>: “Tem dúvida sobre algum recurso? Me manda aí!”</p>
            <span class="notif-time">Há 15 min</span>
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
                <li><a href="/feed"><i class="fas fa-plus-circle"></i> Criar Publicação</a></li>
                <li><a id="alterar-tema"><i class="fas fa-moon"></i> Alterar Tema</a></li>
                <li><a href="/settings"><i class="fas fa-cog"></i> Configurações</a></li>
                <li><a href="/logout"><i class="fas fa-sign-out-alt"></i> Sair</a></li>
            </ul>
        </nav>
    </aside>

    <!-- CHAT CENTRAL -->
    <main class="chat-main">
        <div class="chat-username-bar">
            <span class="js-profile-name"><?= htmlspecialchars($usuarioAtual['nome']) ?></span>
            <span class="chat-dot">•</span>
            <span style="font-size:13px;color:var(--border-gray)">Mensagens</span>
        </div>

        <div class="chat-layout">
            <!-- LISTA DE CONVERSAS -->
            <section class="chat-thread-list">
                <div class="thread-list-header">
                    <h3>Mensagens</h3>
                </div>

                <div class="chat-thread active" data-chat-id="arenabot">
                    <img src="LOGOARENA+PST.png" alt="ArenaBot">
                    <div class="thread-info">
                        <h4>ArenaBot</h4>
                        <p>Assistente da Arena+ • online</p>
                    </div>
                </div>

                <div class="chat-thread" data-chat-id="kaka">
                    <img src="121440.jpg.jpeg" alt="Kaká">
                    <div class="thread-info">
                        <h4>Kaká</h4>
                        <p>“Glória a Deus por mais uma...”</p>
                    </div>
                </div>

                <div class="chat-thread" data-chat-id="giba">
                    <img src="giba.jpg.jpeg" alt="Giba">
                    <div class="thread-info">
                        <h4>Giba</h4>
                        <p>“Partiu treino de saque?”</p>
                    </div>
                </div>
            </section>

            <!-- CONVERSA ABERTA -->
            <section class="chat-conversation">
                <div class="chat-header-bar">
                    <div class="chat-header-user">
                        <img id="chat-contact-avatar" src="LOGOARENA+PST.png" alt="Contato">
                        <div>
                            <h4 id="chat-contact-name">ArenaBot</h4>
                            <p id="chat-contact-status">Assistente da Arena+ • online</p>
                        </div>
                    </div>
                </div>

                <div class="chat-window" id="chat-window">
                    <!-- mensagens via JS -->
                </div>

                <div class="coach-tools">
                    <input type="file" id="coach-image" accept="image/*" hidden>
                    <button type="button" id="coach-upload-btn"><i class="fas fa-camera"></i> Analisar imagem</button>
                    <button type="button" id="coach-generate-btn"><i class="fas fa-wand-magic-sparkles"></i> Gerar imagem</button>
                </div>

                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Pergunte sobre treino, alimentação ou desafios...">
                    <button id="chat-send"><i class="fas fa-paper-plane"></i></button>
                </div>
            </section>
        </div>
    </main>

    <!-- SIDEBAR DIREITA -->
    <aside class="right-sidebar">
        <div class="sidebar-section">
            <h4>Dicas de conversa</h4>
            <p class="sidebar-tip-title">Pergunte pro ArenaBot:</p>
            <ul class="sidebar-tips">
                <li>“Monte um pré-treino para musculação.”</li>
                <li>“Crie um desafio Gym Rats.”</li>
                <li>“Analise minha refeição pela foto.”</li>
                <li>“Gere uma imagem para post de corrida.”</li>
            </ul>
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
<script>
document.addEventListener('DOMContentLoaded', function () {
    const botao = document.getElementById('coach-generate-btn');
    const input = document.getElementById('chat-input');
    const janela = document.getElementById('chat-window');
    if (!botao || !input || !janela) return;

    function avatarBot() {
        return 'LOGOARENA+PST.png';
    }

    function addMsg(origem, conteudo, isImage) {
        const msg = document.createElement('div');
        msg.className = 'chat-message ' + origem;
        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar';
        const imgAvatar = document.createElement('img');
        imgAvatar.src = origem === 'bot' ? avatarBot() : (document.body.dataset.foto || 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg');
        avatar.appendChild(imgAvatar);
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        if (isImage) {
            const img = document.createElement('img');
            img.src = conteudo;
            img.alt = 'Imagem gerada pelo Arena Coaching';
            img.className = 'coach-generated-image';
            bubble.appendChild(img);
        } else {
            const p = document.createElement('p');
            p.textContent = conteudo;
            bubble.appendChild(p);
        }
        if (origem === 'user') {
            msg.appendChild(bubble);
            msg.appendChild(avatar);
        } else {
            msg.appendChild(avatar);
            msg.appendChild(bubble);
        }
        janela.appendChild(msg);
        janela.scrollTop = janela.scrollHeight;
        return msg;
    }

    botao.addEventListener('click', async function () {
        const prompt = input.value.trim();
        if (!prompt) {
            input.placeholder = 'Descreva a imagem: atleta treinando, post motivacional...';
            input.focus();
            return;
        }

        addMsg('user', 'Gerar imagem: ' + prompt, false);
        const loading = addMsg('bot', 'Gerando imagem...', false);
        input.value = '';
        botao.disabled = true;

        const fd = new FormData();
        fd.append('acao', 'gerar_imagem');
        fd.append('prompt', prompt);

        try {
            const res = await fetch('/api/coach', { method: 'POST', body: fd, cache: 'no-store' });
            const data = await res.json();
            loading.remove();
            if (!data.ok) throw new Error(data.erro || 'Não consegui gerar a imagem.');
            addMsg('bot', data.imagem_url, true);
        } catch (err) {
            loading.remove();
            addMsg('bot', err.message, false);
        } finally {
            botao.disabled = false;
        }
    });
});
</script>
</body>
</html>
