(function () {
    const page = document.body.dataset.page || '';
    const communityId = parseInt(document.body.dataset.communityId || '0', 10);
    const fallbackAvatar = '/LOGOARENA+PST.png';
    const fallbackCover = '/academia.png';

    function esc(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function asset(url) {
        if (!url) return '';
        const value = String(url);
        if (/^(https?:)?\/\//i.test(value) || value.startsWith('/') || value.startsWith('data:')) return value;
        return '/' + value;
    }

    async function api(params, body) {
        const query = new URLSearchParams(params);
        const options = body ? { method: 'POST', body } : {};
        const res = await fetch('/api/communities?' + query.toString(), options);
        return res.json();
    }

    function postHtml(p, admin) {
        const comunidade = p.comunidade_nome ? `<span>#${esc(p.comunidade_nome)}</span>` : '';
        const pin = p.fixado ? '<span><i class="fas fa-thumbtack"></i> Fixado</span>' : '';
        const adminBtn = admin ? `<button class="pin-post" data-post-id="${p.id}" data-fixed="${p.fixado ? '1' : '0'}"><i class="fas fa-thumbtack"></i> ${p.fixado ? 'Desfixar' : 'Fixar'}</button>` : '';
        return `
            <article class="post">
                <div class="post-header">
                    <img src="${esc(asset(p.foto_perfil) || fallbackAvatar)}" alt="${esc(p.nome)}">
                    <div class="post-info">
                        <h4>${esc(p.nome)}</h4>
                        <span>@${esc(p.username)}</span>
                        ${comunidade}${pin}
                    </div>
                </div>
                <div class="post-content"><p>${esc(p.texto || '')}</p></div>
                <div class="post-actions">${adminBtn}<button><i class="fas fa-comment"></i> ${p.total_comentarios || 0}</button></div>
            </article>`;
    }

    async function carregarDetalhe() {
        const data = await api({ acao: 'detalhe', id: communityId });
        if (!data.ok) throw new Error(data.erro || 'Comunidade não encontrada.');
        return data;
    }

    function preencherHeader(data) {
        const c = data.comunidade;
        const cover = document.getElementById('community-cover');
        const avatar = document.getElementById('community-avatar');
        if (cover) cover.innerHTML = `<img src="${esc(asset(c.banner_url || c.capa_url || c.imagem) || fallbackCover)}" alt="${esc(c.nome)}">`;
        if (avatar) avatar.src = asset(c.avatar_url || c.imagem) || fallbackAvatar;
        const name = document.getElementById('community-name');
        const meta = document.getElementById('community-meta');
        const desc = document.getElementById('community-description');
        const join = document.getElementById('community-join-toggle');
        const members = document.getElementById('community-members-link');
        const admin = document.getElementById('community-admin-link');
        const feed = document.getElementById('community-feed-link');
        if (name) name.textContent = c.nome;
        if (meta) meta.textContent = `${c.total_membros} membros` + (c.theme || c.categoria ? ` • ${c.theme || c.categoria}` : '');
        if (desc) desc.textContent = c.descricao || 'Comunidade esportiva da Arena+.';
        if (join) {
            join.innerHTML = data.participa ? '<i class="fas fa-user-check"></i> Sair' : '<i class="fas fa-user-plus"></i> Entrar';
            join.onclick = () => entrarOuSair(data.participa);
        }
        if (members) members.href = `/communities/${c.id}/members`;
        if (admin) {
            admin.href = `/communities/${c.id}/admin`;
            admin.hidden = !data.admin;
        }
        if (feed) feed.href = `/communities/${c.id}`;
    }

    async function entrarOuSair(participa) {
        const fd = new FormData();
        fd.append('acao', participa ? 'sair' : 'entrar');
        fd.append('id', communityId);
        const data = await fetch('/api/communities', { method: 'POST', body: fd }).then(r => r.json());
        if (!data.ok) return alert(data.erro || 'Erro ao atualizar comunidade.');
        location.reload();
    }

    async function initDetalhe() {
        const data = await carregarDetalhe();
        preencherHeader(data);
        const feed = await api({ acao: 'feed', id: communityId });
        const pinned = document.getElementById('pinned-posts');
        const list = document.getElementById('community-feed');
        if (pinned) {
            pinned.innerHTML = feed.fixados && feed.fixados.length ? '<div class="communities-header"><h2>Fixados</h2></div>' + feed.fixados.map(p => postHtml(p, data.admin)).join('') : '';
        }
        if (list) {
            list.innerHTML = feed.posts && feed.posts.length ? feed.posts.map(p => postHtml(p, data.admin)).join('') : '<div class="post"><div class="post-content"><p>Nenhum post nesta comunidade ainda.</p></div></div>';
        }
        const btn = document.getElementById('community-post-btn');
        const input = document.getElementById('community-post-text');
        if (btn && input) {
            btn.onclick = async () => {
                const texto = input.value.trim();
                if (!texto) return;
                const fd = new FormData();
                fd.append('acao', 'criar');
                fd.append('texto', texto);
                fd.append('comunidade_id', communityId);
                const res = await fetch('/api/posts', { method: 'POST', body: fd }).then(r => r.json());
                if (!res.ok) return alert(res.erro || 'Erro ao publicar.');
                input.value = '';
                initDetalhe();
            };
        }
        document.querySelectorAll('.pin-post').forEach(btn => {
            btn.onclick = () => fixarPost(btn.dataset.postId, btn.dataset.fixed !== '1');
        });
    }

    async function fixarPost(postId, fixar) {
        const fd = new FormData();
        fd.append('acao', 'fixar_post');
        fd.append('id', communityId);
        fd.append('post_id', postId);
        fd.append('fixado', fixar ? '1' : '0');
        const data = await fetch('/api/communities', { method: 'POST', body: fd }).then(r => r.json());
        if (!data.ok) return alert(data.erro || 'Erro ao fixar post.');
        initDetalhe();
    }

    async function initDescobrir() {
        const list = document.getElementById('communities-list');
        const input = document.getElementById('communities-search');
        let category = '';
        async function render() {
            const data = await api({ acao: 'listar', q: input?.value || '', categoria: category });
            if (!list) return;
            list.innerHTML = data.comunidades.map(c => `
                <article class="sport-card" data-name="${esc(c.nome)} ${esc(c.theme || c.categoria)}" data-community-id="${c.id}">
                    <img src="${esc(asset(c.banner_url || c.avatar_url || c.imagem) || fallbackAvatar)}" alt="${esc(c.nome)}">
                    <div class="sport-info">
                        <h3>${esc(c.nome)}</h3>
                        <p>${esc(c.descricao || 'Comunidade esportiva da Arena+.')} • ${c.total_membros} membros</p>
                    </div>
                    <a class="follow-btn" href="/comunidade/${c.id}">Abrir</a>
                </article>`).join('');
            list.querySelectorAll('.sport-card').forEach(card => {
                card.addEventListener('click', e => {
                    if (e.target.closest('a,button')) return;
                    window.location.href = `/comunidade/${card.dataset.communityId}`;
                });
            });
        }
        if (input) input.addEventListener('input', render);
        document.querySelectorAll('.community-filter').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.community-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                category = btn.dataset.category || '';
                render();
            };
        });
        const createBtn = document.getElementById('new-community-btn');
        if (createBtn) {
            createBtn.onclick = async () => {
                const nome = document.getElementById('new-community-name')?.value.trim();
                if (!nome) return;
                const fd = new FormData();
                fd.append('acao', 'criar');
                fd.append('nome', nome);
                fd.append('categoria', document.getElementById('new-community-category')?.value.trim() || '');
                fd.append('descricao', document.getElementById('new-community-description')?.value.trim() || '');
                const data = await fetch('/api/communities', { method: 'POST', body: fd }).then(r => r.json());
                if (!data.ok) return alert(data.erro || 'Erro ao criar comunidade.');
                window.location.href = `/communities/${data.id}`;
            };
        }
        render();
    }

    async function initMembros() {
        const detail = await carregarDetalhe();
        const back = document.getElementById('community-back-link');
        if (back) back.href = `/communities/${communityId}`;
        document.getElementById('members-title').textContent = `Membros de ${detail.comunidade.nome}`;
        document.getElementById('members-subtitle').textContent = `${detail.comunidade.total_membros} pessoas na comunidade`;
        const data = await api({ acao: 'membros', id: communityId });
        const list = document.getElementById('community-members-list');
        if (list) list.innerHTML = data.membros.map(m => `
            <div class="follow-card">
                <img src="${esc(asset(m.foto_perfil) || fallbackAvatar)}" alt="${esc(m.nome)}">
                <div><h5>${esc(m.nome)}</h5><p>@${esc(m.username)}</p></div>
            </div>`).join('');
    }

    async function initAdmin() {
        const detail = await carregarDetalhe();
        const back = document.getElementById('admin-back-link');
        if (back) back.href = `/communities/${communityId}`;
        const status = document.getElementById('admin-status');
        const panel = document.getElementById('admin-panel');
        if (!detail.admin) {
            if (status) status.textContent = 'Somente o criador pode administrar esta comunidade.';
            return;
        }
        if (status) status.textContent = 'Você é o criador desta comunidade.';
        if (panel) panel.hidden = false;
        const c = detail.comunidade;
        document.getElementById('admin-name').value = c.nome || '';
        document.getElementById('admin-category').value = c.categoria || '';
        document.getElementById('admin-avatar').value = c.avatar_url || c.imagem || '';
        document.getElementById('admin-cover').value = c.capa_url || '';
        document.getElementById('admin-description').value = c.descricao || '';
        document.getElementById('admin-save').onclick = salvarAdmin;
        renderAdminLists();
    }

    async function salvarAdmin() {
        const fd = new FormData();
        fd.append('acao', 'atualizar_info');
        fd.append('id', communityId);
        fd.append('nome', document.getElementById('admin-name').value);
        fd.append('categoria', document.getElementById('admin-category').value);
        fd.append('avatar_url', document.getElementById('admin-avatar').value);
        fd.append('capa_url', document.getElementById('admin-cover').value);
        fd.append('descricao', document.getElementById('admin-description').value);
        const data = await fetch('/api/communities', { method: 'POST', body: fd }).then(r => r.json());
        alert(data.ok ? 'Comunidade atualizada.' : (data.erro || 'Erro ao salvar.'));
    }

    async function renderAdminLists() {
        const members = await api({ acao: 'membros', id: communityId });
        const memberBox = document.getElementById('admin-members');
        if (memberBox) {
            memberBox.innerHTML = '<div class="communities-header"><h2>Remover membros</h2></div>' + members.membros.map(m => `
                <div class="follow-card">
                    <img src="${esc(asset(m.foto_perfil) || fallbackAvatar)}" alt="${esc(m.nome)}">
                    <div><h5>${esc(m.nome)}</h5><p>@${esc(m.username)}</p></div>
                    <button class="follow-btn remove-member" data-user-id="${m.id}">Remover</button>
                </div>`).join('');
            memberBox.querySelectorAll('.remove-member').forEach(btn => btn.onclick = () => removerMembro(btn.dataset.userId));
        }
        const feed = await api({ acao: 'feed', id: communityId });
        const postsBox = document.getElementById('admin-posts');
        if (postsBox) {
            postsBox.innerHTML = '<div class="communities-header"><h2>Fixar posts</h2></div>' + feed.posts.concat(feed.fixados || []).map(p => postHtml(p, true)).join('');
            postsBox.querySelectorAll('.pin-post').forEach(btn => btn.onclick = () => fixarPost(btn.dataset.postId, btn.dataset.fixed !== '1'));
        }
    }

    async function removerMembro(userId) {
        const fd = new FormData();
        fd.append('acao', 'remover_membro');
        fd.append('id', communityId);
        fd.append('usuario_id', userId);
        const data = await fetch('/api/communities', { method: 'POST', body: fd }).then(r => r.json());
        if (!data.ok) return alert(data.erro || 'Erro ao remover membro.');
        renderAdminLists();
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (page === 'comunidade') initDetalhe().catch(err => alert(err.message));
        if (page === 'comunidades-descobrir') initDescobrir();
        if (page === 'comunidade-membros') initMembros().catch(err => alert(err.message));
        if (page === 'comunidade-admin') initAdmin().catch(err => alert(err.message));
    });
})();
