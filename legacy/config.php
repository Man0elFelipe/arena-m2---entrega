<?php
require_once 'auth.php';
require_once 'get_user_data.php';
$titulo = "Configurações | Arena+";
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

    <!-- Estilo extra só para a tela de configurações -->
    <style>
        body {
            background: var(--bg-light);
            font-family: Arial, sans-serif;
        }

        .config-wrapper {
            max-width: 1100px;
            margin: 20px auto;
            display: grid;
            grid-template-columns: 260px 1fr;
            gap: 20px;
        }

        .config-sidebar {
            background: var(--card-bg-light);
            border-radius: 12px;
            padding: 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            height: fit-content;
        }

        .config-sidebar h2 {
            font-size: 18px;
            margin-bottom: 10px;
        }

        .config-sidebar p {
            font-size: 13px;
            color: var(--border-gray);
            margin-bottom: 14px;
        }

        .config-nav {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .config-nav-btn {
            width: 100%;
            text-align: left;
            padding: 8px 10px;
            border-radius: 8px;
            border: 1px solid transparent;
            background: none;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .config-nav-btn i {
            font-size: 15px;
        }

        .config-nav-btn.active {
            background: #e7f0ff;
            border-color: var(--primary-blue);
            color: var(--primary-blue);
        }

        .config-main {
            background: var(--card-bg-light);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .config-section {
            display: none;
        }

        .config-section.active {
            display: block;
        }

        .config-section h3 {
            margin-bottom: 6px;
        }

        .config-section p {
            font-size: 13px;
            color: var(--border-gray);
            margin-bottom: 16px;
        }

        .config-form-group {
            margin-bottom: 12px;
        }

        .config-form-group label {
            font-size: 13px;
            font-weight: bold;
        }

        .config-form-group input,
        .config-form-group textarea,
        .config-form-group select {
            width: 100%;
            padding: 8px 10px;
            border-radius: 8px;
            border: 1px solid var(--border-gray);
            margin-top: 4px;
            font-size: 13px;
            outline: none;
        }

        .config-form-group textarea {
            resize: vertical;
        }

        .config-photo-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 6px;
        }

        .config-photo-row img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
        }

        .config-save-row {
            margin-top: 14px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            align-items: center;
        }

        .config-save-btn {
            padding: 8px 14px;
            border-radius: 999px;
            border: none;
            background: var(--primary-blue);
            color: #fff;
            font-size: 13px;
            cursor: pointer;
        }

        .config-status {
            font-size: 12px;
            color: var(--border-gray);
        }

        .toggle-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid rgba(0,0,0,0.06);
        }

        .toggle-row:last-child {
            border-bottom: none;
        }

        .toggle-row span {
            font-size: 14px;
        }

        .toggle-row small {
            display: block;
            font-size: 11px;
            color: var(--border-gray);
            margin-top: 2px;
        }

        .config-toggle {
            width: 40px;
            height: 20px;
            border-radius: 999px;
            background: #d1d5db;
            position: relative;
            cursor: pointer;
        }

        .config-toggle-circle {
            position: absolute;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #fff;
            top: 2px;
            left: 2px;
            transition: 0.15s;
        }

        .config-toggle.active {
            background: var(--primary-blue);
        }

        .config-toggle.active .config-toggle-circle {
            left: 22px;
        }

        .danger-zone {
            margin-top: 20px;
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(255,107,53,0.5);
            background: rgba(255,107,53,0.05);
        }

        .danger-zone h4 {
            color: var(--highlight-orange);
            margin-bottom: 4px;
        }

        .danger-zone p {
            font-size: 12px;
            color: var(--border-gray);
            margin-bottom: 8px;
        }

        .danger-btn {
            padding: 6px 12px;
            border-radius: 8px;
            border: 1px solid var(--highlight-orange);
            background: transparent;
            color: var(--highlight-orange);
            font-size: 12px;
            cursor: pointer;
        }

        @media (max-width: 900px) {
            .config-wrapper {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body <?php echo bodyDataAtributos(); ?>>

<div class="config-wrapper">
    <!-- LADO ESQUERDO: MENU -->
    <aside class="config-sidebar">
        <h2>Configurações</h2>
        <p>Personalize sua experiência dentro da Arena+.</p>

        <div class="config-nav">
            <button class="config-nav-btn active" data-section="conta">
                <i class="fas fa-user"></i> Conta
            </button>
            <button class="config-nav-btn" data-section="privacidade">
                <i class="fas fa-lock"></i> Privacidade
            </button>
            <button class="config-nav-btn" data-section="notificacoes">
                <i class="fas fa-bell"></i> Notificações
            </button>
            <button class="config-nav-btn" data-section="aparencia">
                <i class="fas fa-moon"></i> Aparência
            </button>
        </div>
    </aside>

    <!-- LADO DIREITO: CONTEÚDO -->
    <main class="config-main">
        <!-- CONTA -->
        <section id="config-conta" class="config-section active">
            <h3>Conta</h3>
            <p>Atualize seus dados de perfil. Essas informações aparecem no feed, chat e comunidades.</p>

            <form id="config-profile-form">
                <div class="config-form-group">
                    <label for="conf-name">Nome</label>
                    <input type="text" id="conf-name" placeholder="Seu nome">
                </div>

                <div class="config-form-group">
                    <label for="conf-username">Nome de usuário</label>
                    <input type="text" id="conf-username" placeholder="@seuuser">
                </div>

                <div class="config-form-group">
                    <label for="conf-bio">Biografia</label>
                    <textarea id="conf-bio" rows="3"
                              placeholder="Fale um pouco sobre você, seus esportes favoritos, etc."></textarea>
                </div>

                <div class="config-form-group">
                    <label>Foto de perfil</label>
                    <div class="config-photo-row">
                        <img id="conf-photo-preview" src="jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg" alt="Foto de perfil">
                        <div>
                            <input type="file" id="conf-photo-input" accept="image/*">
                            <small style="font-size:11px;color:var(--border-gray);">
                                Formatos aceitos: JPG, PNG. A foto aparece em todo o app.
                            </small>
                        </div>
                    </div>
                </div>

                <div class="config-save-row">
                    <span id="config-profile-status" class="config-status"></span>
                    <button type="submit" class="config-save-btn">Salvar alterações</button>
                </div>
            </form>

            <div class="danger-zone">
                <h4>Zona de risco</h4>
                <p>
                    Essas opções são apenas ilustrativas para o trabalho da FATEC, não excluem dados reais.
                </p>
                <button class="danger-btn" type="button" onclick="alert('Aqui seria a exclusão de conta em um sistema real. 😉')">
                    Solicitar exclusão da conta
                </button>
            </div>
        </section>

        <!-- PRIVACIDADE -->
        <section id="config-privacidade" class="config-section">
            <h3>Privacidade</h3>
            <p>Controle quem pode ver o que você faz dentro da Arena+.</p>

            <div class="toggle-row">
                <div>
                    <span>Conta privada</span>
                    <small>Apenas seguidores aprovados podem ver suas publicações.</small>
                </div>
                <div class="config-toggle" data-toggle="conta-privada">
                    <div class="config-toggle-circle"></div>
                </div>
            </div>

            <div class="toggle-row">
                <div>
                    <span>Mostrar esportes favoritos</span>
                    <small>Exibe as comunidades de esportes que você mais interage.</small>
                </div>
                <div class="config-toggle active" data-toggle="mostrar-esportes">
                    <div class="config-toggle-circle"></div>
                </div>
            </div>

            <div class="toggle-row">
                <div>
                    <span>Permitir mensagens de qualquer pessoa</span>
                    <small>Se desativado, apenas quem você segue poderá te enviar mensagens.</small>
                </div>
                <div class="config-toggle active" data-toggle="mensagens-gerais">
                    <div class="config-toggle-circle"></div>
                </div>
            </div>
        </section>

        <!-- NOTIFICAÇÕES -->
        <section id="config-notificacoes" class="config-section">
            <h3>Notificações</h3>
            <p>Escolha o que você quer ser avisado dentro da Arena+.</p>

            <div class="toggle-row">
                <div>
                    <span>Novas publicações em comunidades</span>
                    <small>Seus esportes favoritos sempre em dia.</small>
                </div>
                <div class="config-toggle active" data-toggle="notif-comunidades">
                    <div class="config-toggle-circle"></div>
                </div>
            </div>

            <div class="toggle-row">
                <div>
                    <span>Novos seguidores</span>
                    <small>Seja avisado quando alguém começar a te seguir.</small>
                </div>
                <div class="config-toggle active" data-toggle="notif-seguidores">
                    <div class="config-toggle-circle"></div>
                </div>
            </div>

            <div class="toggle-row">
                <div>
                    <span>Mensagens diretas</span>
                    <small>Receba alertas de novas conversas no chat.</small>
                </div>
                <div class="config-toggle active" data-toggle="notif-chat">
                    <div class="config-toggle-circle"></div>
                </div>
            </div>
        </section>

        <!-- APARÊNCIA -->
        <section id="config-aparencia" class="config-section">
            <h3>Aparência</h3>
            <p>Altere o visual da Arena+ de acordo com o seu gosto.</p>

            <div class="config-form-group">
                <label for="conf-theme-select">Tema</label>
                <select id="conf-theme-select">
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                </select>
                <small style="font-size:11px;color:var(--border-gray);">
                    Isso usa o mesmo controle de tema do app (botão “Alterar Tema”).
                </small>
            </div>

            <div class="config-form-group">
                <label for="conf-font-size">Tamanho da fonte (visual)</label>
                <select id="conf-font-size">
                    <option value="padrao">Padrão</option>
                    <option value="maior">Levemente maior</option>
                    <option value="menor">Levemente menor</option>
                </select>
                <small style="font-size:11px;color:var(--border-gray);">
                    Essa opção é apenas ilustrativa (não altera a fonte real).
                </small>
            </div>
        </section>
    </main>
</div>

<script src="index.js?v=31"></script>
<script>
    // Navegação entre abas
    document.querySelectorAll('.config-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;

            document.querySelectorAll('.config-nav-btn')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.config-section')
                .forEach(sec => sec.classList.remove('active'));

            const target = document.getElementById('config-' + section);
            if (target) target.classList.add('active');
        });
    });

    // Toggles visuais
    document.querySelectorAll('.config-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
        });
    });

    // Integração com o perfil (usa funções do index.js se existirem)
    document.addEventListener('DOMContentLoaded', () => {
        const hasPerfilFuncs = typeof window.obterPerfil === 'function' &&
                               typeof window.salvarPerfil === 'function';

        const nomeInput = document.getElementById('conf-name');
        const userInput = document.getElementById('conf-username');
        const bioInput  = document.getElementById('conf-bio');
        const photoPreview = document.getElementById('conf-photo-preview');
        const photoInput   = document.getElementById('conf-photo-input');
        const statusEl  = document.getElementById('config-profile-status');
        const form      = document.getElementById('config-profile-form');

        let perfilLocal = null;

        function carregarPerfil() {
            if (hasPerfilFuncs) {
                perfilLocal = window.obterPerfil();
            } else {
                perfilLocal = {
                    nome: 'Usuário Arena+',
                    usuario: '@usuario',
                    bio: '',
                    foto: null
                };
            }

            nomeInput.value = perfilLocal.nome || '';
            userInput.value = perfilLocal.usuario || '';
            bioInput.value  = perfilLocal.bio || '';
            if (perfilLocal.foto) {
                photoPreview.src = perfilLocal.foto;
            }
        }

        carregarPerfil();

        // Foto de perfil (preview local)
        photoInput.addEventListener('change', () => {
            const file = photoInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                photoPreview.src = ev.target.result;
                perfilLocal.foto = ev.target.result;
            };
            reader.readAsDataURL(file);
        });

        // Salvar perfil
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (!perfilLocal) return;

            perfilLocal.nome = nomeInput.value.trim() || perfilLocal.nome;
            let user = userInput.value.trim();
            if (user && !user.startsWith('@')) user = '@' + user;
            perfilLocal.usuario = user || perfilLocal.usuario;
            perfilLocal.bio = bioInput.value.trim();

            if (hasPerfilFuncs) {
                window.salvarPerfil(perfilLocal);
                // atualiza texto/foto no restante do app que estiver aberto
                if (typeof window.aplicarPerfilNaPagina === 'function') {
                    window.aplicarPerfilNaPagina();
                }
            }

            statusEl.textContent = 'Alterações salvas!';
            setTimeout(() => statusEl.textContent = '', 2000);
        });

        // Tema (sincroniza com o sistema de tema do index.js)
        const themeSelect = document.getElementById('conf-theme-select');
        if (typeof window.obterTemaSalvo === 'function') {
            const temaAtual = window.obterTemaSalvo();
            themeSelect.value = temaAtual === 'dark' ? 'dark' : 'light';
        }

        themeSelect.addEventListener('change', () => {
            const valor = themeSelect.value;
            if (typeof window.salvarTema === 'function' &&
                typeof window.aplicarTemaSalvo === 'function') {
                window.salvarTema(valor === 'dark' ? 'dark' : 'light');
                window.aplicarTemaSalvo();
            }
        });
    });
</script>
</body>
</html>