/* ============================================
   PERFIL — dados vêm da sessão PHP
   O <body> deve ter:
     data-nome="..."  data-username="..."
     data-bio="..."   data-foto="..."
============================================ */

let perfilCache = null;

function obterPerfil() {
    if (perfilCache) return perfilCache;
    const b = document.body;
    perfilCache = {
        nome:    b.dataset.nome     || 'Usuário',
        usuario: b.dataset.username || '@usuario',
        bio:     b.dataset.bio      || '',
        foto:    b.dataset.foto     || null,
        cidade:  b.dataset.cidade   || '',
        esporte: b.dataset.esporte  || '',
        modalidade: b.dataset.modalidade || ''
    };
    return perfilCache;
}

// Mantido para compatibilidade com config.php (salva via AJAX)
function salvarPerfil(p) { perfilCache = p; }

function aplicarPerfilNaPagina() {
    const p = obterPerfil();
    document.querySelectorAll('.js-profile-name').forEach(el => el.textContent = p.nome);
    document.querySelectorAll('.js-profile-username').forEach(el => el.textContent = p.usuario);
    document.querySelectorAll('.js-profile-bio').forEach(el => el.textContent = p.bio);
    document.querySelectorAll('.js-profile-city').forEach(el => el.textContent = p.cidade ? p.cidade : '');
    document.querySelectorAll('.js-profile-sport').forEach(el => el.textContent = p.esporte ? ` • ${p.esporte}` : '');
    document.querySelectorAll('.js-profile-role').forEach(el => el.textContent = p.modalidade ? ` • ${p.modalidade}` : '');
    if (p.foto) {
        document.querySelectorAll('.js-profile-photo').forEach(img => img.src = p.foto);
    }
}

async function carregarPerfilDoServidor() {
    try {
        const res = await fetch('/api/usuario', { cache: 'no-store' });
        const data = await res.json();
        if (!data.ok || !data.usuario) return;

        document.body.dataset.nome = data.usuario.nome || 'Usuário';
        document.body.dataset.username = data.usuario.username || '@usuario';
        document.body.dataset.bio = data.usuario.bio || '';
        document.body.dataset.cidade = data.usuario.cidade || '';
        document.body.dataset.esporte = data.usuario.esporte_favorito || '';
        document.body.dataset.modalidade = data.usuario.posicao_modalidade || '';
        if (data.usuario.foto) document.body.dataset.foto = data.usuario.foto;

        perfilCache = null;
        aplicarPerfilNaPagina();
    } catch (err) {
        console.warn('Não foi possível carregar o perfil do servidor.', err);
    }
}

// Funções legadas — não fazem mais nada (login agora é PHP)
function inicializarLogin() {}
window.obterPerfil   = obterPerfil;
window.salvarPerfil  = salvarPerfil;
window.aplicarPerfilNaPagina = aplicarPerfilNaPagina;

/* ============================================
   TEMA (mantém no localStorage — é preferência visual, não conta)
============================================ */
const TEMA_STORAGE = 'arena_theme';

function obterTema()      { return localStorage.getItem(TEMA_STORAGE) || 'light'; }
function salvarTema(t)    { localStorage.setItem(TEMA_STORAGE, t); }
window.obterTemaSalvo     = obterTema;
window.salvarTema         = salvarTema;

function aplicarTema(tema) {
    const isDark = tema === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    document.documentElement.classList.toggle('dark-theme', isDark);
}
window.aplicarTemaSalvo = () => aplicarTema(obterTema());

function alternarTema() {
    const novo = obterTema() === 'dark' ? 'light' : 'dark';
    salvarTema(novo);
    aplicarTema(novo);
}

function inicializarAlterarTema() {
    aplicarTema(obterTema());
    const btn = document.getElementById('alterar-tema');
    if (btn) btn.addEventListener('click', e => { e.preventDefault(); alternarTema(); });
}

/* ============================================
   MODAL CONFIGURAÇÕES
============================================ */
function inicializarModalConfig() {
    const modal = document.getElementById('config-modal');
    const close = document.getElementById('close-config');
    if (!modal) return;
    document.querySelectorAll('.config-link').forEach(link => {
        link.addEventListener('click', e => { e.preventDefault(); modal.style.display = 'flex'; });
    });
    if (close) close.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
}

/* ============================================
   NOTIFICAÇÕES
============================================ */
function inicializarNotificacoes() {
    const panel  = document.getElementById('notif-panel');
    const toggle = document.getElementById('notif-toggle');
    const close  = document.getElementById('notif-close');
    if (!panel || !toggle) return;
    toggle.addEventListener('click', e => {
        e.preventDefault();
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });
    if (close) close.addEventListener('click', () => panel.style.display = 'none');
    document.addEventListener('click', e => {
        if (!panel.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
            panel.style.display = 'none';
        }
    });

    fetch('/api/notifications', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            if (!data.ok) return;
            const list = panel.querySelector('.notif-list');
            if (!list) return;
            list.innerHTML = data.notificacoes.length
                ? data.notificacoes.map(n => `
                    <li>
                        ${n.lida ? '' : '<span class="notif-dot"></span>'}
                        <p>${escTexto(n.mensagem)}</p>
                        <span class="notif-time">${tempoCurto(n.criado_em)}</span>
                    </li>`).join('')
                : '<li><p>Sem notificações novas.</p></li>';
        })
        .catch(() => {});
}

