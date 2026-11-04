/* ============================================================
   Arena+ | Feed dinâmico com banco de dados
   Substitui os posts estáticos do index.js
============================================================ */

let feedPagina = 1;
let feedCarregando = false;
let feedFim = false;
let feedObserver = null;
let pullStartY = null;
let pullAtivo = false;

// Formata tempo relativo (ex: "Há 3 horas")
function tempoRelativo(dataStr) {
    const data  = new Date(dataStr.replace(' ', 'T'));
    const diff  = (Date.now() - data.getTime()) / 1000;
    if (diff < 60)         return 'Agora mesmo';
    if (diff < 3600)       return `Há ${Math.floor(diff/60)} min`;
    if (diff < 86400)      return `Há ${Math.floor(diff/3600)}h`;
    if (diff < 604800)     return `Há ${Math.floor(diff/86400)} dias`;
    return data.toLocaleDateString('pt-BR');
}

function avatarSrc(foto) {
    if (!foto || foto === '') return 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg';
    return foto;
}

function usuarioAtualResumo() {
    return {
        nome: document.body.dataset.nome || 'Usuário',
        username: document.body.dataset.username || '@usuario',
        foto: document.body.dataset.foto || avatarSrc('')
    };
}

function setVisivel(el, visivel) {
    if (!el) return;
    el.hidden = !visivel;
    if (visivel && el.style) el.style.display = '';
}

function criarComentarioEl(comentario, pendente) {
    const p = document.createElement('p');
    p.className = pendente ? 'comment-item comentario-pendente' : 'comment-item';
    const username = comentario.username || usuarioAtualResumo().username;
    const texto = comentario.texto || '';
    p.innerHTML = `<strong>${escHtml(username)}</strong> ${escHtml(texto)}`;
    return p;
}

function renderizarSkeletonFeed() {
    const container = document.getElementById('feed-posts');
    if (!container || feedPagina !== 1) return;
    const loading = document.getElementById('feed-loading');
    if (loading) loading.remove();
    container.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const post = document.createElement('div');
        post.className = 'post feed-skeleton';
        post.setAttribute('aria-hidden', 'true');
        post.innerHTML = `
            <div class="post-header">
                <img src="${avatarSrc('')}" alt="">
                <div class="post-info">
                    <h4>Carregando</h4>
                    <span>@arena</span>
                    <p class="post-time">Agora</p>
                </div>
            </div>
            <div class="post-content">
                <p>Carregando posts...</p>
            </div>`;
        container.appendChild(post);
    }
}

function limparSkeletonFeed() {
    document.querySelectorAll('.feed-skeleton').forEach(el => el.remove());
}

