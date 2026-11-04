// Feed: criar publicação, feed "Seguindo" (/usuarios/{id}/feed) e "Explorar" (/publicacoes), sugestões.
(function () {
  const eu = window.Sessao.exigir();
  const { esc, avatar, carregando, vazio, falha, toast, erro, comCarregamento, urlSegura } = window.UI;
  window.UI.montarHeader('feed');

  const lista = document.getElementById('lista-posts');
  const btnMais = document.getElementById('btn-mais');
  let modo = 'seguindo';
  let pagina = 0;

  document.getElementById('compor-avatar').innerHTML = avatar(eu);

  // ---------- Lateral: perfil e comunidades ----------
  async function carregarPerfil() {
    const alvo = document.getElementById('mini-perfil-conteudo');
    try {
      const p = await window.Api.usuarios.perfil(eu.id);
      window.Sessao.salvar(p.usuario);
      alvo.innerHTML = `
        ${avatar(p.usuario)}
        <h2><a href="perfil.html?id=${eu.id}">${esc(p.usuario.nome)}</a></h2>
        <small>${esc([p.usuario.esportePrincipal, p.usuario.cidade].filter(Boolean).join(' · ') || 'Atleta Arena+')}</small>
        <div class="mini-perfil-stats">
          <a href="perfil.html?id=${eu.id}"><b>${p.totalPublicacoes}</b><span>${p.totalPublicacoes === 1 ? 'post' : 'posts'}</span></a>
          <a href="perfil.html?id=${eu.id}#seguidores"><b>${p.totalSeguidores}</b><span>${p.totalSeguidores === 1 ? 'seguidor' : 'seguidores'}</span></a>
          <a href="perfil.html?id=${eu.id}#seguindo"><b>${p.totalSeguindo}</b><span>seguindo</span></a>
        </div>`;
    } catch (e) {
      if (e.status === 404) { window.Sessao.limpar(); return window.location.replace('index.html'); } // conta inexistente
      alvo.innerHTML = `<p class="estado">${esc(e.message)}</p>`;
    }
  }

  async function carregarMinhasComunidades() {
    const ul = document.getElementById('minhas-comunidades');
    try {
      const minhas = await window.Api.membros.doUsuario(eu.id);
      ul.innerHTML = minhas.length
        ? minhas.map((m) => `<li><a href="comunidade.html?id=${m.comunidadeId}"><i class="fa-solid fa-hashtag" aria-hidden="true"></i> ${esc(m.comunidadeNome)}</a></li>`).join('')
        : '<li><a href="comunidades.html"><i class="fa-solid fa-compass" aria-hidden="true"></i> Descobrir comunidades</a></li>';
    } catch (e) {
      ul.innerHTML = `<li class="sem-comentarios">${esc(e.message)}</li>`;
    }
  }

  async function carregarSugestoes() {
    const alvo = document.getElementById('sugestoes');
    alvo.innerHTML = carregando();
    try {
      const [todos, seguindo] = await Promise.all([
        window.Api.usuarios.listar({ tamanho: 30 }),
        window.Api.seguimentos.seguindo(eu.id),
      ]);
      const jaSigo = new Set(seguindo.map((s) => s.seguidoId));
      const sugestoes = todos.conteudo.filter((u) => u.id !== eu.id && !jaSigo.has(u.id)).slice(0, 5);
      alvo.innerHTML = sugestoes.length ? sugestoes.map((u) => `
        <div class="pessoa">
          <a href="perfil.html?id=${u.id}">${avatar(u)}</a>
          <div class="pessoa-info"><a href="perfil.html?id=${u.id}"><strong>${esc(u.nome)}</strong></a><small>${esc(u.esportePrincipal || 'Atleta')}</small></div>
          <button class="btn btn-primario btn-pequeno" data-seguir="${u.id}" data-carregando="...">Seguir</button>
        </div>`).join('') : '<p class="sem-comentarios">Você já segue todo mundo por aqui!</p>';
    } catch (e) {
      alvo.innerHTML = `<p class="sem-comentarios">${esc(e.message)}</p>`;
    }
  }

  document.getElementById('sugestoes').addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-seguir]');
    if (!btn) return;
    await comCarregamento(btn, async () => {
      try {
        await window.Api.seguimentos.seguir(eu.id, Number(btn.dataset.seguir));
        toast('Agora você segue ' + btn.closest('.pessoa').querySelector('strong').textContent + '.');
        btn.closest('.pessoa').remove();
        carregarPerfil();
        if (modo === 'seguindo') recarregar();
      } catch (e) { erro(e); }
    });
  });

  async function carregarComunidadesAlta() {
    const ul = document.getElementById('comunidades-alta');
    try {
      const pag = await window.Api.comunidades.listar({ tamanho: 50 });
      const top = pag.conteudo.sort((a, b) => b.totalMembros - a.totalMembros).slice(0, 5);
      ul.innerHTML = top.map((c) => `<li><a href="comunidade.html?id=${c.id}">
        <img src="${esc(urlSegura(c.imagemUrl, 'img/logo-arena.png'))}" alt="" loading="lazy" onerror="this.src='img/logo-arena.png'">
        <span>${esc(c.nome)}<br><small style="color:var(--texto-3)">${window.UI.plural(c.totalMembros, 'membro')}</small></span></a></li>`).join('')
        || '<li class="sem-comentarios">Nenhuma comunidade ainda.</li>';
    } catch (e) {
      ul.innerHTML = `<li class="sem-comentarios">${esc(e.message)}</li>`;
    }
  }

  // ---------- Feed ----------
  async function buscarPagina(p) {
    return modo === 'seguindo'
      ? window.Api.publicacoes.feed(p, 10)
      : window.Api.publicacoes.listar({ pagina: p, tamanho: 10 });
  }

  async function recarregar() {
    pagina = 0;
    btnMais.hidden = true;
    lista.innerHTML = window.UI.esqueleto();
    try {
      const pag = await buscarPagina(0);
      if (!pag.conteudo.length) {
        lista.innerHTML = modo === 'seguindo'
          ? vazio('fa-people-arrows', 'Seu feed está vazio', 'Siga pessoas ou publique algo para começar. Veja também a aba Explorar.')
          : vazio('fa-newspaper', 'Nenhuma publicação ainda', 'Seja o primeiro a publicar!');
        return;
      }
      lista.innerHTML = pag.conteudo.map((p) => window.Componentes.postHtml(p, eu.id)).join('');
      btnMais.hidden = pag.ultima;
    } catch (e) {
      lista.innerHTML = falha(e, 'btn-retry');
      document.getElementById('btn-retry')?.addEventListener('click', recarregar);
    }
  }

  btnMais.addEventListener('click', () => comCarregamento(btnMais, async () => {
    try {
      const pag = await buscarPagina(pagina + 1);
      pagina += 1;
      lista.insertAdjacentHTML('beforeend', pag.conteudo.map((p) => window.Componentes.postHtml(p, eu.id)).join(''));
      btnMais.hidden = pag.ultima;
    } catch (e) { erro(e); }
  }));

  document.querySelectorAll('[data-feed]').forEach((aba) => aba.addEventListener('click', () => {
    modo = aba.dataset.feed;
    document.querySelectorAll('[data-feed]').forEach((a) => a.setAttribute('aria-selected', String(a === aba)));
    recarregar();
  }));

  window.Componentes.ligarPosts(lista, { aoMudar: carregarPerfil });

  // ---------- Publicar (diálogo com upload, compartilhado com a navegação) ----------
  document.getElementById('abrir-publicar').addEventListener('click', () => window.Componentes.abrirPublicar());
  window.addEventListener('arena:publicado', () => { carregarPerfil(); recarregar(); });

  carregarPerfil();
  carregarMinhasComunidades();
  carregarSugestoes();
  carregarComunidadesAlta();
  recarregar();
})();