function escTexto(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}

function tempoCurto(dataStr) {
    const data = new Date(String(dataStr).replace(' ', 'T'));
    const diff = (Date.now() - data.getTime()) / 1000;
    if (Number.isNaN(diff) || diff < 60) return 'Agora';
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
    return data.toLocaleDateString('pt-BR');
}

function midiaPostHtml(post) {
    if (!post || !post.midia_url) return '';
    const url = escTexto(post.midia_url);
    return post.midia_tipo === 'video'
        ? `<video controls src="${url}"></video>`
        : `<img src="${url}" alt="Publicação">`;
}

function postHtml(post) {
    const curtido = Number(post.curtido_por_mim || 0) === 1;
    const comunidade = post.comunidade_nome ? `<span>#${escTexto(post.comunidade_nome)}</span>` : '';
    return `
        <div class="post" data-post-id="${escTexto(post.id || '')}">
            <div class="post-header">
                <img src="${escTexto(post.foto_perfil || 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg')}">
                <div class="post-info">
                    <h4>${escTexto(post.nome || 'Usuário')}</h4>
                    <span>@${escTexto(String(post.username || 'usuario').replace(/^@/, ''))}</span>
                    ${comunidade}
                    <p class="post-time">${tempoCurto(post.criado_em)}</p>
                </div>
            </div>
            <div class="post-content"><p>${escTexto(post.texto || '')}</p>${midiaPostHtml(post)}</div>
            <div class="post-actions">
                <button data-like-count="${Number(post.total_curtidas || 0)}"><i class="fas fa-heart"></i> ${curtido ? 'Curtido' : 'Curtir'}${Number(post.total_curtidas || 0) ? ` (${Number(post.total_curtidas || 0)})` : ''}</button>
                <button data-comment-count="${Number(post.total_comentarios || 0)}"><i class="fas fa-comment"></i> Comentar${Number(post.total_comentarios || 0) ? ` (${Number(post.total_comentarios || 0)})` : ''}</button>
                <button><i class="fas fa-share"></i> Compartilhar</button>
            </div>
        </div>`;
}

function inicializarPostsRenderizados(container) {
    if (!container) return;
    inicializarCurtirPosts();
    inicializarComentarios();
}

function carregarFeedPrincipal() {
    const box = document.getElementById('feed-posts');
    if (!box) return;
    fetch('/api/posts?acao=feed&pagina=1', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            if (!data.ok) return;
            box.innerHTML = data.posts.length
                ? data.posts.map(postHtml).join('')
                : '<div class="post"><div class="post-content"><p>Nenhuma publicação ainda.</p></div></div>';
            inicializarPostsRenderizados(box);
        })
        .catch(() => {
            box.innerHTML = '<div class="post"><div class="post-content"><p>Não foi possível carregar o feed agora.</p></div></div>';
        });
}

function carregarPostsPerfil() {
    const perfil = document.querySelector('.profile-container');
    const editBtn = document.getElementById('edit-profile-btn');
    const contents = document.querySelectorAll('.profile-content .tab-content');
    if (!perfil || !editBtn || !contents.length) return;
    const box = contents[0];
    fetch('/api/posts?acao=perfil', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            if (!data.ok) return;
            box.innerHTML = data.posts.length
                ? data.posts.map(postHtml).join('')
                : '<div class="post"><div class="post-content"><p>Você ainda não publicou nada.</p></div></div>';
            inicializarPostsRenderizados(box);
        })
        .catch(() => {});
}

/* ============================================
   BUSCA – COMUNIDADES
============================================ */
function filtrarComunidades(term) {
    const grid      = document.getElementById('sports-grid');
    const noResults = document.getElementById('no-results');
    if (!grid) return;
    const termo = term.toLowerCase();
    let count = 0;
    grid.querySelectorAll('.sport-card').forEach(card => {
        const visible = !termo || (card.dataset.name || card.innerText).toLowerCase().includes(termo);
        card.style.display = visible ? 'flex' : 'none';
        if (visible) count++;
    });
    if (noResults) noResults.style.display = (termo && count === 0) ? 'block' : 'none';
}

function inicializarBusca() {
    const inp = document.getElementById('global-search');
    if (!inp) return;
    const grid = document.getElementById('sports-grid');
    const q = new URL(window.location.href).searchParams.get('q');
    if (grid && q) { inp.value = q; filtrarComunidades(q); }
    inp.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const t = inp.value.trim();
        if (grid) { filtrarComunidades(t); }
        else { window.location.href = t ? '/search?q=' + encodeURIComponent(t) : '/search'; }
    });
}

