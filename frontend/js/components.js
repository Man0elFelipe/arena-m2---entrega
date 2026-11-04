// Componentes reutilizáveis: card de publicação, diálogo de publicar (upload), card de comunidade e de pessoa.
(function () {
  const { esc, avatar, tempoRelativo, dataCompleta, urlSegura, toast, erro, comCarregamento, confirmar } = window.UI;

  const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
  const LIMITE_IMAGEM = 10 * 1024 * 1024;
  const LIMITE_VIDEO = 50 * 1024 * 1024;

  // ---------- Publicação ----------
  function midiaHtml(p) {
    const url = urlSegura(p.midiaUrl);
    if (!url) return '';
    if (p.tipoMidia === 'VIDEO') {
      return `<div class="post-midia"><video src="${esc(url)}" controls preload="metadata" playsinline
        aria-label="Vídeo publicado por ${esc(p.autor?.nome)}"></video></div>`;
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
                <a href="publicacao.html?id=${p.id}" class="post-data"><time datetime="${esc(p.dataPublicacao)}" title="${esc(dataCompleta(p.dataPublicacao))}">${tempoRelativo(p.dataPublicacao)}</time></a>
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
          <button class="acao" data-acao="compartilhar" aria-label="Compartilhar publicação" title="Compartilhar">
            <i class="fa-solid fa-share-nodes" aria-hidden="true"></i><span class="acao-rotulo">Compartilhar</span>
          </button>
          <button class="acao acao-direita ${p.salvaPeloUsuario ? 'salvo' : ''}" data-acao="salvar" aria-pressed="${!!p.salvaPeloUsuario}"
                  aria-label="${p.salvaPeloUsuario ? 'Remover dos salvos' : 'Salvar publicação'}" title="${p.salvaPeloUsuario ? 'Remover dos salvos' : 'Salvar'}">
            <i class="fa-${p.salvaPeloUsuario ? 'solid' : 'regular'} fa-bookmark" aria-hidden="true"></i>
          </button>
        </footer>
        <section class="comentarios" hidden></section>
      </article>`;
  }

  function comentarioHtml(c, meuId, donoDoPost) {
    const pode = c.usuarioId === meuId || donoDoPost === meuId;
    return `<li class="comentario" data-id="${c.id}">
      <a href="perfil.html?id=${c.usuarioId}">${avatar(c.autor, 'sm')}</a>
      <div class="comentario-corpo">
        <a href="perfil.html?id=${c.usuarioId}"><strong>${esc(c.autor?.nome)}</strong></a>
        <time datetime="${esc(c.dataComentario)}">${tempoRelativo(c.dataComentario)}</time>
        <p>${esc(c.texto)}</p>
      </div>
      ${pode ? `<button class="btn-icone btn-mini" data-acao="excluir-comentario" aria-label="Excluir comentário"><i class="fa-solid fa-xmark"></i></button>` : ''}
    </li>`;
  }

  async function abrirComentarios(card, postId, meuId) {
    const area = card.querySelector('.comentarios');
    area.innerHTML = window.UI.carregando('Carregando comentários...');
    try {
      const lista = await window.Api.comentarios.listar(postId);
      const dono = Number(card.querySelector('.post-autor').getAttribute('href').split('=')[1]);
      area.innerHTML = `
        <ul class="lista-comentarios">${lista.map((c) => comentarioHtml(c, meuId, dono)).join('') || '<li class="sem-comentarios">Seja o primeiro a comentar.</li>'}</ul>
        <form class="form-comentario">
          <label class="sr-only" for="com-${postId}">Escreva um comentário</label>
          <input id="com-${postId}" name="texto" maxlength="1000" placeholder="Escreva um comentário..." autocomplete="off" required>
          <button class="btn btn-primario btn-pequeno" data-carregando="Enviando">Enviar</button>
        </form>`;
    } catch (e) {
      area.innerHTML = window.UI.falha(e);
    }
  }

  function linkDaPublicacao(id) {
    return new URL('publicacao.html?id=' + id, window.location.href).href;
  }

  /** Web Share API quando existe; senão copia o link; se nem isso for possível, mostra o link para copiar à mão. */
  async function compartilhar(id, texto) {
    const url = linkDaPublicacao(id);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Arena+', text: String(texto || '').slice(0, 120), url });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // o usuário fechou o painel de compartilhamento
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copiado para a área de transferência!');
    } catch (e) {
      const { dlg, fechar } = window.UI.dialogoTemporario(`<h3>Link da publicação</h3>
        <p>Copie o link abaixo para compartilhar:</p>
        <label class="campo"><span class="sr-only">Link</span><input readonly value="${esc(url)}"></label>
        <div class="dialogo-acoes"><button type="button" class="btn btn-primario" data-fechar>Fechar</button></div>`);
      dlg.querySelector('input').select();
      dlg.querySelector('[data-fechar]').addEventListener('click', fechar);
      dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); fechar(); });
    }
  }

  /**
   * Liga os eventos de todas as publicações dentro de container (delegação).
   * opcoes.aoMudar(): após editar/excluir. opcoes.aoDessalvar(card): após remover dos salvos.
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
        const aplicar = (v) => {
          btn.classList.toggle('curtido', v);
          btn.setAttribute('aria-pressed', String(v));
          btn.querySelector('i').className = `fa-${v ? 'solid' : 'regular'} fa-heart`;
        };
        aplicar(!curtido); // atualização otimista, revertida em caso de erro
        n.textContent = Number(n.textContent) + (curtido ? -1 : 1);
        btn.disabled = true;
        try {
          if (curtido) await window.Api.curtidas.descurtir(postId);
          else await window.Api.curtidas.curtir(postId);
        } catch (e) {
          aplicar(curtido);
          n.textContent = Number(n.textContent) + (curtido ? 1 : -1);
          erro(e);
        } finally {
          btn.disabled = false;
        }
      }

      if (acao === 'salvar') {
        const salvo = btn.classList.contains('salvo');
        const aplicar = (v) => {
          btn.classList.toggle('salvo', v);
          btn.setAttribute('aria-pressed', String(v));
          btn.setAttribute('aria-label', v ? 'Remover dos salvos' : 'Salvar publicação');
          btn.title = v ? 'Remover dos salvos' : 'Salvar';
          btn.querySelector('i').className = `fa-${v ? 'solid' : 'regular'} fa-bookmark`;
        };
        aplicar(!salvo);
        btn.disabled = true;
        try {
          if (salvo) await window.Api.salvos.remover(postId);
          else await window.Api.salvos.salvar(postId);
          toast(salvo ? 'Removida dos salvos.' : 'Publicação salva!');
          if (salvo) opcoes.aoDessalvar?.(card);
        } catch (e) {
          aplicar(salvo);
          erro(e);
        } finally {
          btn.disabled = false;
        }
      }

      if (acao === 'compartilhar') {
        compartilhar(postId, card.querySelector('.post-texto').textContent);
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
        if (!(await confirmar('Excluir comentário?', 'Esta ação não pode ser desfeita.', 'Excluir'))) return;
        try {
          await window.Api.comentarios.excluir(li.dataset.id);
          li.remove();
          const n = card.querySelector('.n-comentarios');
          n.textContent = Math.max(0, Number(n.textContent) - 1);
          toast('Comentário excluído.');
        } catch (e) { erro(e); }
      }

      if (acao === 'excluir') {
        if (!(await confirmar('Excluir publicação?', 'A publicação, seus comentários, curtidas e a mídia enviada serão removidos.', 'Excluir'))) return;
        try {
          await window.Api.publicacoes.excluir(postId);
          card.remove();
          toast('Publicação excluída.');
          opcoes.aoMudar?.();
        } catch (e) { erro(e); }
      }

      if (acao === 'editar') editarPost(card, postId, opcoes);
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
      const dono = Number(card.querySelector('.post-autor').getAttribute('href').split('=')[1]);
      await comCarregamento(form.querySelector('button'), async () => {
        try {
          const c = await window.Api.comentarios.criar(postId, texto);
          const lista = card.querySelector('.lista-comentarios');
          lista.querySelector('.sem-comentarios')?.remove();
          lista.insertAdjacentHTML('beforeend', comentarioHtml(c, meuId, dono));
          const n = card.querySelector('.n-comentarios');
          n.textContent = Number(n.textContent) + 1;
          input.value = '';
          input.focus();
        } catch (e) { erro(e); }
      });
    });
  }

  async function editarPost(card, postId, opcoes) {
    let p;
    try {
      p = await window.Api.publicacoes.buscar(postId);
    } catch (e) { return erro(e); }
    const { dlg, fechar } = window.UI.dialogoTemporario(`<form>
        <h3>Editar publicação</h3>
        <label class="campo"><span>Texto</span><textarea name="texto" rows="4" maxlength="2000" required>${esc(p.texto)}</textarea></label>
        ${p.midiaUrl ? `<label class="campo-check"><input type="checkbox" name="removerMidia"> Remover ${p.tipoMidia === 'VIDEO' ? 'o vídeo' : 'a imagem'} desta publicação</label>` : ''}
        <div class="dialogo-acoes">
          <button type="button" class="btn btn-secundario" value="cancelar">Cancelar</button>
          <button class="btn btn-primario" data-carregando="Salvando">Salvar</button>
        </div></form>`);
    dlg.querySelector('[value=cancelar]').addEventListener('click', fechar);
    dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); fechar(); });
    dlg.querySelector('form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = ev.target;
      await comCarregamento(f.querySelector('.btn-primario'), async () => {
        try {
          const manter = p.midiaUrl && !(f.elements.removerMidia && f.elements.removerMidia.checked);
          const atualizado = await window.Api.publicacoes.atualizar(postId, {
            texto: f.elements.texto.value.trim(),
            midiaUrl: manter ? p.midiaUrl : null,
            tipoMidia: manter ? p.tipoMidia : null,
          });
          card.outerHTML = postHtml(atualizado, window.Sessao.id());
          fechar();
          toast('Publicação atualizada.');
          opcoes.aoMudar?.();
        } catch (e) { erro(e); }
      });
    });
  }

  // ---------- Diálogo de publicar (com upload) ----------
  function formatarTamanho(bytes) {
    return bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  /** Valida no navegador (o servidor valida de novo pelo conteúdo). Devolve uma mensagem de erro ou null. */
  function validarArquivo(arquivo) {
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      return 'Formato não suportado. Use imagens JPEG, PNG ou WebP, ou vídeos MP4.';
    }
    const limite = arquivo.type === 'video/mp4' ? LIMITE_VIDEO : LIMITE_IMAGEM;
    if (arquivo.size > limite) {
      return `Arquivo grande demais (${formatarTamanho(arquivo.size)}). Limite: ${limite / 1024 / 1024} MB para ${arquivo.type === 'video/mp4' ? 'vídeos' : 'imagens'}.`;
    }
    return null;
  }

  async function abrirPublicar(opcoes = {}) {
    const eu = window.Sessao.usuario();
    if (!eu) return;
    let minhas = [];
    try { minhas = await window.Api.membros.doUsuario(eu.id); } catch (e) { /* publica no feed geral mesmo sem a lista */ }
    const { dlg, fechar } = window.UI.dialogoTemporario(`
      <form id="form-publicar-dlg" novalidate>
        <h3>Nova publicação</h3>
        <div class="compor-linha">
          ${avatar(eu)}
          <label class="campo" style="flex:1;margin:0"><span class="sr-only">Texto da publicação</span>
            <textarea name="texto" rows="4" maxlength="2000" required placeholder="Compartilhe um treino, jogo ou conquista..."></textarea></label>
        </div>
        <label class="campo" style="margin-top:.75rem"><span>Publicar em</span>
          <select name="comunidadeId">
            <option value="">🌐 Feed geral</option>
            ${minhas.map((m) => `<option value="${m.comunidadeId}" ${Number(opcoes.comunidadeId) === m.comunidadeId ? 'selected' : ''}>👥 ${esc(m.comunidadeNome)}</option>`).join('')}
          </select></label>
        <div class="upload-area">
          <input type="file" name="arquivo" id="pub-arquivo" accept="image/jpeg,image/png,image/webp,video/mp4" hidden>
          <button type="button" class="btn btn-secundario btn-pequeno" id="pub-escolher"><i class="fa-regular fa-image" aria-hidden="true"></i> Adicionar foto ou vídeo</button>
          <small>JPEG, PNG, WebP (até 10 MB) · MP4 (até 50 MB) · uma mídia por publicação</small>
        </div>
        <div class="preview-midia" id="pub-preview" hidden></div>
        <div class="progresso" id="pub-progresso" hidden role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="progresso-barra"></div><span class="progresso-rotulo">0%</span>
        </div>
        <p class="msg-erro-form" id="pub-erro" role="alert" hidden></p>
        <div class="dialogo-acoes">
          <button type="button" class="btn btn-secundario" id="pub-cancelar">Cancelar</button>
          <button class="btn btn-primario" id="pub-enviar" data-carregando="Publicando"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Publicar</button>
        </div>
      </form>`);
    const form = dlg.querySelector('form');
    const entrada = dlg.querySelector('#pub-arquivo');
    const preview = dlg.querySelector('#pub-preview');
    const barra = dlg.querySelector('#pub-progresso');
    const msgErro = dlg.querySelector('#pub-erro');
    let arquivo = null;
    let midiaEnviada = null; // se o envio deu certo mas a publicação falhou, reaproveita sem reenviar
    let enviando = false;
    let urlPreview = null;

    const limparPreview = () => {
      if (urlPreview) URL.revokeObjectURL(urlPreview);
      urlPreview = null;
      arquivo = null;
      midiaEnviada = null;
      entrada.value = '';
      preview.hidden = true;
      preview.innerHTML = '';
    };
    const mostrarErro = (m) => { msgErro.textContent = m || ''; msgErro.hidden = !m; };
    const fecharTudo = () => { limparPreview(); fechar(); };

    dlg.querySelector('#pub-escolher').addEventListener('click', () => entrada.click());
    entrada.addEventListener('change', () => {
      mostrarErro('');
      const f = entrada.files[0];
      if (!f) return;
      const problema = validarArquivo(f);
      if (problema) {
        limparPreview();
        return mostrarErro(problema);
      }
      limparPreview();
      arquivo = f;
      urlPreview = URL.createObjectURL(f);
      preview.hidden = false;
      preview.innerHTML = `${f.type === 'video/mp4'
        ? `<video src="${urlPreview}" controls preload="metadata" playsinline aria-label="Pré-visualização do vídeo"></video>`
        : `<img src="${urlPreview}" alt="Pré-visualização da imagem">`}
        <div class="preview-info"><span>${esc(f.name)} · ${formatarTamanho(f.size)}</span>
        <button type="button" class="btn-icone btn-mini" id="pub-remover" aria-label="Remover mídia"><i class="fa-solid fa-xmark"></i></button></div>`;
      preview.querySelector('#pub-remover').addEventListener('click', limparPreview);
    });
    dlg.querySelector('#pub-cancelar').addEventListener('click', () => { if (!enviando) fecharTudo(); });
    dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); if (!enviando) fecharTudo(); });

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      mostrarErro('');
      const texto = form.elements.texto.value.trim();
      if (!texto) {
        form.elements.texto.focus();
        return mostrarErro('Escreva algo antes de publicar.');
      }
      enviando = true;
      dlg.querySelector('#pub-cancelar').disabled = true;
      await comCarregamento(dlg.querySelector('#pub-enviar'), async () => {
        try {
          if (arquivo && !midiaEnviada) {
            barra.hidden = false;
            midiaEnviada = await window.Api.midias.enviar(arquivo, (pct) => {
              barra.querySelector('.progresso-barra').style.width = pct + '%';
              barra.querySelector('.progresso-rotulo').textContent = pct + '%';
              barra.setAttribute('aria-valuenow', String(pct));
            });
          }
          const cid = form.elements.comunidadeId.value;
          const pub = await window.Api.publicacoes.criar({
            comunidadeId: cid ? Number(cid) : null,
            texto,
            midiaUrl: midiaEnviada ? midiaEnviada.url : null,
            tipoMidia: midiaEnviada ? midiaEnviada.tipoMidia : null,
          });
          fecharTudo();
          toast('Publicação criada!');
          window.dispatchEvent(new CustomEvent('arena:publicado', { detail: pub }));
          opcoes.aoPublicar?.(pub);
        } catch (e) {
          barra.hidden = true;
          mostrarErro(e.message);
        } finally {
          enviando = false;
          dlg.querySelector('#pub-cancelar').disabled = false;
        }
      });
    });
    form.elements.texto.focus();
  }

  // ---------- Comunidade e pessoa ----------
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

  const NIVEIS = { INICIANTE: 'Iniciante', INTERMEDIARIO: 'Intermediário', AVANCADO: 'Avançado', PROFISSIONAL: 'Profissional' };

  /** Card de pessoa. opcoes.sigo: true/false mostra o botão seguir; opcoes.detalhes: mostra objetivos e disponibilidade. */
  function pessoaCardHtml(u, opcoes = {}) {
    const meta = [u.esportePrincipal, u.cidade].filter(Boolean).join(' · ') || 'Atleta';
    return `<article class="card pessoa-card" data-usuario="${u.id}">
      <a href="perfil.html?id=${u.id}" aria-label="Perfil de ${esc(u.nome)}">${avatar(u)}</a>
      <h3><a href="perfil.html?id=${u.id}">${esc(u.nome)}</a></h3>
      <small class="pessoa-meta">${esc(meta)}</small>
      ${u.nivelExperiencia ? `<span class="chip">${esc(NIVEIS[u.nivelExperiencia] || u.nivelExperiencia)}</span>` : ''}
      <p>${esc((opcoes.detalhes && u.objetivos) || u.biografia || '')}</p>
      ${opcoes.detalhes && u.disponibilidade ? `<small class="pessoa-disp"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${esc(u.disponibilidade)}</small>` : ''}
      <div class="pessoa-acoes">
        <a class="btn btn-secundario btn-pequeno" href="mensagens.html?com=${u.id}"><i class="fa-regular fa-comment-dots" aria-hidden="true"></i> Mensagem</a>
        ${opcoes.sigo === undefined ? '' : `<button class="btn ${opcoes.sigo ? 'btn-secundario' : 'btn-primario'} btn-pequeno" data-seguir-toggle="${u.id}" data-segue="${opcoes.sigo}" data-carregando="...">
          ${opcoes.sigo ? '<i class="fa-solid fa-check"></i> Seguindo' : '<i class="fa-solid fa-user-plus"></i> Seguir'}</button>`}
      </div>
    </article>`;
  }

  /** Delegação do botão seguir/deixar de seguir dos cards de pessoa. */
  function ligarPessoas(container, aoMudar) {
    container.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('[data-seguir-toggle]');
      if (!btn) return;
      const alvo = Number(btn.dataset.seguirToggle);
      const segue = btn.dataset.segue === 'true';
      btn.disabled = true; // sem comCarregamento: ele restauraria o HTML antigo e desfaria a atualização abaixo
      try {
        if (segue) await window.Api.seguimentos.deixar(alvo);
        else await window.Api.seguimentos.seguir(alvo);
        toast(segue ? 'Você deixou de seguir.' : 'Seguindo!');
        btn.dataset.segue = String(!segue);
        btn.className = `btn ${segue ? 'btn-primario' : 'btn-secundario'} btn-pequeno`;
        btn.innerHTML = segue ? '<i class="fa-solid fa-user-plus"></i> Seguir' : '<i class="fa-solid fa-check"></i> Seguindo';
        aoMudar?.();
      } catch (e) {
        erro(e);
      } finally {
        btn.disabled = false;
      }
    });
  }

  window.Componentes = { postHtml, ligarPosts, abrirPublicar, compartilhar, comunidadeCardHtml, pessoaCardHtml, ligarPessoas, NIVEIS };
})();
