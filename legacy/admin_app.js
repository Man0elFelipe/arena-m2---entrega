(function () {
    const usersBox = document.getElementById('admin-users');
    const postsBox = document.getElementById('admin-posts');
    const search = document.getElementById('admin-search');

    function esc(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    async function loadAdmin() {
        const q = encodeURIComponent(search?.value || '');
        const [users, posts] = await Promise.all([
            fetch('/api/admin/users?q=' + q).then(r => r.json()),
            fetch('/api/admin/posts?q=' + q).then(r => r.json())
        ]);

        if (usersBox && users.ok) {
            usersBox.innerHTML = '<h4>Perfis</h4>' + users.usuarios.map(u => `
                <div class="follow-card" data-user-id="${u.id}">
                    <img src="${esc(u.foto_perfil || 'LOGOARENA+PST.png')}" alt="${esc(u.nome)}">
                    <div>
                        <h5>${esc(u.nome)} <span>@${esc(u.username)}</span></h5>
                        <p>${esc(u.email)} • ${u.total_posts} posts • ${u.total_comunidades} comunidades • ${u.total_seguidores} seguidores</p>
                        <p>${esc([u.cidade, u.esporte_favorito, u.posicao_modalidade].filter(Boolean).join(' • '))}</p>
                        <p>${esc(u.bio || '')}</p>
                    </div>
                    ${u.e_admin_logado ? '<button class="follow-btn" disabled>Você</button>' : `<button class="follow-btn admin-delete-user" data-user-id="${u.id}"><i class="fas fa-trash"></i> Excluir</button>`}
                </div>`).join('');
            usersBox.querySelectorAll('.admin-delete-user').forEach(btn => {
                btn.onclick = () => deleteUser(btn.dataset.userId);
            });
        }

        if (postsBox && posts.ok) {
            postsBox.innerHTML = '<h4>Publicações recentes</h4>' + posts.posts.map(p => `
                <article class="post" data-post-id="${p.id}">
                    <div class="post-header">
                        <img src="${esc(p.foto_perfil || 'LOGOARENA+PST.png')}" alt="${esc(p.nome)}">
                        <div class="post-info">
                            <h4>${esc(p.nome)}</h4>
                            <span>@${esc(p.username)}</span>
                            ${p.comunidade_nome ? `<span>#${esc(p.comunidade_nome)}</span>` : ''}
                        </div>
                    </div>
                    <div class="post-content">
                        <p>${esc(p.texto || '[post sem texto]')}</p>
                        ${p.midia_url ? (p.midia_tipo === 'video' ? `<video src="${esc(p.midia_url)}" controls></video>` : `<img src="${esc(p.midia_url)}" alt="Mídia">`) : ''}
                    </div>
                    <div class="post-actions">
                        <button class="admin-delete-post" data-post-id="${p.id}"><i class="fas fa-trash"></i> Excluir post</button>
                        <button><i class="fas fa-heart"></i> ${p.total_curtidas}</button>
                        <button><i class="fas fa-comment"></i> ${p.total_comentarios}</button>
                    </div>
                </article>`).join('');
            postsBox.querySelectorAll('.admin-delete-post').forEach(btn => {
                btn.onclick = () => deletePost(btn.dataset.postId);
            });
        }
    }

    async function deletePost(postId) {
        if (!confirm('Remover esta publicação?')) return;
        const data = await fetch('/api/admin/posts/' + encodeURIComponent(postId), { method: 'DELETE' }).then(r => r.json());
        if (!data.ok) return alert(data.erro || 'Erro ao remover post.');
        loadAdmin();
    }

    async function deleteUser(userId) {
        if (!confirm('Excluir este usuário e remover posts, follows e vínculos relacionados?')) return;
        const data = await fetch('/api/admin/users/' + encodeURIComponent(userId), { method: 'DELETE' }).then(r => r.json());
        if (!data.ok) return alert(data.erro || 'Erro ao excluir usuário.');
        loadAdmin();
    }

    if (search) search.addEventListener('input', () => loadAdmin());
    document.addEventListener('DOMContentLoaded', loadAdmin);
})();