/* ============================================
   CURTIR & COMENTAR & SEGUIR
============================================ */
function inicializarCurtirPosts() {
    document.querySelectorAll('.post-actions button').forEach(btn => {
        if (btn.dataset.likeInit || !btn.textContent.includes('Curtir')) return;
        btn.dataset.likeInit = 'true';
        btn.addEventListener('click', async () => {
            const post = btn.closest('.post');
            const postId = post?.dataset.postId;
            const wasLiked = btn.classList.contains('liked') || btn.textContent.includes('Curtido');
            const current = Number(btn.dataset.likeCount || 0);
            const optimistic = wasLiked ? Math.max(0, current - 1) : current + 1;
            btn.classList.toggle('liked', !wasLiked);
            btn.dataset.likeCount = optimistic;
            btn.innerHTML = `<i class="fas fa-heart"></i> ${wasLiked ? 'Curtir' : 'Curtido'}${optimistic ? ` (${optimistic})` : ''}`;
            if (!postId) return;
            try {
                const fd = new FormData();
                fd.append('acao', 'curtir');
                fd.append('post_id', postId);
                const res = await fetch('/api/posts', { method: 'POST', body: fd }).then(r => r.json());
                if (!res.ok) throw new Error(res.erro || 'Erro ao curtir.');
                const liked = res.acao === 'curtido';
                const total = Number(res.total || 0);
                btn.classList.toggle('liked', liked);
                btn.dataset.likeCount = total;
                btn.innerHTML = `<i class="fas fa-heart"></i> ${liked ? 'Curtido' : 'Curtir'}${total ? ` (${total})` : ''}`;
            } catch (err) {
                btn.classList.toggle('liked', wasLiked);
                btn.dataset.likeCount = current;
                btn.innerHTML = `<i class="fas fa-heart"></i> ${wasLiked ? 'Curtido' : 'Curtir'}${current ? ` (${current})` : ''}`;
                alert(err.message);
            }
        });
    });
}

function inicializarComentarios() {
    document.querySelectorAll('.post').forEach(post => {
        const commentBtn = Array.from(post.querySelectorAll('button')).find(b => b.textContent.includes('Comentar'));
        if (!commentBtn || commentBtn.dataset.commentInit) return;
        commentBtn.dataset.commentInit = 'true';
        let area, listEl, inputEl, btnEl;

        function garantirArea() {
            if (!area) {
                area = document.createElement('div');
                area.classList.add('comments-area');
                area.innerHTML = `
                    <div class="comments-list"></div>
                    <div class="comment-input-row">
                        <input type="text" placeholder="Escreva um comentário...">
                        <button type="button">Enviar</button>
                    </div>`;
                post.appendChild(area);
            }
            listEl  = area.querySelector('.comments-list');
            inputEl = area.querySelector('input');
            btnEl   = area.querySelector('button');
        }

        async function carregarComentarios() {
            const postId = post.dataset.postId;
            garantirArea();
            if (!postId || area.dataset.loadedComments) return;
            area.dataset.loadedComments = 'true';
            try {
                const data = await fetch(`/api/posts?acao=comentarios&post_id=${encodeURIComponent(postId)}`, { cache: 'no-store' }).then(r => r.json());
                if (!data.ok) return;
                listEl.innerHTML = data.comentarios.map(c => `
                    <div class="comment-item">
                        <div class="comment-avatar"><img src="${escTexto(c.foto_perfil || 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg')}" alt="${escTexto(c.nome)}"></div>
                        <div class="comment-content">
                            <span class="comment-author">${escTexto(c.nome)}</span>
                            <span class="comment-text">${escTexto(c.texto)}</span>
                        </div>
                    </div>`).join('');
            } catch (err) {}
        }

        async function enviar() {
            garantirArea();
            const texto = inputEl.value.trim();
            if (!texto) return;
            const p = obterPerfil();
            const item = document.createElement('div');
            item.classList.add('comment-item');
            item.innerHTML = `
                <div class="comment-avatar"><img src="${p.foto || 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg'}" alt="${p.nome}"></div>
                <div class="comment-content">
                    <span class="comment-author">${p.nome}</span>
                    <span class="comment-text">${texto}</span>
                </div>`;
            listEl.appendChild(item);
            inputEl.value = '';
            listEl.scrollTop = listEl.scrollHeight;
            const postId = post.dataset.postId;
            if (!postId) return;
            try {
                const fd = new FormData();
                fd.append('acao', 'comentar');
                fd.append('post_id', postId);
                fd.append('texto', texto);
                const res = await fetch('/api/posts', { method: 'POST', body: fd }).then(r => r.json());
                if (!res.ok) throw new Error(res.erro || 'Erro ao comentar.');
            } catch (err) {
                item.remove();
                alert(err.message);
            }
        }

        commentBtn.addEventListener('click', async () => { await carregarComentarios(); inputEl.focus(); });
        post.addEventListener('click',   e => { if (area && e.target === btnEl) enviar(); });
        post.addEventListener('keydown', e => { if (area && e.target === inputEl && e.key === 'Enter') { e.preventDefault(); enviar(); } });
    });
}

