// Perfil: dados + estatísticas (/usuarios/{id}/perfil), publicações, seguidores/seguindo, seguir e edição.
(function () {
  const eu = window.Sessao.exigir();
  const { esc, avatar, carregando, vazio, falha, toast, erro, comCarregamento, dataCompleta } = window.UI;
  const perfilId = Number(window.UI.param('id')) || eu.id;
  const proprio = perfilId === eu.id;
  window.UI.montarHeader(proprio ? 'perfil' : '');

  const cab = document.getElementById('cabecalho');
  const conteudo = document.getElementById('conteudo-aba');
  const btnMais = document.getElementById('btn-mais');
  let usuario = null;
  let aba = 'posts';
  let pagina = 0;

  async function carregarCabecalho() {
    cab.innerHTML = carregando();
    try {
      const [p, segue] = await Promise.all([
        window.Api.usuarios.perfil(perfilId),
        proprio ? Promise.resolve(null) : window.Api.seguimentos.verificar(eu.id, perfilId),
      ]);
      usuario = p.usuario;
      document.title = 'Arena+ | ' + usuario.nome;
      if (proprio) window.Sessao.salvar(usuario);
      cab.innerHTML = `
        <div class="perfil-capa"></div>
        <div class="perfil-corpo">
          ${avatar(usuario, 'lg')}
          <div class="perfil-dados">
            <h1>${esc(usuario.nome)} ${usuario.tipoPerfil === 'ADMINISTRADOR' ? '<span class="chip" title="Administrador">Equipe</span>' : ''}</h1>
            ${usuario.biografia ? `<p class="bio">${esc(usuario.biografia)}</p>` : proprio ? '<p class="bio">Adicione uma biografia para contar sua trajetória esportiva.</p>' : ''}
            <div class="perfil-meta">
              ${usuario.esportePrincipal ? `<span><i class="fa-solid fa-medal" aria-hidden="true"></i> ${esc(usuario.esportePrincipal)}</span>` : ''}
              ${usuario.cidade ? `<span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${esc(usuario.cidade)}</span>` : ''}
              <span><i class="fa-regular fa-calendar" aria-hidden="true"></i> Desde ${esc(dataCompleta(usuario.dataCadastro).split(' às')[0])}</span>
              ${usuario.ativo ? '' : '<span class="chip" style="background:#fee2e2;color:#991b1b">Conta desativada</span>'}
            </div>
            <div class="perfil-stats">
              <button data-ir="posts"><b>${p.totalPublicacoes}</b><span>${p.totalPublicacoes === 1 ? 'publicação' : 'publicações'}</span></button>
              <button data-ir="seguidores"><b id="n-seguidores">${p.totalSeguidores}</b><span>${p.totalSeguidores === 1 ? 'seguidor' : 'seguidores'}</span></button>
              <button data-ir="seguindo"><b>${p.totalSeguindo}</b><span>seguindo</span></button>
            </div>
          </div>
          ${proprio
            ? '<button class="btn btn-secundario" id="btn-editar"><i class="fa-solid fa-pen" aria-hidden="true"></i> Editar perfil</button>'
            : usuario.ativo ? `<button class="btn ${segue.segue ? 'btn-secundario' : 'btn-primario'}" id="btn-seguir" data-segue="${segue.segue}" data-carregando="...">
                ${segue.segue ? '<i class="fa-solid fa-check"></i> Seguindo' : '<i class="fa-solid fa-user-plus"></i> Seguir'}</button>` : ''}
        </div>`;
      cab.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => trocarAba(b.dataset.ir)));
      cab.querySelector('#btn-editar')?.addEventListener('click', abrirEdicao);
      cab.querySelector('#btn-seguir')?.addEventListener('click', alternarSeguir);
    } catch (e) {
      cab.innerHTML = e.status === 404
        ? vazio('fa-user-slash', 'Perfil não encontrado', 'Este usuário não existe.')
        : falha(e);
    }
  }

  async function alternarSeguir(ev) {
    const btn = ev.currentTarget;
    const segue = btn.dataset.segue === 'true';
    await comCarregamento(btn, async () => {
      try {
        if (segue) await window.Api.seguimentos.deixar(eu.id, perfilId);
        else await window.Api.seguimentos.seguir(eu.id, perfilId);
        toast(segue ? 'Você deixou de seguir ' + usuario.nome + '.' : 'Agora você segue ' + usuario.nome + '!');
      } catch (e) { erro(e); }
    });
    await carregarCabecalho();
    if (aba === 'seguidores') carregarAba();
  }

  // ---------- Abas ----------
  function trocarAba(nova) {
    aba = nova;
    document.querySelectorAll('[data-aba]').forEach((a) => a.setAttribute('aria-selected', String(a.dataset.aba === aba)));
    carregarAba();
  }
  document.querySelectorAll('[data-aba]').forEach((a) => a.addEventListener('click', () => trocarAba(a.dataset.aba)));

  function pessoaHtml(u) {
    return `<div class="card pessoa" style="padding:.75rem 1rem">
      <a href="perfil.html?id=${u.id}">${avatar(u)}</a>
      <div class="pessoa-info"><a href="perfil.html?id=${u.id}"><strong>${esc(u.nome)}</strong></a><small>${esc(u.esportePrincipal || 'Atleta')}</small></div>
      <a class="btn btn-secundario btn-pequeno" href="perfil.html?id=${u.id}">Ver perfil</a></div>`;
  }

  async function carregarAba() {
    btnMais.hidden = true;
    pagina = 0;
    conteudo.innerHTML = aba === 'posts' ? window.UI.esqueleto(2) : carregando();
    try {
      if (aba === 'posts') {
        const pag = await window.Api.publicacoes.listar({ usuarioId: perfilId, viewerId: eu.id, tamanho: 10 });
        conteudo.innerHTML = pag.conteudo.length
          ? pag.conteudo.map((p) => window.Componentes.postHtml(p, eu.id)).join('')
          : vazio('fa-camera', 'Nenhuma publicação ainda', proprio ? 'Compartilhe seu primeiro treino no feed!' : '');
        btnMais.hidden = pag.ultima;
      } else {
        const lista = aba === 'seguidores'
          ? (await window.Api.seguimentos.seguidores(perfilId)).map((s) => s.seguidor)
          : (await window.Api.seguimentos.seguindo(perfilId)).map((s) => s.seguido);
        conteudo.innerHTML = lista.length ? lista.map(pessoaHtml).join('')
          : vazio('fa-user-group', aba === 'seguidores' ? 'Nenhum seguidor ainda' : 'Ainda não segue ninguém');
      }
    } catch (e) {
      conteudo.innerHTML = falha(e, 'btn-retry');
      document.getElementById('btn-retry')?.addEventListener('click', carregarAba);
    }
  }

  btnMais.addEventListener('click', () => comCarregamento(btnMais, async () => {
    try {
      const pag = await window.Api.publicacoes.listar({ usuarioId: perfilId, viewerId: eu.id, tamanho: 10, pagina: pagina + 1 });
      pagina += 1;
      conteudo.insertAdjacentHTML('beforeend', pag.conteudo.map((p) => window.Componentes.postHtml(p, eu.id)).join(''));
      btnMais.hidden = pag.ultima;
    } catch (e) { erro(e); }
  }));

  window.Componentes.ligarPosts(conteudo, { aoMudar: carregarCabecalho });

  async function carregarComunidades() {
    const ul = document.getElementById('comunidades-usuario');
    try {
      const lista = await window.Api.membros.doUsuario(perfilId);
      ul.innerHTML = lista.map((m) => `<li><a href="comunidade.html?id=${m.comunidadeId}">
        <i class="fa-solid fa-hashtag" aria-hidden="true"></i> ${esc(m.comunidadeNome)}
        ${m.papel === 'MODERADOR' ? '<span class="chip" style="margin-left:auto">Moderador</span>' : ''}</a></li>`).join('')
        || '<li class="sem-comentarios">Não participa de comunidades.</li>';
    } catch (e) {
      ul.innerHTML = `<li class="sem-comentarios">${esc(e.message)}</li>`;
    }
  }

  // ---------- Edição ----------
  const formEditar = document.getElementById('form-editar');
  function abrirEdicao() {
    ['nome', 'biografia', 'cidade', 'esportePrincipal', 'fotoPerfilUrl'].forEach((c) => { formEditar.elements[c].value = usuario[c] || ''; });
    window.UI.abrirModal('dlg-editar');
  }
  document.getElementById('btn-cancelar-edicao').addEventListener('click', () => document.getElementById('dlg-editar').close());
  formEditar.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = formEditar.elements;
    if (!f.nome.value.trim()) return toast('O nome é obrigatório.', 'erro');
    await comCarregamento(formEditar.querySelector('.btn-primario'), async () => {
      try {
        const atualizado = await window.Api.usuarios.atualizar(eu.id, {
          nome: f.nome.value.trim(),
          biografia: f.biografia.value.trim() || null,
          cidade: f.cidade.value.trim() || null,
          esportePrincipal: f.esportePrincipal.value.trim() || null,
          fotoPerfilUrl: f.fotoPerfilUrl.value.trim() || null,
        });
        window.Sessao.salvar(atualizado);
        document.getElementById('dlg-editar').close();
        toast('Perfil atualizado!');
        carregarCabecalho();
      } catch (e) { erro(e); }
    });
  });
  document.getElementById('btn-desativar').addEventListener('click', async () => {
    document.getElementById('dlg-editar').close();
    if (!(await window.UI.confirmar('Desativar sua conta?', 'Seu perfil deixará de aparecer nas listagens e no feed. Esta é uma exclusão lógica.', 'Desativar'))) return;
    try {
      await window.Api.usuarios.desativar(eu.id);
      window.Sessao.sair();
    } catch (e) { erro(e); }
  });

  // ---------- Alterar senha ----------
  const dlgSenha = document.getElementById('dlg-senha');
  const formSenha = document.getElementById('form-senha');
  document.getElementById('btn-abrir-senha').addEventListener('click', () => {
    document.getElementById('dlg-editar').close();
    formSenha.reset();
    dlgSenha.showModal();
  });
  document.getElementById('btn-cancelar-senha').addEventListener('click', () => dlgSenha.close());
  formSenha.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = formSenha.elements;
    if (f.novaSenha.value.length < 6) return toast('A nova senha precisa ter pelo menos 6 caracteres.', 'erro');
    if (f.novaSenha.value !== f.confirmacao.value) return toast('A confirmação não confere com a nova senha.', 'erro');
    await comCarregamento(formSenha.querySelector('.btn-primario'), async () => {
      try {
        await window.Api.usuarios.alterarSenha(eu.id, f.senhaAtual.value, f.novaSenha.value);
        dlgSenha.close();
        toast('Senha alterada com sucesso.');
      } catch (e) { erro(e); }
    });
  });

  if (location.hash === '#seguidores' || location.hash === '#seguindo') aba = location.hash.slice(1);
  carregarCabecalho();
  trocarAba(aba);
  carregarComunidades();
})();
