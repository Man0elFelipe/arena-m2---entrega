// Página da comunidade: dados, entrar/sair, membros, publicações vinculadas e moderação básica.
(function () {
  const eu = window.Sessao.exigir();
  const { esc, avatar, carregando, vazio, falha, toast, erro, comCarregamento, urlSegura } = window.UI;
  window.UI.montarHeader('comunidades');

  const id = Number(window.UI.param('id'));
  const banner = document.getElementById('banner');
  const lista = document.getElementById('lista-posts');
  const form = document.getElementById('form-publicar');
  let comunidade = null;
  let minhaParticipacao = null;

  if (!id) {
    banner.innerHTML = vazio('fa-circle-question', 'Comunidade não informada', 'Volte para a lista de comunidades.');
    return;
  }

  async function carregarTudo() {
    banner.innerHTML = carregando();
    try {
      const [c, membros] = await Promise.all([window.Api.comunidades.buscar(id), window.Api.membros.daComunidade(id)]);
      comunidade = c;
      minhaParticipacao = membros.find((m) => m.usuarioId === eu.id) || null;
      document.title = 'Arena+ | ' + c.nome;
      const moderador = minhaParticipacao?.papel === 'MODERADOR';
      banner.innerHTML = `
        <img src="${esc(urlSegura(c.imagemUrl, 'img/logo-arena.png'))}" alt="" onerror="this.src='img/logo-arena.png'">
        <div class="banner-info">
          <div>
            <span class="chip chip-esporte">${esc(c.esporte)}</span>
            <h1>${esc(c.nome)}</h1>
            <p>${esc(c.descricao)}</p>
            <div class="comunidade-meta" style="margin-top:.5rem">
              <span><i class="fa-solid fa-user-group" aria-hidden="true"></i> ${window.UI.plural(c.totalMembros, 'membro')}</span>
              <span><i class="fa-regular fa-newspaper" aria-hidden="true"></i> ${window.UI.plural(c.totalPublicacoes, 'publicação', 'publicações')}</span>
              <span>Criada por <a href="perfil.html?id=${c.criadorId}"><b>${esc(c.criadorNome)}</b></a></span>
            </div>
          </div>
          <div class="banner-acoes">
            ${moderador ? '<button class="btn btn-secundario" id="btn-editar"><i class="fa-solid fa-gear" aria-hidden="true"></i> Gerenciar</button>' : ''}
            <button class="btn ${minhaParticipacao ? 'btn-secundario' : 'btn-primario'}" id="btn-participar" data-carregando="...">
              ${minhaParticipacao ? '<i class="fa-solid fa-check"></i> Participando' : '<i class="fa-solid fa-plus"></i> Entrar na comunidade'}</button>
          </div>
        </div>`;
      document.getElementById('btn-participar').addEventListener('click', alternarParticipacao);
      document.getElementById('btn-editar')?.addEventListener('click', abrirEdicao);
      form.hidden = !minhaParticipacao;
      renderMembros(membros);
      carregarPosts();
    } catch (e) {
      banner.innerHTML = e.status === 404 ? vazio('fa-people-group', 'Comunidade não encontrada', 'Ela pode ter sido excluída.') : falha(e);
      lista.innerHTML = '';
    }
  }

  function renderMembros(membros) {
    const souModerador = minhaParticipacao?.papel === 'MODERADOR';
    document.getElementById('n-membros').textContent = membros.length;
    document.getElementById('membros').innerHTML = membros.map((m) => {
      const mod = m.papel === 'MODERADOR';
      const podeAlterar = souModerador && m.usuarioId !== eu.id;
      return `<div class="pessoa">
        <a href="perfil.html?id=${m.usuarioId}">${avatar(m.usuario, 'sm')}</a>
        <div class="pessoa-info"><a href="perfil.html?id=${m.usuarioId}"><strong>${esc(m.usuario.nome)}</strong></a>
          <small>${mod ? '<i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Moderador' : 'Membro'}</small></div>
        ${podeAlterar ? `<button class="btn-icone btn-mini" data-membro="${m.id}" data-papel="${mod ? 'MEMBRO' : 'MODERADOR'}"
            title="${mod ? 'Remover moderação' : 'Tornar moderador'}" aria-label="${mod ? 'Remover moderação de' : 'Tornar moderador'} ${esc(m.usuario.nome)}">
            <i class="fa-solid ${mod ? 'fa-user-minus' : 'fa-user-shield'}"></i></button>` : ''}
      </div>`;
    }).join('') || '<p class="sem-comentarios">Nenhum membro.</p>';
  }

  document.getElementById('membros').addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-membro]');
    if (!btn) return;
    const nome = btn.closest('.pessoa').querySelector('strong').textContent;
    const promover = btn.dataset.papel === 'MODERADOR';
    if (!(await window.UI.confirmar(promover ? 'Tornar moderador?' : 'Remover moderação?',
      promover ? nome + ' poderá editar e excluir esta comunidade.' : nome + ' voltará a ser membro comum.',
      promover ? 'Tornar moderador' : 'Remover', !promover))) return;
    btn.disabled = true;
    try {
      await window.Api.membros.alterarPapel(btn.dataset.membro, btn.dataset.papel);
      toast(promover ? nome + ' agora é moderador.' : nome + ' voltou a ser membro.');
      renderMembros(await window.Api.membros.daComunidade(id));
    } catch (e) {
      btn.disabled = false;
      erro(e);
    }
  });

  let pagina = 0;
  const btnMais = document.getElementById('btn-mais');

  async function carregarPosts() {
    pagina = 0;
    btnMais.hidden = true;
    lista.innerHTML = window.UI.esqueleto(2);
    try {
      const pag = await window.Api.publicacoes.listar({ comunidadeId: id, viewerId: eu.id, tamanho: 10 });
      lista.innerHTML = pag.conteudo.length
        ? pag.conteudo.map((p) => window.Componentes.postHtml(p, eu.id)).join('')
        : vazio('fa-comments', 'Nenhuma publicação nesta comunidade', minhaParticipacao ? 'Comece a conversa!' : 'Entre na comunidade para publicar.');
      btnMais.hidden = pag.ultima;
    } catch (e) {
      lista.innerHTML = falha(e);
    }
  }

  btnMais.addEventListener('click', () => comCarregamento(btnMais, async () => {
    try {
      const pag = await window.Api.publicacoes.listar({ comunidadeId: id, viewerId: eu.id, tamanho: 10, pagina: pagina + 1 });
      pagina += 1;
      lista.insertAdjacentHTML('beforeend', pag.conteudo.map((p) => window.Componentes.postHtml(p, eu.id)).join(''));
      btnMais.hidden = pag.ultima;
    } catch (e) { erro(e); }
  }));
  window.Componentes.ligarPosts(lista, { aoMudar: carregarTudo });

  async function alternarParticipacao(ev) {
    const btn = ev.currentTarget;
    if (minhaParticipacao && !(await window.UI.confirmar('Sair da comunidade?', 'Você não poderá mais publicar aqui até entrar novamente.', 'Sair', false))) return;
    await comCarregamento(btn, async () => {
      try {
        if (minhaParticipacao) await window.Api.membros.sair(eu.id, id);
        else await window.Api.membros.entrar(eu.id, id);
        toast(minhaParticipacao ? 'Você saiu da comunidade.' : 'Bem-vindo à comunidade!');
      } catch (e) { erro(e); }
    });
    carregarTudo();
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const texto = form.elements.texto.value.trim();
    if (!texto) return toast('Escreva algo antes de publicar.', 'info');
    await comCarregamento(form.querySelector('button'), async () => {
      try {
        await window.Api.publicacoes.criar({ usuarioId: eu.id, comunidadeId: id, texto, midiaUrl: form.elements.midiaUrl.value.trim() || null });
        form.reset();
        toast('Publicado na comunidade!');
        carregarPosts();
      } catch (e) { erro(e); }
    });
  });

  // ---------- Moderação ----------
  const dlg = document.getElementById('dlg-editar');
  const formEditar = document.getElementById('form-editar');
  function abrirEdicao() {
    ['nome', 'esporte', 'descricao', 'imagemUrl'].forEach((c) => { formEditar.elements[c].value = comunidade[c] || ''; });
    dlg.showModal();
  }
  document.getElementById('btn-cancelar').addEventListener('click', () => dlg.close());
  formEditar.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = formEditar.elements;
    const dados = { nome: f.nome.value.trim(), esporte: f.esporte.value.trim(), descricao: f.descricao.value.trim(), imagemUrl: f.imagemUrl.value.trim() || null };
    if (!dados.nome || !dados.esporte || !dados.descricao) return toast('Preencha nome, esporte e descrição.', 'erro');
    await comCarregamento(formEditar.querySelector('.btn-primario'), async () => {
      try {
        await window.Api.comunidades.atualizar(id, dados);
        dlg.close();
        toast('Comunidade atualizada.');
        carregarTudo();
      } catch (e) { erro(e); }
    });
  });
  document.getElementById('btn-excluir').addEventListener('click', async () => {
    dlg.close();
    if (!(await window.UI.confirmar('Excluir comunidade?', 'Os vínculos de membros serão removidos. As publicações continuam no feed geral.', 'Excluir'))) return;
    try {
      await window.Api.comunidades.excluir(id);
      toast('Comunidade excluída.');
      window.location.href = 'comunidades.html';
    } catch (e) { erro(e); }
  });

  carregarTudo();
})();