async function sincronizarBotoesComunidade() {
    const buttons = Array.from(document.querySelectorAll('.follow-btn')).filter(btn => btn.dataset.communityName || btn.dataset.communityId);
    if (!buttons.length) return;
    try {
        const data = await fetch('/api/communities?acao=listar', { cache: 'no-store' }).then(r => r.json());
        if (!data.ok) return;
        buttons.forEach(btn => {
            const byId = data.comunidades.find(c => Number(c.id) === Number(btn.dataset.communityId || 0));
            const byName = data.comunidades.find(c => String(c.nome).toLowerCase() === String(btn.dataset.communityName || '').toLowerCase());
            const community = byId || byName;
            if (!community) return;
            btn.dataset.communityId = community.id;
            const card = btn.closest('.sport-card, .community-card, .community-item');
            if (card) card.dataset.communityId = community.id;
            btn.dataset.joined = Number(community.participa || 0) === 1 ? '1' : '0';
            btn.textContent = btn.dataset.joined === '1' ? 'Seguindo' : 'Seguir';
            btn.disabled = false;
        });
        document.querySelectorAll('.sport-card[data-community-id], .community-card[data-community-id], .community-item[data-community-id], .sport-card[data-community-name], .community-card[data-community-name], .community-item[data-community-name]').forEach(card => {
            if (card.dataset.openInit) return;
            card.dataset.openInit = 'true';
            card.addEventListener('click', async e => {
                if (e.target.closest('button, a')) return;
                if (card.dataset.communityId) {
                    window.location.href = `/comunidade/${card.dataset.communityId}`;
                    return;
                }
                const name = card.dataset.communityName;
                if (!name) return;
                try {
                    const fresh = await fetch('/api/communities?acao=listar', { cache: 'no-store' }).then(r => r.json());
                    const community = fresh.comunidades?.find(c => String(c.nome).toLowerCase() === String(name).toLowerCase());
                    if (community) window.location.href = `/comunidade/${community.id}`;
                } catch (err) {}
            });
        });
    } catch (err) {}
}