// Cria elemento HTML de um post
function criarElementoPostDB(p) {
    const div = document.createElement('div');
    div.classList.add('post');
    div.dataset.postId = p.id;

    const curtido = parseInt(p.curtido_por_mim) === 1;
    const totalC  = parseInt(p.total_curtidas)  || 0;
    const totalCm = parseInt(p.total_comentarios) || 0;

    let midiaHtml = '';
    if (p.midia_url) {
        if (p.midia_tipo === 'video') {
            midiaHtml = `<video src="${p.midia_url}" controls style="max-width:100%;border-radius:8px;margin-top:8px;"></video>`;
        } else {
            midiaHtml = `<img src="${p.midia_url}" alt="Mídia do post" style="max-width:100%;border-radius:8px;margin-top:8px;">`;
        }
    }

    // Verifica se é o próprio post do usuário logado (para botão deletar)
    const bodyNome = document.body.dataset.username || '';
    const postUsername = '@' + p.username;
    const meuPost = (bodyNome === postUsername);
    const deletarBtn = meuPost
        ? `<button class="btn-deletar-post" data-post-id="${p.id}" title="Deletar post" style="margin-left:auto;color:#e03e3e;background:none;border:none;cursor:pointer;font-size:13px;"><i class="fas fa-trash"></i></button>`
        : '';

    div.innerHTML = `
        <div class="post-header">
            <img src="${avatarSrc(p.foto_perfil)}" alt="${p.nome}" onerror="this.src='jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg'">
            <div class="post-info">
                <h4>${escHtml(p.nome)}</h4>
                <span>@${escHtml(p.username)}</span>
                ${p.comunidade_nome ? `<span><a href="/communities/${p.comunidade_id}">#${escHtml(p.comunidade_nome)}</a></span>` : ''}
                <p class="post-time">${tempoRelativo(p.criado_em)}</p>
            </div>
            ${deletarBtn}
        </div>
        <div class="post-content">
            ${p.texto ? `<p>${escHtml(p.texto)}</p>` : ''}
            ${midiaHtml}
        </div>
        <div class="post-actions">
            <button class="btn-curtir ${curtido ? 'curtido' : ''}" data-post-id="${p.id}">
                <i class="fas fa-heart"></i>
                <span class="curtidas-count">${totalC}</span>
            </button>
            <button class="btn-comentar" data-post-id="${p.id}">
                <i class="fas fa-comment"></i>
                <span>${totalCm}</span>
            </button>
            <button class="btn-compartilhar">
                <i class="fas fa-share"></i> Compartilhar
            </button>
        </div>
        <div class="comentarios-box" id="comentarios-${p.id}" hidden>
            <div class="comentarios-lista" id="lista-comentarios-${p.id}"></div>
            <div class="comentario-form">
                <input type="text" class="input-comentario" placeholder="Escreva um comentário..." data-post-id="${p.id}">
                <button class="btn-enviar-comentario" data-post-id="${p.id}">Enviar</button>
            </div>
        </div>`;

    return div;
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Carrega posts do banco
async function carregarFeed() {
    if (feedCarregando || feedFim) return;
    feedCarregando = true;

    const loading = document.getElementById('feed-loading');
    setVisivel(loading, true);
    renderizarSkeletonFeed();

    try {
        const res  = await fetch(`/api/posts?acao=feed&pagina=${feedPagina}`);
        const data = await res.json();

        setVisivel(loading, false);
        limparSkeletonFeed();

        if (!data.ok) {
            feedCarregando = false;
            return;
        }

        const container = document.getElementById('feed-posts');

        if (data.posts.length === 0) {
            feedFim = true;
            const fim = document.getElementById('feed-fim');
            setVisivel(fim, true);
            if (feedPagina === 1) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#aaa;"><i class="fas fa-volleyball-ball" style="font-size:40px;margin-bottom:12px;display:block;"></i><p>Ainda não há posts. Seja o primeiro a publicar! 🚀</p></div>';
            }
            feedCarregando = false;
            return;
        }

        data.posts.forEach(p => {
            const el = criarElementoPostDB(p);
            container.appendChild(el);
        });

        feedPagina++;
        feedCarregando = false;

        // Eventos para os novos posts
        inicializarEventosFeed();

    } catch (err) {
        console.error('Erro ao carregar feed:', err);
        feedCarregando = false;
        setVisivel(loading, false);
        limparSkeletonFeed();
    }
}

async function atualizarFeed() {
    if (feedCarregando) return;
    const container = document.getElementById('feed-posts');
    const fim = document.getElementById('feed-fim');
    feedPagina = 1;
    feedFim = false;
    setVisivel(fim, false);
    if (container) container.innerHTML = '';
    await carregarFeed();
}

// Delegação de eventos no feed
function inicializarEventosFeed() {
    const container = document.getElementById('feed-posts');
    if (!container) return;

    // Remove listeners antigos para evitar duplicatas
    container.removeEventListener('click', handleFeedClick);
    container.addEventListener('click', handleFeedClick);
}

async function handleFeedClick(e) {
    // Curtir
    const btnCurtir = e.target.closest('.btn-curtir');
    if (btnCurtir) {
        const postId = btnCurtir.dataset.postId;
        if (btnCurtir.dataset.loading === 'true') return;
        btnCurtir.dataset.loading = 'true';
        const cnt = btnCurtir.querySelector('.curtidas-count');
        const curtidoAntes = btnCurtir.classList.contains('curtido');
        const totalAntes = parseInt(cnt?.textContent || '0') || 0;
        const curtidoAgora = !curtidoAntes;
        btnCurtir.classList.toggle('curtido', curtidoAgora);
        if (cnt) cnt.textContent = Math.max(0, totalAntes + (curtidoAgora ? 1 : -1));

        const fd = new FormData();
        fd.append('acao', 'curtir');
        fd.append('post_id', postId);
        try {
            const res  = await fetch('/api/posts', { method: 'POST', body: fd });
            const data = await res.json();
            if (!data.ok) throw new Error(data.erro || 'Erro ao curtir.');
            btnCurtir.classList.toggle('curtido', data.acao === 'curtido');
            if (cnt) cnt.textContent = data.total;
        } catch (err) {
            btnCurtir.classList.toggle('curtido', curtidoAntes);
            if (cnt) cnt.textContent = totalAntes;
        } finally {
            btnCurtir.dataset.loading = 'false';
        }
        return;
    }

    // Abrir/fechar comentários
    const btnComentarToggle = e.target.closest('.btn-comentar');
    if (btnComentarToggle) {
        const postId  = btnComentarToggle.dataset.postId;
        const box     = document.getElementById('comentarios-' + postId);
        if (!box) return;
        const aberto  = !box.hidden;
        box.hidden = aberto;

        if (!aberto) {
            // Carrega comentários
            const lista = document.getElementById('lista-comentarios-' + postId);
            lista.innerHTML = '<p class="comment-item">Carregando...</p>';
            const res  = await fetch(`/api/posts?acao=comentarios&post_id=${postId}`);
            const data = await res.json();
            lista.innerHTML = '';
            if (data.ok && data.comentarios.length > 0) {
                data.comentarios.forEach(c => {
                    lista.appendChild(criarComentarioEl({ username: '@' + c.username, texto: c.texto }));
                });
            } else {
                lista.innerHTML = '<p class="comment-item">Nenhum comentário ainda.</p>';
            }
        }
        return;
    }

    // Enviar comentário
    const btnEnviar = e.target.closest('.btn-enviar-comentario');
    if (btnEnviar) {
        const postId = btnEnviar.dataset.postId;
        const input  = document.querySelector(`.input-comentario[data-post-id="${postId}"]`);
        if (!input || !input.value.trim()) return;
        const texto = input.value.trim();
        const lista = document.getElementById('lista-comentarios-' + postId);
        const vazio = lista?.querySelector('.comment-item');
        if (vazio && vazio.textContent.includes('Nenhum comentário')) vazio.remove();
        const pendente = criarComentarioEl({ username: usuarioAtualResumo().username, texto }, true);
        if (lista) lista.appendChild(pendente);
        input.value = '';

        const btnC = document.querySelector(`.btn-comentar[data-post-id="${postId}"] span`);
        const totalAntes = parseInt(btnC?.textContent || '0') || 0;
        if (btnC) btnC.textContent = totalAntes + 1;

        const fd = new FormData();
        fd.append('acao', 'comentar');
        fd.append('post_id', postId);
        fd.append('texto', texto);
        try {
            const res  = await fetch('/api/posts', { method: 'POST', body: fd });
            const data = await res.json();
            if (!data.ok) throw new Error(data.erro || 'Erro ao comentar.');
            pendente.replaceWith(criarComentarioEl(data.comentario));
        } catch (err) {
            pendente.remove();
            if (btnC) btnC.textContent = totalAntes;
            input.value = texto;
        }
        return;
    }

    // Deletar post
    const btnDeletar = e.target.closest('.btn-deletar-post');
    if (btnDeletar) {
        if (!confirm('Tem certeza que quer deletar este post?')) return;
        const postId = btnDeletar.dataset.postId;
        const fd = new FormData();
        fd.append('acao', 'deletar');
        fd.append('post_id', postId);
        const res  = await fetch('/api/posts', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.ok) {
            const postEl = document.querySelector(`.post[data-post-id="${postId}"]`);
            if (postEl) postEl.remove();
        }
        return;
    }

    const post = e.target.closest('.post');
    if (post && !e.target.closest('button, a, input, textarea, video')) {
        post.classList.toggle('post-expandido');
        const box = post.querySelector('.comentarios-box');
        if (box && post.classList.contains('post-expandido') && box.hidden) {
            const btn = post.querySelector('.btn-comentar');
            if (btn) btn.click();
        }
    }
}

// Publicar post via AJAX (substitui a versão localStorage do index.js)
function inicializarPublicarDB() {
    const txt       = document.getElementById('post-text');
    const inputMidia= document.getElementById('post-media');
    const btnPub    = document.getElementById('btn-publicar');
    const btnPubH   = document.getElementById('btn-publicar-header');
    const preview   = document.getElementById('post-preview');
    const btnMedia  = document.getElementById('btn-media');
    if (!txt || !btnPub) return;

    if (btnMedia) btnMedia.onclick = () => inputMidia.click();

    // Preview de mídia
    if (inputMidia) {
        inputMidia.addEventListener('change', () => {
            preview.innerHTML = '';
            const file = inputMidia.files[0];
            if (!file) return;
            const url  = URL.createObjectURL(file);
            const el   = file.type.startsWith('video') ? document.createElement('video') : document.createElement('img');
            el.src = url;
            if (el.tagName === 'VIDEO') el.controls = true;
            el.style.cssText = 'max-width:100%;border-radius:8px;';
            preview.appendChild(el);
        });
    }

    async function publicar() {
        const texto = txt.value.trim();
        if (!texto && (!inputMidia || !inputMidia.files[0])) {
            alert('Digite algo ou selecione uma mídia.');
            return;
        }

        btnPub.disabled = true;
        btnPub.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';

        const fd = new FormData();
        fd.append('acao', 'criar');
        fd.append('texto', texto);
        if (inputMidia && inputMidia.files[0]) fd.append('midia', inputMidia.files[0]);

        try {
            const res  = await fetch('/api/posts', { method: 'POST', body: fd });
            const data = await res.json();

            if (data.ok) {
                const container = document.getElementById('feed-posts');
                const el = criarElementoPostDB(data.post);
                // Insere no topo, após o loading
                const loading = document.getElementById('feed-loading');
                if (loading && loading.parentNode === container) {
                    container.insertBefore(el, loading);
                } else {
                    container.insertBefore(el, container.firstChild);
                }
                inicializarEventosFeed();

                txt.value = '';
                if (inputMidia) inputMidia.value = '';
                preview.innerHTML = '';
            } else {
                alert(data.erro || 'Erro ao publicar.');
            }
        } catch (err) {
            alert('Erro de conexão.');
        }

        btnPub.disabled = false;
        btnPub.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar';
    }

    btnPub.onclick = publicar;
    if (btnPubH) btnPubH.onclick = () => { txt.focus(); window.scrollTo(0, 0); };
}

function inicializarScrollInfinito() {
    const feed = document.querySelector('.feed-container');
    if (!feed) return;
    let alvo = document.getElementById('feed-sentinel');
    if (!alvo) {
        alvo = document.createElement('div');
        alvo.id = 'feed-sentinel';
        alvo.setAttribute('aria-hidden', 'true');
        feed.appendChild(alvo);
    }
    if (!alvo) return;

    if ('IntersectionObserver' in window) {
        if (feedObserver) feedObserver.disconnect();
        feedObserver = new IntersectionObserver(entries => {
            const visivel = entries.some(entry => entry.isIntersecting);
            if (visivel && !feedFim) carregarFeed();
        }, { rootMargin: '600px 0px' });
        feedObserver.observe(alvo);
        return;
    }

    window.addEventListener('scroll', () => {
        const pertoDoFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 600;
        if (pertoDoFim && !feedFim) carregarFeed();
    }, { passive: true });
}

function inicializarPullToRefresh() {
    window.addEventListener('touchstart', e => {
        if (window.scrollY > 0 || !e.touches.length) return;
        pullStartY = e.touches[0].clientY;
        pullAtivo = true;
    }, { passive: true });

    window.addEventListener('touchmove', e => {
        if (!pullAtivo || pullStartY === null || !e.touches.length) return;
        const distancia = e.touches[0].clientY - pullStartY;
        if (distancia > 80 && !feedCarregando) {
            pullAtivo = false;
            atualizarFeed();
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        pullStartY = null;
        pullAtivo = false;
    }, { passive: true });
}

// CSS extra para curtir/comentar integrado ao design existente
(function adicionarEstilos() {
    const style = document.createElement('style');
    style.textContent = `
        .btn-curtir.curtido { color: var(--highlight-orange, #ff6b35); }
        .btn-curtir.curtido i { color: var(--highlight-orange, #ff6b35); }
        .comentarios-box { padding: 10px 14px; border-top: 1px solid rgba(0,0,0,0.06); }
        .comentarios-lista { margin-bottom: 10px; max-height: 200px; overflow-y: auto; }
        .comentario-form { display: flex; gap: 8px; }
        .input-comentario {
            flex: 1; padding: 7px 10px; border-radius: 20px;
            border: 1px solid var(--border-gray, #ddd);
            font-size: 13px; outline: none;
            background: var(--bg-light, #f3f4f6);
        }
        .btn-enviar-comentario {
            padding: 7px 14px; border-radius: 20px; border: none;
            background: var(--primary-blue, #4f6ef7); color: #fff;
            font-size: 12px; cursor: pointer;
        }
    `;
    document.head.appendChild(style);
})();

// Inicializa tudo
document.addEventListener('DOMContentLoaded', () => {
    carregarFeed();
    inicializarPublicarDB();
    inicializarEventosFeed();
    inicializarScrollInfinito();
    inicializarPullToRefresh();
});
