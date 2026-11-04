// Perfil: dados + estatísticas, perfil esportivo, publicações, seguidores/seguindo, seguir, mensagem e edição.
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

  function dadosEsportivos(u) {
    const itens = [
      ['Modalidades', u.modalidadesFavoritas],
      ['Nível', u.nivelExperiencia && window.Componentes.NIVEIS[u.nivelExperiencia]],
      ['Objetivos', u.objetivos],
      ['Disponibilidade', u.disponibilidade],
      ['Conquistas', u.conquistas],
    ].filter(([, v]) => v);
    const card = document.getElementById('card-esportivo');
    card.hidden = !itens.length && !proprio;
    document.getElementById('dados-esportivos').innerHTML = itens.length
      ? itens.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')
      : '<p class="sem-comentarios">Adicione suas modalidades, nível e objetivos em “Editar perfil”.</p>';
  }

  async function carregarCabecalho() {
    cab.innerHTML = carregando();
    try {
      const [p, segue] = await Promise.all([
        window.Api.usuarios.perfil(perfilId),
        proprio ? Promise.resolve(null) : window.Api.seguimentos.verificar(perfilId),
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
          <div class="perfil-acoes">
            ${proprio
              ? `<button class="btn btn-secundario" id="btn-editar"><i class="fa-solid fa-pen" aria-hidden="true"></i> Editar perfil</button>
                 <a class="btn btn-secundario" href="salvos.html"><i class="fa-regular fa-bookmark" aria-hidden="true"></i> Salvos</a>`
              : usuario.ativo ? `<button class="btn ${segue.segue ? 'btn-secundario' : 'btn-primario'}" id="btn-seguir" data-segue="${segue.segue}" data-carregando="...">
                  ${segue.segue ? '<i class="fa-solid fa-check"></i> Seguindo' : '<i class="fa-solid fa-user-plus"></i> Seguir'}</button>
                 <a class="btn btn-secundario" href="mensagens.html?com=${usuario.id}"><i class="fa-regular fa-comment-dots" aria-hidden="true"></i> Mensagem</a>` : ''}
          </div>
        </div>`;
      cab.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => trocarAba(b.dataset.ir)));
      cab.querySelector('#btn-editar')?.addEventListener('click', abrirEdicao);
      cab.querySelector('#btn-seguir')?.addEventListener('click', alternarSeguir);
      dadosEsportivos(usuario);
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
        if (segue) await window.Api.seguimentos.deixar(perfilId);
        else await window.Api.seguimentos.seguir(perfilId);
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

  function pessoaLinha(u) {
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
        const pag = await window.Api.publicacoes.listar({ usuarioId: perfilId, tamanho: 10 });
        conteudo.innerHTML = pag.conteudo.length
          ? pag.conteudo.map((p) => window.Componentes.postHtml(p, eu.id)).join('')
          : vazio('fa-camera', 'Nenhuma publicação ainda', proprio ? 'Compartilhe seu primeiro treino pelo botão Publicar!' : '');
        btnMais.hidden = pag.ultima;
      } else {
        const lista = aba === 'seguidores'
          ? (await window.Api.seguimentos.seguidores(perfilId)).map((s) => s.seguidor)
          : (await window.Api.seguimentos.seguindo(perfilId)).map((s) => s.seguido);
        conteudo.innerHTML = lista.length ? lista.map(pessoaLinha).join('')
          : vazio('fa-user-group', aba === 'seguidores' ? 'Nenhum seguidor ainda' : 'Ainda não segue ninguém');
      }
    } catch (e) {
      conteudo.innerHTML = falha(e, 'btn-retry');
      document.getElementById('btn-retry')?.addEventListener('click', carregarAba);
    }
  }

  btnMais.addEventListener('click', () => comCarregamento(btnMais, async () => {
    try {
      const pag = await window.Api.publicacoes.listar({ usuarioId: perfilId, tamanho: 10, pagina: pagina + 1 });
      pagina += 1;
      conteudo.insertAdjacentHTML('beforeend', pag.conteudo.map((p) => window.Componentes.postHtml(p, eu.id)).join(''));
      btnMais.hidden = pag.ultima;
    } catch (e) { erro(e); }
  }));

  window.Componentes.ligarPosts(conteudo, { aoMudar: carregarCabecalho });
  window.addEventListener('arena:publicado', () => { carregarCabecalho(); if (aba === 'posts') carregarAba(); });

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
  const dlgEditar = document.getElementById('dlg-editar');
  const formEditar = document.getElementById('form-editar');
  const fotoArquivo = document.getElementById('foto-arquivo');
  let fotoNova = null;      // arquivo escolhido (ainda não enviado)
  let fotoRemovida = false;
  let previaUrl = null;

  function mostrarPrevia(u, urlLocal) {
    document.getElementById('foto-previa').innerHTML = urlLocal
      ? `<img class="avatar avatar-md" src="${urlLocal}" alt="Pré-visualização da foto">`
      : avatar(fotoRemovida ? { nome: u.nome } : u, 'md');
  }

  function abrirEdicao() {
    ['nome', 'biografia', 'cidade', 'esportePrincipal', 'modalidadesFavoritas', 'disponibilidade', 'objetivos', 'conquistas']
      .forEach((c) => { formEditar.elements[c].value = usuario[c] || ''; });
    formEditar.elements.nivelExperiencia.value = usuario.nivelExperiencia || '';
    formEditar.elements.procuraParceiros.checked = !!usuario.procuraParceiros;
    formEditar.elements.mostrarDisponibilidade.checked = !!usuario.mostrarDisponibilidade;
    fotoNova = null; fotoRemovida = false; fotoArquivo.value = '';
    if (previaUrl) { URL.revokeObjectURL(previaUrl); previaUrl = null; }
    mostrarPrevia(usuario, null);
    dlgEditar.showModal();
  }

  document.getElementById('foto-escolher').addEventListener('click', () => fotoArquivo.click());
  document.getElementById('foto-remover').addEventListener('click', () => {
    fotoNova = null; fotoRemovida = true; fotoArquivo.value = '';
    mostrarPrevia(usuario, null);
  });
  fotoArquivo.addEventListener('change', () => {
    const f = fotoArquivo.files[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { fotoArquivo.value = ''; return toast('Use uma imagem JPEG, PNG ou WebP.', 'erro'); }
    if (f.size > 10 * 1024 * 1024) { fotoArquivo.value = ''; return toast('A imagem deve ter no máximo 10 MB.', 'erro'); }
    fotoNova = f; fotoRemovida = false;
    if (previaUrl) URL.revokeObjectURL(previaUrl);
    previaUrl = URL.createObjectURL(f);
    mostrarPrevia(usuario, previaUrl);
  });

  document.getElementById('btn-cancelar-edicao').addEventListener('click', () => dlgEditar.close());
  formEditar.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = formEditar.elements;
    if (!f.nome.value.trim()) return toast('O nome é obrigatório.', 'erro');
    await comCarregamento(formEditar.querySelector('.btn-primario'), async () => {
      try {
        let foto = fotoRemovida ? null : usuario.fotoPerfilUrl;
        if (fotoNova) foto = (await window.Api.midias.enviar(fotoNova)).url;
        const vazioNulo = (v) => v.trim() || null;
        const atualizado = await window.Api.usuarios.atualizar(eu.id, {
          nome: f.nome.value.trim(),
          fotoPerfilUrl: foto,
          biografia: vazioNulo(f.biografia.value),
          cidade: vazioNulo(f.cidade.value),
          esportePrincipal: vazioNulo(f.esportePrincipal.value),
          modalidadesFavoritas: vazioNulo(f.modalidadesFavoritas.value),
          nivelExperiencia: f.nivelExperiencia.value || null,
          objetivos: vazioNulo(f.objetivos.value),
          disponibilidade: vazioNulo(f.disponibilidade.value),
          conquistas: vazioNulo(f.conquistas.value),
          procuraParceiros: f.procuraParceiros.checked,
          mostrarDisponibilidade: f.mostrarDisponibilidade.checked,
        });
        window.Sessao.salvar(atualizado);
        dlgEditar.close();
        toast('Perfil atualizado!');
        carregarCabecalho();
      } catch (e) { erro(e); }
    });
  });

  document.getElementById('btn-desativar').addEventListener('click', async () => {
    dlgEditar.close();
    if (!(await window.UI.confirmar('Desativar sua conta?', 'Seu perfil deixará de aparecer nas listagens e no feed e você será desconectado. Esta é uma exclusão lógica.', 'Desativar'))) return;
    try {
      await window.Api.usuarios.desativar(eu.id);
      window.Sessao.limpar();
      window.location.href = 'index.html';
    } catch (e) { erro(e); }
  });

  // ---------- Alterar senha ----------
  const dlgSenha = document.getElementById('dlg-senha');
  const formSenha = document.getElementById('form-senha');
  document.getElementById('btn-abrir-senha').addEventListener('click', () => {
    dlgEditar.close();
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