function inicializarSeguir() {
    document.querySelectorAll('.follow-btn').forEach(btn => {
        if (btn.dataset.followInit) return;
        btn.dataset.followInit = 'true';
        btn.addEventListener('click', async () => {
            const comunidade = btn.dataset.communityName;
            const comunidadeId = btn.dataset.communityId;
            const usuarioId = btn.dataset.userId;
            if (comunidade || comunidadeId) {
                const original = btn.textContent;
                btn.disabled = true;
                const entrando = btn.dataset.joined !== '1';
                btn.textContent = entrando ? 'Entrando...' : 'Saindo...';
                const fd = new FormData();
                fd.append('acao', entrando ? 'entrar' : 'sair');
                if (comunidadeId) fd.append('id', comunidadeId);
                if (comunidade) fd.append('nome', comunidade);
                try {
                    const res = await fetch('/api/communities', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (!data.ok) throw new Error(data.erro || 'Erro ao atualizar comunidade.');
                    btn.dataset.joined = entrando ? '1' : '0';
                    btn.textContent = entrando ? 'Seguindo' : 'Seguir';
                    btn.disabled = false;
                    btn.closest('.sport-card')?.classList.toggle('joined', entrando);
                } catch (err) {
                    btn.disabled = false;
                    btn.textContent = original;
                    alert(err.message);
                }
                return;
            }
            if (usuarioId) {
                const original = btn.textContent;
                btn.disabled = true;
                const fd = new FormData();
                fd.append('acao', 'toggle');
                fd.append('usuario_id', usuarioId);
                try {
                    const res = await fetch('/api/follow', { method: 'POST', body: fd }).then(r => r.json());
                    if (!res.ok) throw new Error(res.erro || 'Erro ao seguir usuário.');
                    btn.textContent = res.acao === 'seguindo' ? 'Seguindo' : 'Seguir';
                } catch (err) {
                    btn.textContent = original;
                    alert(err.message);
                } finally {
                    btn.disabled = false;
                }
                return;
            }
            btn.textContent = 'Seguindo';
            btn.disabled = true;
        });
    });
    sincronizarBotoesComunidade();

    document.querySelectorAll('.challenge-btn').forEach(btn => {
        if (btn.dataset.challengeInit) return;
        btn.dataset.challengeInit = 'true';
        btn.addEventListener('click', async () => {
            const fd = new FormData();
            fd.append('acao', 'desafio');
            fd.append('desafio_id', btn.dataset.desafioId);
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-check"></i> Inscrito';
            try {
                const res = await fetch('/api/communities', { method: 'POST', body: fd });
                const data = await res.json();
                if (!data.ok) throw new Error(data.erro || 'Erro ao entrar no desafio.');
            } catch (err) {
                btn.disabled = false;
                btn.textContent = 'Participar';
                alert(err.message);
            }
        });
    });
}

/* ============================================
   CRIAR PUBLICAÇÃO
============================================ */
let midiaSelecionada = null;

function criarElementoPost(postOuTexto, midiaURL, tipoMidia) {
    const feed = document.getElementById('feed-posts') || document.querySelector('.feed-container');
    if (!feed) return;
    if (typeof postOuTexto === 'object' && postOuTexto !== null) {
        feed.insertAdjacentHTML('afterbegin', postHtml(postOuTexto));
        inicializarPostsRenderizados(feed);
        return;
    }
    const texto = postOuTexto;
    const p = obterPerfil();
    const foto = p.foto || 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg';
    const post = document.createElement('div');
    post.classList.add('post');
    let midiaHTML = '';
    if (midiaURL) midiaHTML = tipoMidia === 'video' ? `<video controls src="${midiaURL}"></video>` : `<img src="${midiaURL}">`;
    post.innerHTML = `
        <div class="post-header">
            <img src="${foto}">
            <div class="post-info">
                <h4>${p.nome}</h4>
                <span>${p.usuario}</span>
                <p class="post-time">Agora mesmo</p>
            </div>
        </div>
        <div class="post-content"><p>${texto}</p>${midiaHTML}</div>
        <div class="post-actions">
            <button><i class="fas fa-heart"></i> Curtir</button>
            <button><i class="fas fa-comment"></i> Comentar</button>
            <button><i class="fas fa-share"></i> Compartilhar</button>
        </div>`;
    if (feed.id === 'feed-posts') feed.prepend(post);
    else {
        const box = document.querySelector('.create-post-box');
        if (box && box.nextSibling) feed.insertBefore(post, box.nextSibling);
        else feed.appendChild(post);
    }
    inicializarCurtirPosts();
    inicializarComentarios();
}

function inicializarCriarPublicacao() {
    const txt       = document.getElementById('post-text');
    const inputMidia= document.getElementById('post-media');
    const preview   = document.getElementById('post-preview');
    const btnMidia  = document.getElementById('btn-media');
    const btnPub    = document.getElementById('btn-publicar');
    if (!txt || !inputMidia || !preview || !btnMidia || !btnPub) return;

    ['link-criar','btn-publicar-header'].forEach(id => {
        const el = document.getElementById(id);
        const box = document.querySelector('.create-post-box');
        if (el && box) el.addEventListener('click', e => { e.preventDefault(); box.scrollIntoView({ behavior: 'smooth' }); });
    });

    btnMidia.onclick = () => inputMidia.click();
    inputMidia.addEventListener('change', () => {
        preview.innerHTML = '';
        midiaSelecionada = null;
        const file = inputMidia.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        midiaSelecionada = { url, tipo: file.type.startsWith('video') ? 'video' : 'image' };
        const el = document.createElement(midiaSelecionada.tipo === 'video' ? 'video' : 'img');
        el.src = url;
        if (midiaSelecionada.tipo === 'video') el.controls = true;
        preview.appendChild(el);
    });

    btnPub.onclick = async () => {
        const texto = txt.value.trim();
        if (!texto && !midiaSelecionada) { alert('Digite algo ou selecione uma mídia.'); return; }
        const original = btnPub.textContent;
        btnPub.disabled = true;
        btnPub.textContent = 'Publicando...';
        const dados = new FormData();
        dados.append('acao', 'criar');
        dados.append('texto', texto);
        if (inputMidia.files[0]) dados.append('midia', inputMidia.files[0]);
        try {
            const res = await fetch('/api/posts', { method: 'POST', body: dados }).then(r => r.json());
            if (!res.ok) throw new Error(res.erro || 'Erro ao publicar.');
            criarElementoPost(res.post);
            txt.value = '';
            inputMidia.value = '';
            preview.innerHTML = '';
            midiaSelecionada = null;
        } catch (err) {
            alert(err.message);
        } finally {
            btnPub.disabled = false;
            btnPub.textContent = original;
        }
    };
}

/* ============================================
   EDITAR PERFIL (perfil.php)
============================================ */
function inicializarEditarPerfil() {
    const btn   = document.getElementById('edit-profile-btn');
    const modal = document.getElementById('edit-profile-modal');
    if (!btn || !modal) return;

    const form    = document.getElementById('edit-profile-form');
    const inpNome = document.getElementById('edit-name');
    const inpUser = document.getElementById('edit-username');
    const inpBio  = document.getElementById('edit-bio');
    const inpFoto = document.getElementById('edit-photo');
    const inpCidade = document.getElementById('edit-city');
    const inpEsporte = document.getElementById('edit-sport');
    const inpModalidade = document.getElementById('edit-role');
    const cancelar= document.getElementById('cancel-edit');

    btn.onclick = () => {
        const p = obterPerfil();
        inpNome.value = p.nome;
        inpUser.value = p.usuario;
        inpBio.value  = p.bio;
        if (inpCidade) inpCidade.value = p.cidade || '';
        if (inpEsporte) inpEsporte.value = p.esporte || '';
        if (inpModalidade) inpModalidade.value = p.modalidade || '';
        inpFoto.value = '';
        modal.style.display = 'flex';
    };

    cancelar.onclick = () => modal.style.display = 'none';

    form.onsubmit = e => {
        e.preventDefault();
        const dados = new FormData();
        dados.append('nome',     inpNome.value.trim());
        dados.append('username', inpUser.value.trim().replace('@',''));
        dados.append('bio',      inpBio.value.trim());
        if (inpCidade) dados.append('cidade', inpCidade.value.trim());
        if (inpEsporte) dados.append('esporte_favorito', inpEsporte.value.trim());
        if (inpModalidade) dados.append('posicao_modalidade', inpModalidade.value.trim());
        if (inpFoto.files[0]) dados.append('foto', inpFoto.files[0]);

        fetch('/api/usuario', { method: 'POST', body: dados })
            .then(r => r.json())
            .then(res => {
                if (res.ok) {
                    // Atualiza data- no body para refletir imediatamente
                    document.body.dataset.nome     = res.nome;
                    document.body.dataset.username = res.username;
                    document.body.dataset.bio      = res.bio;
                    document.body.dataset.cidade   = res.cidade || '';
                    document.body.dataset.esporte  = res.esporte_favorito || '';
                    document.body.dataset.modalidade = res.posicao_modalidade || '';
                    if (res.foto) document.body.dataset.foto = res.foto;
                    perfilCache = null; // força releitura
                    aplicarPerfilNaPagina();
                    modal.style.display = 'none';
                } else {
                    alert(res.erro || 'Erro ao salvar.');
                }
            })
            .catch(() => alert('Erro de conexão.'));
    };
}

function inicializarAbasPerfil() {
    const tabs     = document.querySelectorAll('.profile-nav-item');
    const contents = document.querySelectorAll('.tab-content');
    if (!tabs.length) return;
    tabs.forEach((tab, i) => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            contents[i].classList.add('active');
        };
    });
}

