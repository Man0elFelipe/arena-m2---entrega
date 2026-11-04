// Utilitários de interface compartilhados: escape, datas, toasts, header, diálogos e estados.
(function () {
  const AVATAR_PADRAO = 'img/logo-arena.png';

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /**
   * Aceita apenas URLs seguras para src/href: http(s), caminhos relativos simples (img/x.jpg) e
   * /media/... (arquivos enviados à API, resolvidos para a origem do backend).
   */
  function urlSegura(url, padrao = '') {
    if (!url) return padrao;
    const u = String(url).trim();
    if (/^\/media\/[\w.-]+$/.test(u)) return (window.Api ? window.Api.origem : '') + u;
    if (/^(https?:)?\/\//i.test(u) || /^[\w./-]+$/.test(u)) return u;
    return padrao;
  }

  function iniciais(nome) {
    return String(nome || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }

  function avatar(usuario, tamanho = 'md') {
    const nome = usuario?.nome || 'Usuário';
    const url = urlSegura(usuario?.fotoPerfilUrl);
    if (url) {
      return `<img class="avatar avatar-${tamanho}" src="${esc(url)}" alt="Foto de ${esc(nome)}" loading="lazy"
        onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'avatar avatar-${tamanho} avatar-iniciais',textContent:'${esc(iniciais(nome))}'}))">`;
    }
    return `<span class="avatar avatar-${tamanho} avatar-iniciais" aria-hidden="true">${esc(iniciais(nome))}</span>`;
  }

  function tempoRelativo(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'agora';
    if (s < 3600) return Math.floor(s / 60) + ' min';
    if (s < 86400) return Math.floor(s / 3600) + ' h';
    if (s < 604800) return Math.floor(s / 86400) + ' d';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** plural(1, 'membro') -> "1 membro"; plural(2, 'publicação', 'publicações') -> "2 publicações". */
  function plural(n, singular, pluralForma = singular + 's') {
    return `${n} ${n === 1 ? singular : pluralForma}`;
  }

  function dataCompleta(iso) {
    return iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }) : '';
  }

  // ---------- Toasts ----------
  function toast(mensagem, tipo = 'sucesso') {
    let area = document.getElementById('toasts');
    if (!area) {
      area = document.createElement('div');
      area.id = 'toasts';
      area.className = 'toasts';
      area.setAttribute('aria-live', 'polite');
      area.setAttribute('role', 'status');
      document.body.appendChild(area);
    }
    const icone = { sucesso: 'fa-circle-check', erro: 'fa-circle-exclamation', info: 'fa-circle-info' }[tipo] || 'fa-circle-info';
    const el = document.createElement('div');
    el.className = 'toast toast-' + tipo;
    el.innerHTML = `<i class="fa-solid ${icone}" aria-hidden="true"></i><span>${esc(mensagem)}</span>`;
    area.appendChild(el);
    setTimeout(() => el.classList.add('saindo'), 3800);
    setTimeout(() => el.remove(), 4200);
  }

  function erro(e) {
    toast(e?.message || 'Algo deu errado. Tente novamente.', 'erro');
  }

  // ---------- Botões com estado de carregamento (evita duplo envio) ----------
  async function comCarregamento(botao, acao) {
    if (!botao || botao.disabled) return;
    const original = botao.innerHTML;
    botao.disabled = true;
    botao.setAttribute('aria-busy', 'true');
    botao.innerHTML = '<span class="spinner" aria-hidden="true"></span> ' + (botao.dataset.carregando || 'Aguarde...');
    try {
      return await acao();
    } finally {
      botao.disabled = false;
      botao.removeAttribute('aria-busy');
      botao.innerHTML = original;
    }
  }

  // ---------- Estados de lista ----------
  function carregando(texto = 'Carregando...') {
    return `<div class="estado"><span class="spinner spinner-lg" aria-hidden="true"></span><p>${esc(texto)}</p></div>`;
  }

  /** Placeholders no formato de card de publicação enquanto a lista carrega. */
  function esqueleto(qtd = 3) {
    const card = `<div class="card esqueleto" aria-hidden="true">
        <div class="esq-linha-topo"><span class="esq esq-avatar"></span><span class="esq esq-texto" style="width:40%"></span></div>
        <span class="esq esq-texto"></span><span class="esq esq-texto" style="width:75%"></span>
      </div>`;
    return `<div class="coluna" role="status"><span class="sr-only">Carregando publicações...</span>${card.repeat(qtd)}</div>`;
  }

  function vazio(icone, titulo, texto = '') {
    return `<div class="estado"><i class="fa-solid ${icone} estado-icone" aria-hidden="true"></i><h3>${esc(titulo)}</h3>${texto ? `<p>${esc(texto)}</p>` : ''}</div>`;
  }

  function falha(e, idBotao) {
    return `<div class="estado estado-erro" role="alert"><i class="fa-solid fa-plug-circle-xmark estado-icone" aria-hidden="true"></i>
      <h3>Não foi possível carregar</h3><p>${esc(e?.message || 'Erro desconhecido')}</p>
      ${idBotao ? `<button class="btn btn-secundario" id="${idBotao}"><i class="fa-solid fa-rotate-right"></i> Tentar novamente</button>` : ''}</div>`;
  }

  // ---------- Diálogo de confirmação acessível ----------
  /**
   * Cria um <dialog> temporário. Resolve pelos cliques/Esc diretamente, sem depender do
   * evento assíncrono 'close' (que o navegador pode adiar em abas em segundo plano).
   */
  function dialogoTemporario(html) {
    const dlg = document.createElement('dialog');
    dlg.className = 'dialogo';
    dlg.innerHTML = html;
    document.body.appendChild(dlg);
    const fechar = () => {
      if (dlg.open) dlg.close();
      dlg.remove();
    };
    dlg.showModal();
    return { dlg, fechar };
  }

  function confirmar(titulo, texto, rotuloOk = 'Confirmar', perigo = true) {
    return new Promise((resolve) => {
      const { dlg, fechar } = dialogoTemporario(`
          <h3>${esc(titulo)}</h3><p>${esc(texto)}</p>
          <div class="dialogo-acoes">
            <button type="button" data-resposta="nao" class="btn btn-secundario">Cancelar</button>
            <button type="button" data-resposta="sim" class="btn ${perigo ? 'btn-perigo' : 'btn-primario'}">${esc(rotuloOk)}</button>
          </div>`);
      const responder = (valor) => {
        fechar();
        resolve(valor);
      };
      dlg.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-resposta]');
        if (b) responder(b.dataset.resposta === 'sim');
      });
      dlg.addEventListener('cancel', (ev) => {
        ev.preventDefault();
        responder(false);
      });
      dlg.querySelector('[data-resposta=sim]').focus();
    });
  }

  /** Abre um <dialog> existente no HTML e devolve uma função para fechá-lo. */
  function abrirModal(id) {
    const dlg = document.getElementById(id);
    dlg.showModal();
    return () => dlg.close();
  }

  // ---------- Header e navegação ----------
  let timerMensagens = null;

  function atualizarBadge(total) {
    const b = document.getElementById('badge-msg');
    if (!b) return;
    b.textContent = total > 99 ? '99+' : String(total);
    b.hidden = !total;
    const link = document.getElementById('link-mensagens');
    if (link) link.setAttribute('aria-label', total ? `Mensagens (${total} não lidas)` : 'Mensagens');
  }

  async function consultarNaoLidas() {
    if (document.hidden) return;
    try {
      const r = await window.Api.conversas.naoLidas();
      atualizarBadge(r.total);
    } catch (e) { /* o contador é só um aviso: falha silenciosa */ }
  }

  function montarHeader(paginaAtiva) {
    const u = window.Sessao.usuario();
    const link = (href, icone, rotulo, chave) =>
      `<a href="${href}" class="nav-link ${paginaAtiva === chave ? 'ativo' : ''}" ${paginaAtiva === chave ? 'aria-current="page"' : ''}>
        <i class="fa-solid ${icone}" aria-hidden="true"></i><span>${rotulo}</span></a>`;
    const header = document.createElement('header');
    header.className = 'topo';
    header.innerHTML = `
      <div class="topo-conteudo">
        <a href="feed.html" class="marca" aria-label="Arena+ — início">
          <img src="img/logo-arena.png" alt="" width="36" height="36"><span>Arena<b>+</b></span>
        </a>
        <form class="busca" role="search" action="explorar.html">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <label for="busca-global" class="sr-only">Buscar pessoas, comunidades e publicações</label>
          <input id="busca-global" name="q" type="search" placeholder="Buscar pessoas, esportes e comunidades" autocomplete="off">
        </form>
        <nav class="nav" aria-label="Navegação principal">
          ${link('feed.html', 'fa-house', 'Início', 'feed')}
          ${link('explorar.html', 'fa-compass', 'Explorar', 'explorar')}
          <button type="button" class="nav-link nav-publicar" id="nav-publicar" aria-haspopup="dialog">
            <i class="fa-solid fa-circle-plus" aria-hidden="true"></i><span>Publicar</span></button>
          ${link('comunidades.html', 'fa-people-group', 'Comunidades', 'comunidades')}
          ${u ? link('perfil.html', 'fa-user', 'Perfil', 'perfil') : ''}
        </nav>
        ${u ? `<div class="topo-usuario">
          <a href="explorar.html" class="btn-icone busca-movel" aria-label="Buscar"><i class="fa-solid fa-magnifying-glass"></i></a>
          <a href="salvos.html" class="btn-icone ${paginaAtiva === 'salvos' ? 'ativo' : ''}" title="Publicações salvas" aria-label="Publicações salvas"><i class="fa-regular fa-bookmark"></i></a>
          <a href="mensagens.html" id="link-mensagens" class="btn-icone ${paginaAtiva === 'mensagens' ? 'ativo' : ''}" title="Mensagens" aria-label="Mensagens">
            <i class="fa-regular fa-comment-dots"></i><span class="badge" id="badge-msg" hidden>0</span></a>
          <a href="perfil.html" class="topo-avatar" title="${esc(u.nome)} — meu perfil">${avatar(u, 'sm')}</a>
          <button class="btn-icone" id="btn-sair" title="Sair" aria-label="Sair"><i class="fa-solid fa-arrow-right-from-bracket"></i></button>
        </div>` : ''}
      </div>`;
    document.body.prepend(header);
    header.querySelector('#btn-sair')?.addEventListener('click', async () => {
      if (await confirmar('Sair da Arena+?', 'Você precisará entrar novamente para interagir.', 'Sair', false)) window.Sessao.sair();
    });
    header.querySelector('#nav-publicar').addEventListener('click', () => window.Componentes.abrirPublicar());
    if (u) {
      consultarNaoLidas();
      clearInterval(timerMensagens);
      timerMensagens = setInterval(consultarNaoLidas, 20000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) consultarNaoLidas(); });
    }
    if (window.Coach) window.Coach.montar();
  }

  function param(nome) {
    return new URLSearchParams(window.location.search).get(nome);
  }

  window.UI = {
    esc, urlSegura, atualizarBadge, avatar, iniciais, tempoRelativo, dataCompleta, plural, toast, erro,
    comCarregamento, carregando, esqueleto, vazio, falha, confirmar, dialogoTemporario, abrirModal, montarHeader, param, AVATAR_PADRAO,
  };
})();
