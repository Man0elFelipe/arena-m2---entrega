// Componentes reutilizáveis: card de publicação (curtir, comentar, editar, excluir) e card de comunidade.
(function () {
  const { esc, avatar, tempoRelativo, dataCompleta, urlSegura } = window.UI;

  function midiaHtml(p) {
    const url = urlSegura(p.midiaUrl);
    if (!url) return '';
    if (p.tipoMidia === 'VIDEO') {
      return `<div class="post-midia"><video src="${esc(url)}" controls preload="metadata"></video></div>`;
    }
    return `<div class="post-midia"><img src="${esc(url)}" alt="Imagem publicada por ${esc(p.autor?.nome)}" loading="lazy"
      onerror="this.closest('.post-midia').remove()"></div>`;
  }

  function postHtml(p, meuId) {
    const meu = p.usuarioId === meuId;
    return `
      <article class="card post" data-id="${p.id}" aria-label="Publicação de ${esc(p.autor?.nome)}">
        <header class="post-topo">
          <a href="perfil.html?id=${p.usuarioId}" class="post-autor">
            ${avatar(p.autor)}
            <span>
              <strong>${esc(p.autor?.nome)}</strong>
              <small>
                ${p.autor?.esportePrincipal ? esc(p.autor.esportePrincipal) + ' · ' : ''}
                <time datetime="${esc(p.dataPublicacao)}" title="${esc(dataCompleta(p.dataPublicacao))}">${tempoRelativo(p.dataPublicacao)}</time>
                ${p.dataEdicao ? ' · <span title="Editado em ' + esc(dataCompleta(p.dataEdicao)) + '">editado</span>' : ''}
              </small>
            </span>
          </a>
          ${p.comunidadeId ? `<a class="chip" href="comunidade.html?id=${p.comunidadeId}"><i class="fa-solid fa-people-group" aria-hidden="true"></i> ${esc(p.comunidadeNome)}</a>` : ''}
          ${meu ? `<div class="menu-post">
              <button class="btn-icone" data-acao="editar" aria-label="Editar publicação" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icone" data-acao="excluir" aria-label="Excluir publicação" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </div>` : ''}
        </header>
        <p class="post-texto">${esc(p.texto)}</p>
        ${midiaHtml(p)}
        <footer class="post-acoes">
          <button class="acao ${p.curtidaPeloUsuario ? 'curtido' : ''}" data-acao="curtir" aria-pressed="${!!p.curtidaPeloUsuario}">
            <i class="fa-${p.curtidaPeloUsuario ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i>
            <span class="n-curtidas">${p.totalCurtidas}</span><span class="sr-only"> curtidas</span>
          </button>
          <button class="acao" data-acao="comentarios" aria-expanded="false">
            <i class="fa-regular fa-comment" aria-hidden="true"></i>
            <span class="n-comentarios">${p.totalComentarios}</span><span class="sr-only"> comentários</span>
          </button>
        </footer>
        <section class="comentarios" hidden></section>
      </article>`;
  }

  function comentarioHtml(c, meuId) {
    return `<li class="comentario" data-id="${c.id}">
      <a href="perfil.html?id=${c.usuarioId}">${avatar(c.autor, 'sm')}</a>
      <div class="comentario-corpo">
        <a href="perfil.html?id=${c.usuarioId}"><strong>${esc(c.autor?.nome)}</strong></a>
        <time datetime="${esc(c.dataComentario)}">${tempoRelativo(c.dataComentario)}</time>
        <p>${esc(c.texto)}</p>
      </div>
      ${c.usuarioId === meuId ? `<button class="btn-icone btn-mini" data-acao="excluir-comentario" aria-label="Excluir comentário"><i class="fa-solid fa-xmark"></i></button>` : ''}
    </li>`;
  }

  async function abrirComentarios(card, postId, meuId) {
    const area = card.querySelector('.comentarios');
    area.innerHTML = window.UI.carregando('Carregando comentários...');
    try {
      const lista = await window.Api.comentarios.listar(postId);
      area.innerHTML = `
        <ul class="lista-comentarios">${lista.map((c) => comentarioHtml(c, meuId)).join('') || '<li class="sem-comentarios">Seja o primeiro a comentar.</li>'}</ul>
        <form class="form-comentario">
          <label class="sr-only" for="com-${postId}">Escreva um comentário</label>
          <input id="com-${postId}" name="texto" maxlength="1000" placeholder="Escreva um comentário..." autocomplete="off" required>
          <button class="btn btn-primario btn-pequeno" data-carregando="Enviando">Enviar</button>
        </form>`;
    } catch (e) {
      area.innerHTML = window.UI.falha(e);
    }
  }

  /**
   * Liga os eventos de todas as publicações dentro de container (delegação).
   * opcoes.aoMudar(): chamado após editar/excluir para recarregar a lista.
   */
  function ligarPosts(container, opcoes = {}) {
    const meuId = window.Sessao.id();

    container.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('[data-acao]');
      if (!btn) return;
      const card = btn.closest('.post');
      const postId = Number(card.dataset.id);
      const acao = btn.dataset.acao;

      if (acao === 'curtir') {
        const curtido = btn.classList.contains('curtido');
        const n = btn.querySelector('.n-curtidas');
        // atualização otimista, revertida em caso de erro
        btn.classList.toggle('curtido', !curtido);
        btn.setAttribute('aria-pressed', String(!curtido));
        btn.querySelector('i').className = `fa-${!curtido ? 'solid' : 'regular'} fa-heart`;
        n.textContent = Number(n.textContent) + (curtido ? -1 : 1);
        btn.disabled = true;
        try {
          if (curtido) await window.Api.curtidas.descurtir(meuId, postId);
          else await window.Api.curtidas.curtir(meuId, postId);
        } catch (e) {
          btn.classList.toggle('curtido', curtido);
          btn.setAttribute('aria-pressed', String(curtido));
          btn.querySelector('i').className = `fa-${curtido ? 'solid' : 'regular'} fa-heart`;
          n.textContent = Number(n.textContent) + (curtido ? 1 : -1);
          window.UI.erro(e);
        } finally {
          btn.disabled = false;
        }
      }

      if (acao === 'comentarios') {
        const area = card.querySelector('.comentarios');
        const abrir = area.hidden;
        area.hidden = !abrir;
        btn.setAttribute('aria-expanded', String(abrir));
        if (abrir) await abrirComentarios(card, postId, meuId);
      }

      if (acao === 'excluir-comentario') {
        const li = btn.closest('.comentario');
        if (!(await window.UI.confirmar('Excluir comentário?', 'Esta ação não pode ser desfeita.', 'Excluir'))) return;
        try {
          await window.Api.comentarios.excluir(li.dataset.id);
          li.remove();
          const n = card.querySelector('.n-comentarios');
          n.textContent = Math.max(0, Number(n.textContent) - 1);
          window.UI.toast('Comentário excluído.');
        } catch (e) { window.UI.erro(e); }
      }

      if (acao === 'excluir') {
        if (!(await window.UI.confirmar('Excluir publicação?', 'A publicação, seus comentários e curtidas serão removidos.', 'Excluir'))) return;
        try {
          await window.Api.publicacoes.excluir(postId);
          card.remove();
          window.UI.toast('Publicação excluída.');
          opcoes.aoMudar?.();
        } catch (e) { window.UI.erro(e); }
      }

      if (acao === 'editar') {
        editarPost(card, postId, opcoes);
      }
    });

    container.addEventListener('submit', async (ev) => {
      const form = ev.target.closest('.form-comentario');
      if (!form) return;
      ev.preventDefault();
      const card = form.closest('.post');
      const postId = Number(card.dataset.id);
      const input = form.elements.texto;
      const texto = input.value.trim();
      if (!texto) return;
      await window.UI.comCarregamento(form.querySelector('button'), async () => {
        try {
          const c = await window.Api.comentarios.criar(meuId, postId, texto);
          const lista = card.querySelector('.lista-comentarios');
          lista.querySelector('.sem-comentarios')?.remove();
          lista.insertAdjacentHTML('beforeend', comentarioHtml(c, meuId));
          const n = card.querySelector('.n-comentarios');
          n.textContent = Number(n.textContent) + 1;
          input.value = '';
          input.focus();
        } catch (e) { window.UI.erro(e); }
      });
    });
  }

  async function editarPost(card, postId, opcoes) {
    let p;
    try {
      p = await window.Api.publicacoes.buscar(postId);
    } catch (e) { return window.UI.erro(e); }
    const { dlg, fechar } = window.UI.dialogoTemporario(`<form>
        <h3>Editar publicação</h3>
        <label class="campo"><span>Texto</span><textarea name="texto" rows="4" maxlength="2000" required>${esc(p.texto)}</textarea></label>
        <label class="campo"><span>URL da imagem ou vídeo (opcional)</span><input name="midiaUrl" value="${esc(p.midiaUrl || '')}" maxlength="500" placeholder="img/futebol.jpeg ou https://..."></label>
        <div class="dialogo-acoes">
          <button type="button" class="btn btn-secundario" value="cancelar">Cancelar</button>
          <button class="btn btn-primario" data-carregando="Salvando">Salvar</button>
        </div></form>`);
    dlg.querySelector('[value=cancelar]').addEventListener('click', fechar);
    dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); fechar(); });
    dlg.querySelector('form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = ev.target;
      await window.UI.comCarregamento(f.querySelector('.btn-primario'), async () => {
        try {
          const atualizado = await window.Api.publicacoes.atualizar(postId, {
            texto: f.elements.texto.value.trim(),
            midiaUrl: f.elements.midiaUrl.value.trim() || null,
          });
          atualizado.curtidaPeloUsuario = card.querySelector('[data-acao=curtir]').classList.contains('curtido');
          card.outerHTML = postHtml(atualizado, window.Sessao.id());
          fechar();
          window.UI.toast('Publicação atualizada.');
          opcoes.aoMudar?.();
        } catch (e) { window.UI.erro(e); }
      });
    });
  }

  function comunidadeCardHtml(c, participa) {
    const img = urlSegura(c.imagemUrl, 'img/logo-arena.png');
    return `<article class="card comunidade-card">
      <a href="comunidade.html?id=${c.id}" class="comunidade-capa"><img src="${esc(img)}" alt="" loading="lazy" onerror="this.src='img/logo-arena.png'"></a>
      <div class="comunidade-info">
        <span class="chip chip-esporte">${esc(c.esporte)}</span>
        <h3><a href="comunidade.html?id=${c.id}">${esc(c.nome)}</a></h3>
        <p>${esc(c.descricao)}</p>
        <div class="comunidade-meta">
          <span><i class="fa-solid fa-user-group" aria-hidden="true"></i> ${window.UI.plural(c.totalMembros, 'membro')}</span>
          <span><i class="fa-regular fa-newspaper" aria-hidden="true"></i> ${window.UI.plural(c.totalPublicacoes, 'post')}</span>
        </div>
        ${participa === undefined ? '' : `<button class="btn ${participa ? 'btn-secundario' : 'btn-primario'} btn-bloco" data-comunidade="${c.id}" data-participa="${participa}">
          ${participa ? '<i class="fa-solid fa-check"></i> Participando' : '<i class="fa-solid fa-plus"></i> Entrar'}</button>`}
      </div>
    </article>`;
  }

  window.Componentes = { postHtml, ligarPosts, comunidadeCardHtml };
})();