function inicializarComunidadesPerfil() {
    const tabs = document.querySelectorAll('.profile-nav-item');
    const contents = document.querySelectorAll('.profile-content .tab-content');
    if (tabs.length < 3 || contents.length < 3) return;
    fetch('/api/usuario/communities', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            if (!data.ok) return;
            const box = contents[2];
            box.innerHTML = data.comunidades.length
                ? data.comunidades.map(c => `
                    <a class="community-item" href="/communities/${c.id}">
                        <i class="fas fa-users"></i>
                        <div>
                            <h4>${escTexto(c.nome)}</h4>
                            <p>${escTexto(c.descricao || 'Comunidade esportiva da Arena+.')}</p>
                        </div>
                    </a>`).join('')
                : '<div class="community-item"><i class="fas fa-users"></i><div><h4>Nenhuma comunidade ainda</h4><p>Entre em comunidades para elas aparecerem aqui.</p></div></div>';
        })
        .catch(() => {});
}

function inicializarSugestoesUsuarios() {
    const sections = Array.from(document.querySelectorAll('.right-sidebar .sidebar-section'));
    const box = sections.find(section => section.querySelector('h4')?.textContent.trim() === 'Quem seguir');
    if (!box) return;
    fetch('/api/follow?acao=sugestoes', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            if (!data.ok) return;
            box.innerHTML = '<h4>Quem seguir</h4>' + data.sugestoes.map(u => `
                <div class="follow-card">
                    <img src="${escTexto(u.foto_perfil || 'LOGOARENA+PST.png')}" alt="${escTexto(u.nome)}">
                    <div>
                        <h5>${escTexto(u.nome)}</h5>
                        <p>@${escTexto(u.username)}</p>
                    </div>
                    <button class="follow-btn user-follow-btn" data-user-id="${u.id}">Seguir</button>
                </div>`).join('');
            box.querySelectorAll('.user-follow-btn').forEach(btn => {
                btn.onclick = async () => {
                    const fd = new FormData();
                    fd.append('acao', 'toggle');
                    fd.append('usuario_id', btn.dataset.userId);
                    const res = await fetch('/api/follow', { method: 'POST', body: fd }).then(r => r.json());
                    if (!res.ok) return alert(res.erro || 'Erro ao seguir usuário.');
                    btn.textContent = res.acao === 'seguindo' ? 'Seguindo' : 'Seguir';
                    btn.disabled = false;
                };
            });
        })
        .catch(() => {});
}

/* ============================================
   CHAT
============================================ */
const CONTATOS_CHAT = {
    arenabot: { nome: 'ArenaBot', status: 'Assistente da Arena+ • online', avatar: 'LOGOARENA+PST.png', tipo: 'bot' },
    kaka:     { nome: 'Kaká',     status: 'Online há 10 min',              avatar: '121440.jpg.jpeg',   tipo: 'user' },
    giba:     { nome: 'Giba',     status: 'Online agora',                  avatar: 'giba.jpg.jpeg',     tipo: 'user' }
};

let chatAtual = 'arenabot';

