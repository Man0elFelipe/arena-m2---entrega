// Mensagens privadas: lista de conversas, busca de usuários, histórico e atualização periódica (sem WebSockets).
(function () {
  const eu = window.Sessao.exigir();
  const { esc, avatar, carregando, vazio, falha, toast, erro } = window.UI;
  window.UI.montarHeader('mensagens');

  const chat = document.getElementById('chat');
  const listaEl = document.getElementById('lista-conversas');
  const mensagensEl = document.getElementById('chat-mensagens');
  const form = document.getElementById('chat-form');
  const texto = document.getElementById('chat-texto');
  const btnEnviar = document.getElementById('chat-enviar');
  const resultados = document.getElementById('resultados-busca');
  const buscaInput = document.getElementById('busca-usuario');

  let conversas = [];
  let ativa = null;       // conversa aberta
  let ultimoId = 0;       // último id de mensagem exibido
  let timerChat = null;
  let timerLista = null;
  let semConexao = false;

  const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  function rotuloDia(iso) {
    const d = new Date(iso);
    const hoje = new Date();
    const ontem = new Date(); ontem.setDate(hoje.getDate() - 1);
    if (d.toDateString() === hoje.toDateString()) return 'Hoje';
    if (d.toDateString() === ontem.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  // ---------- Lista de conversas ----------
  function renderLista() {
    if (!conversas.length) {
      listaEl.innerHTML = `<li class="chat-lista-vazia">${vazio('fa-comment-slash', 'Nenhuma conversa ainda', 'Busque uma pessoa acima ou use “Mensagem” em um perfil.')}</li>`;
      return;
    }
    listaEl.innerHTML = conversas.map((c) => {
      const u = c.ultimaMensagem;
      const previa = u ? (u.remetenteId === eu.id ? 'Você: ' : '') + u.texto : 'Conversa iniciada';
      return `<li><button type="button" class="chat-item ${ativa && ativa.id === c.id ? 'ativo' : ''}" data-conversa="${c.id}">
        ${avatar(c.outro)}
        <span class="chat-item-corpo">
          <span class="chat-item-linha"><strong>${esc(c.outro.nome)}</strong><time>${u ? hora(u.enviadaEm) : ''}</time></span>
          <span class="chat-item-linha"><span class="chat-previa ${c.naoLidas ? 'nao-lida' : ''}">${esc(previa)}</span>
            ${c.naoLidas ? `<span class="badge badge-inline" aria-label="${c.naoLidas} não lidas">${c.naoLidas}</span>` : ''}</span>
        </span></button></li>`;
    }).join('');
  }

  async function carregarConversas(silencioso) {
    if (!silencioso) listaEl.innerHTML = `<li>${carregando('Carregando conversas...')}</li>`;
    try {
      conversas = await window.Api.conversas.listar();
      renderLista();
    } catch (e) {
      if (!silencioso) listaEl.innerHTML = `<li>${falha(e, 'btn-retry')}</li>`;
      document.getElementById('btn-retry')?.addEventListener('click', () => carregarConversas(false));
    }
  }

  listaEl.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-conversa]');
    if (b) abrir(Number(b.dataset.conversa));
  });

  // ---------- Janela da conversa ----------
  function mensagemHtml(m, anterior) {
    const minha = m.remetenteId === eu.id;
    const novoDia = !anterior || new Date(anterior.enviadaEm).toDateString() !== new Date(m.enviadaEm).toDateString();
    return `${novoDia ? `<div class="chat-dia"><span>${esc(rotuloDia(m.enviadaEm))}</span></div>` : ''}
      <div class="bolha ${minha ? 'minha' : 'dela'}" data-id="${m.id}">
        <p>${esc(m.texto)}</p>
        <time datetime="${esc(m.enviadaEm)}">${hora(m.enviadaEm)}${minha ? (m.lida ? ' · lida' : '') : ''}</time>
      </div>`;
  }

  function rolarParaFim() { mensagensEl.scrollTop = mensagensEl.scrollHeight; }

  function pararPolling() { clearInterval(timerChat); timerChat = null; }

  async function abrir(id) {
    const c = conversas.find((x) => x.id === id);
    if (!c) return;
    pararPolling();
    ativa = c;
    ultimoId = 0;
    chat.classList.add('chat-aberto');
    document.getElementById('chat-vazio').hidden = true;
    document.getElementById('chat-conteudo').hidden = false;
    document.getElementById('chat-pessoa').innerHTML = `${avatar(c.outro)}<span><strong>${esc(c.outro.nome)}</strong><small>${esc(c.outro.esportePrincipal || 'Atleta')}</small></span>`;
    document.getElementById('chat-pessoa').href = 'perfil.html?id=' + c.outro.id;
    renderLista();
    mensagensEl.innerHTML = carregando('Carregando mensagens...');
    try {
      const lista = await window.Api.conversas.mensagens(id);
      if (!ativa || ativa.id !== id) return;
      mensagensEl.innerHTML = lista.length
        ? lista.map((m, i) => mensagemHtml(m, lista[i - 1])).join('')
        : `<div class="chat-inicio">Esta é o começo da conversa com <strong>${esc(c.outro.nome)}</strong>. Diga oi! 👋</div>`;
      ultimoId = lista.length ? lista[lista.length - 1].id : 0;
      rolarParaFim();
      c.naoLidas = 0;
      renderLista();
      const r = await window.Api.conversas.naoLidas();
      window.UI.atualizarBadge(r.total);
      texto.focus({ preventScroll: true });
      timerChat = setInterval(atualizarChat, 4000);
    } catch (e) {
      mensagensEl.innerHTML = falha(e, 'btn-retry-chat');
      document.getElementById('btn-retry-chat')?.addEventListener('click', () => abrir(id));
    }
  }

  async function atualizarChat() {
    if (!ativa || document.hidden) return;
    const id = ativa.id;
    try {
      const novas = await window.Api.conversas.mensagens(id, ultimoId);
      if (semConexao) { semConexao = false; document.getElementById('aviso-conexao')?.remove(); }
      if (!ativa || ativa.id !== id || !novas.length) return;
      const noFim = mensagensEl.scrollHeight - mensagensEl.scrollTop - mensagensEl.clientHeight < 80;
      mensagensEl.querySelector('.chat-inicio')?.remove();
      const ultimaBolha = [...mensagensEl.querySelectorAll('.bolha')].pop();
      let anterior = ultimaBolha ? { enviadaEm: ultimaBolha.querySelector('time').getAttribute('datetime') } : null;
      novas.forEach((m) => { mensagensEl.insertAdjacentHTML('beforeend', mensagemHtml(m, anterior)); anterior = m; });
      ultimoId = novas[novas.length - 1].id;
      if (noFim) rolarParaFim();
      carregarConversas(true);
      window.Api.conversas.naoLidas().then((r) => window.UI.atualizarBadge(r.total)).catch(() => {});
    } catch (e) {
      if (!semConexao) {
        semConexao = true;
        mensagensEl.insertAdjacentHTML('afterend', '<p class="chat-aviso" id="aviso-conexao" role="status">Sem conexão com a API. Tentando reconectar...</p>');
      }
    }
  }

  texto.addEventListener('input', () => {
    texto.style.height = 'auto';
    texto.style.height = Math.min(texto.scrollHeight, 120) + 'px';
  });
  texto.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); form.requestSubmit(); }
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const t = texto.value.trim();
    if (!t || !ativa || btnEnviar.disabled) return;
    btnEnviar.disabled = true;
    try {
      const m = await window.Api.conversas.enviar(ativa.id, t);
      mensagensEl.querySelector('.chat-inicio')?.remove();
      const ultimaBolha = [...mensagensEl.querySelectorAll('.bolha')].pop();
      const anterior = ultimaBolha ? { enviadaEm: ultimaBolha.querySelector('time').getAttribute('datetime') } : null;
      mensagensEl.insertAdjacentHTML('beforeend', mensagemHtml(m, anterior));
      ultimoId = Math.max(ultimoId, m.id);
      texto.value = '';
      texto.style.height = 'auto';
      rolarParaFim();
      carregarConversas(true);
    } catch (e) {
      erro(e); // o texto digitado é mantido para tentar de novo
    } finally {
      btnEnviar.disabled = false;
      texto.focus();
    }
  });

  document.getElementById('chat-voltar').addEventListener('click', () => {
    chat.classList.remove('chat-aberto');
    pararPolling();
    ativa = null;
    renderLista();
  });

  // ---------- Buscar pessoas e iniciar conversa ----------
  async function buscarPessoas() {
    const termo = buscaInput.value.trim();
    if (!termo) { resultados.hidden = true; resultados.innerHTML = ''; return; }
    resultados.hidden = false;
    resultados.innerHTML = carregando('Buscando...');
    try {
      const pag = await window.Api.usuarios.listar({ busca: termo, tamanho: 6 });
      const lista = pag.conteudo.filter((u) => u.id !== eu.id);
      resultados.innerHTML = lista.length ? lista.map((u) => `
        <button type="button" class="chat-item" data-novo="${u.id}">${avatar(u)}
          <span class="chat-item-corpo"><strong>${esc(u.nome)}</strong><span class="chat-previa">${esc([u.esportePrincipal, u.cidade].filter(Boolean).join(' · ') || 'Atleta')}</span></span></button>`).join('')
        : '<p class="chat-aviso">Ninguém encontrado.</p>';
    } catch (e) {
      resultados.innerHTML = `<p class="chat-aviso">${esc(e.message)}</p>`;
    }
  }
  let timerBusca;
  buscaInput.addEventListener('input', () => { clearTimeout(timerBusca); timerBusca = setTimeout(buscarPessoas, 300); });
  document.getElementById('form-busca-chat').addEventListener('submit', (ev) => { ev.preventDefault(); buscarPessoas(); });

  async function iniciarCom(usuarioId) {
    try {
      const c = await window.Api.conversas.iniciar(usuarioId);
      await carregarConversas(true);
      if (!conversas.find((x) => x.id === c.id)) conversas.unshift(c);
      buscaInput.value = '';
      resultados.hidden = true;
      await abrir(c.id);
    } catch (e) { erro(e); }
  }
  resultados.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-novo]');
    if (b) iniciarCom(Number(b.dataset.novo));
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) { atualizarChat(); carregarConversas(true); } });
  window.addEventListener('beforeunload', pararPolling);

  (async function iniciar() {
    await carregarConversas(false);
    timerLista = setInterval(() => { if (!document.hidden) carregarConversas(true); }, 10000);
    const com = Number(window.UI.param('com'));
    if (com && com !== eu.id) await iniciarCom(com);
  })();
})();