function adicionarMensagemChat(origem, texto) {
    const janela  = document.getElementById('chat-window');
    const contato = CONTATOS_CHAT[chatAtual];
    if (!janela || !contato) return;
    const p   = obterPerfil();
    const msg = document.createElement('div');
    msg.classList.add('chat-message', origem);
    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('chat-avatar');
    const img = document.createElement('img');
    img.src = origem === 'user' ? (p.foto || 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg') : contato.avatar;
    avatarDiv.appendChild(img);
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble');
    if (texto && String(texto).startsWith('IMG:')) {
        const img = document.createElement('img');
        img.src = String(texto).slice(4);
        img.alt = 'Imagem gerada pelo Arena Coaching';
        img.className = 'coach-generated-image';
        bubble.appendChild(img);
    } else {
        const pTxt = document.createElement('p');
        pTxt.textContent = texto;
        bubble.appendChild(pTxt);
    }
    if (origem === 'user') { msg.appendChild(bubble); msg.appendChild(avatarDiv); }
    else                   { msg.appendChild(avatarDiv); msg.appendChild(bubble); }
    janela.appendChild(msg);
    janela.scrollTop = janela.scrollHeight;
    return msg;
}

function gerarRespostaArenaBot(t) {
    t = t.toLowerCase();
    if (t.includes('oi') || t.includes('ol')) return 'Opa! Tudo certo? Eu sou o ArenaBot 😄 Posso te ajudar com a Arena+.';
    if (t.includes('como funciona') || t.includes('o que é')) return 'A Arena+ é uma rede social esportiva. Você posta treinos, segue comunidades e interage com atletas!';
    if (t.includes('publicar') || t.includes('postar')) return 'Vá em Início, clique em "+ Publicar", escreva e publique.';
    if (t.includes('comunidade')) return 'Em Comunidades você escolhe seus esportes favoritos e recebe mais conteúdo no feed.';
    if (t.includes('perfil') || t.includes('bio')) return 'Na tela Perfil clique em "Editar Perfil" para trocar nome, bio e foto.';
    if (t.includes('tema') || t.includes('escuro')) return 'Clique em "Alterar Tema" na barra lateral para trocar entre claro e escuro 😉';
    return 'Boa pergunta! 😄 Me pergunte sobre feed, comunidades, chat ou perfil.';
}

async function chamarArenaCoach(mensagem, imagem = null, gerarImagem = false) {
    try {
        const fd = new FormData();
        fd.append('acao', gerarImagem ? 'gerar_imagem' : (imagem ? 'analisar_imagem' : 'chat'));
        if (gerarImagem) fd.append('prompt', mensagem);
        else fd.append('mensagem', mensagem);
        if (imagem) fd.append('imagem', imagem);

        const res = await fetch('/api/coach', { method: 'POST', body: fd, cache: 'no-store' });
        const texto = await res.text();
        let data;
        try {
            data = JSON.parse(texto);
        } catch (jsonErr) {
            throw new Error('O servidor respondeu fora do formato esperado. Recarregue a página e tente de novo.');
        }
        if (!data.ok) throw new Error(data.erro || 'Erro no Arena Coaching.');
        return data;
    } catch (err) {
        const msg = err && err.message ? err.message : '';
        if (msg.includes('expected pattern') || msg.includes('Failed to fetch')) {
            throw new Error('Não consegui falar com o Arena Coaching agora. Recarregue a página e tente novamente.');
        }
        throw err;
    }
}

function atualizarMensagemChat(msg, texto) {
    if (!msg) return;
    const pTxt = msg.querySelector('.chat-bubble p');
    if (pTxt) pTxt.textContent = texto;
    const janela = document.getElementById('chat-window');
    if (janela) janela.scrollTop = janela.scrollHeight;
}

function chamarArenaCoachStreaming(mensagem, onToken, onDone, onError) {
    const url = '/api/coach/stream?mensagem=' + encodeURIComponent(mensagem);
    const source = new EventSource(url);
    let recebeuTexto = false;

    source.addEventListener('token', event => {
        try {
            const data = JSON.parse(event.data);
            recebeuTexto = true;
            onToken(data.token || '');
        } catch (err) {
            onToken('');
        }
    });

    source.addEventListener('done', () => {
        source.close();
        onDone(recebeuTexto);
    });

    source.addEventListener('error', event => {
        source.close();
        let mensagemErro = 'Não consegui falar com o Arena Coaching agora. Recarregue a página e tente novamente.';
        if (event && event.data) {
            try {
                mensagemErro = JSON.parse(event.data).erro || mensagemErro;
            } catch (err) {}
        }
        onError(mensagemErro);
    });

    return source;
}

function abrirChat(id) {
    const contato = CONTATOS_CHAT[id];
    const janela  = document.getElementById('chat-window');
    const avatar  = document.getElementById('chat-contact-avatar');
    const nome    = document.getElementById('chat-contact-name');
    const status  = document.getElementById('chat-contact-status');
    if (!contato || !janela) return;
    chatAtual = id;
    if (avatar) avatar.src         = contato.avatar;
    if (nome)   nome.textContent   = contato.nome;
    if (status) status.textContent = contato.status;
    janela.innerHTML = '';
    adicionarMensagemChat('bot', id === 'arenabot'
        ? 'Fala, craque! 👋 Eu sou o ArenaBot. Quer saber como usar a Arena+?'
        : `Chat simulado com ${contato.nome}. Em breve mensagens reais 😉`);
}

function inicializarChat() {
    const janela  = document.getElementById('chat-window');
    const input   = document.getElementById('chat-input');
    const btnSend = document.getElementById('chat-send');
    if (!janela || !input || !btnSend) return;
    abrirChat('arenabot');
    document.querySelectorAll('.chat-thread').forEach(thread => {
        thread.addEventListener('click', () => {
            document.querySelectorAll('.chat-thread').forEach(t => t.classList.remove('active'));
            thread.classList.add('active');
            abrirChat(thread.getAttribute('data-chat-id'));
        });
    });
    function enviar() {
        const texto = input.value.trim();
        if (!texto) return;
        adicionarMensagemChat('user', texto);
        input.value = '';
        if (CONTATOS_CHAT[chatAtual]?.tipo === 'bot') {
            const pedidoImagem = texto.match(/^(?:gerar|gere|gera|criar|crie)\s+(?:uma\s+)?imagem(?:\s+de|\s*:)?\s*(.*)$/i);
            if (pedidoImagem) {
                const promptImagem = (pedidoImagem[1] || '').trim();
                if (!promptImagem) {
                    adicionarMensagemChat('bot', 'Me diga o que você quer na imagem. Exemplo: "gerar imagem de um atleta correndo na chuva com estilo Arena+".');
                    return;
                }
                adicionarMensagemChat('bot', 'Gerando imagem...');
                chamarArenaCoach(promptImagem, null, true)
                    .then(data => {
                        const ultima = janela.querySelector('.chat-message.bot:last-child');
                        if (ultima) ultima.remove();
                        adicionarMensagemChat('bot', 'IMG:' + data.imagem_url);
                    })
                    .catch(err => {
                        const ultima = janela.querySelector('.chat-message.bot:last-child');
                        if (ultima) ultima.remove();
                        adicionarMensagemChat('bot', err.message);
                    });
                return;
            }

            const msgBot = adicionarMensagemChat('bot', 'Pensando como coach...');
            let resposta = '';
            chamarArenaCoachStreaming(
                texto,
                token => {
                    resposta += token;
                    atualizarMensagemChat(msgBot, resposta || 'Pensando como coach...');
                },
                recebeuTexto => {
                    if (!recebeuTexto) atualizarMensagemChat(msgBot, gerarRespostaArenaBot(texto));
                },
                erro => {
                    atualizarMensagemChat(msgBot, erro || gerarRespostaArenaBot(texto));
                }
            );
        }
    }
    btnSend.addEventListener('click', enviar);
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } });

    const uploadBtn = document.getElementById('coach-upload-btn');
    const imageInput = document.getElementById('coach-image');
    const generateBtn = document.getElementById('coach-generate-btn');

    if (uploadBtn && imageInput) {
        uploadBtn.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', () => {
            const file = imageInput.files[0];
            if (!file) return;
            const pergunta = input.value.trim() || 'Analise esta imagem para dar dicas de alimentação ou esporte.';
            adicionarMensagemChat('user', 'Enviei uma imagem para análise.');
            adicionarMensagemChat('bot', 'Analisando imagem...');
            chamarArenaCoach(pergunta, file)
                .then(data => {
                    const ultima = janela.querySelector('.chat-message.bot:last-child');
                    if (ultima) ultima.remove();
                    adicionarMensagemChat('bot', data.resposta);
                })
                .catch(err => {
                    const ultima = janela.querySelector('.chat-message.bot:last-child');
                    if (ultima) ultima.remove();
                    adicionarMensagemChat('bot', err.message);
                })
                .finally(() => { imageInput.value = ''; });
        });
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const prompt = input.value.trim();
            if (!prompt) {
                input.placeholder = 'Descreva a imagem esportiva que quer gerar...';
                input.focus();
                return;
            }
            adicionarMensagemChat('user', 'Gerar imagem: ' + prompt);
            adicionarMensagemChat('bot', 'Gerando imagem...');
            input.value = '';
            chamarArenaCoach(prompt, null, true)
                .then(data => {
                    const ultima = janela.querySelector('.chat-message.bot:last-child');
                    if (ultima) ultima.remove();
                    adicionarMensagemChat('bot', 'IMG:' + data.imagem_url);
                })
                .catch(err => {
                    const ultima = janela.querySelector('.chat-message.bot:last-child');
                    if (ultima) ultima.remove();
                    adicionarMensagemChat('bot', err.message);
                });
        });
    }
}

/* ============================================
   INICIALIZAÇÃO
============================================ */
(function() {
    const tema = localStorage.getItem('arena_theme') || 'light';
    if (tema === 'dark') {
        document.documentElement.classList.add('dark-theme');
        if (document.body) document.body.classList.add('dark-theme');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    inicializarAlterarTema();
    aplicarPerfilNaPagina();
    carregarPerfilDoServidor();
    inicializarModalConfig();
    inicializarNotificacoes();
    inicializarBusca();
    inicializarCurtirPosts();
    inicializarComentarios();
    inicializarSeguir();
    inicializarCriarPublicacao();
    carregarFeedPrincipal();
    carregarPostsPerfil();
    inicializarEditarPerfil();
    inicializarAbasPerfil();
    inicializarComunidadesPerfil();
    inicializarSugestoesUsuarios();
    inicializarChat();
});
