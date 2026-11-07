// Arena Coach: painel de conversa com a IA (resposta gerada no backend; a chave nunca chega ao navegador).
// Desktop: botão flutuante. Mobile (≤ 640 px): atalho "Coach" na barra de navegação.
(function () {
  const { esc, toast, confirmar } = window.UI;

  const SUGESTOES = [
    'Como aquecer antes de correr?',
    'Como equilibrar treino e descanso?',
    'Como voltar a treinar depois de uma pausa?',
  ];
  const LIMITE = 1000;

  let montado = false;
  let aberto = false;
  let enviando = false;
  let configurado = true;   // false quando o servidor não tem chave de IA
  let ultimaPergunta = '';  // usada por "Tentar de novo"
  const el = {};

  const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  function montar() {
    if (montado || !window.Sessao.usuario()) return;
    montado = true;

    const nav = document.querySelector('.nav');
    if (nav) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'nav-link coach-nav';
      b.setAttribute('aria-label', 'Abrir Arena Coach');
      b.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>Coach</span>';
      b.addEventListener('click', abrir);
      nav.appendChild(b);
    }

    el.fab = document.createElement('button');
    el.fab.type = 'button';
    el.fab.className = 'coach-fab';
    el.fab.setAttribute('aria-label', 'Abrir Arena Coach');
    el.fab.innerHTML = '<span class="coach-fab-icone"><img src="img/logo-arena.png" alt="" width="28" height="28"></span><span class="coach-fab-rotulo">Coach</span>';
    el.fab.addEventListener('click', abrir);
    document.body.appendChild(el.fab);

    el.painel = document.createElement('section');
    el.painel.className = 'coach-painel';
    el.painel.hidden = true;
    el.painel.setAttribute('role', 'dialog');
    el.painel.setAttribute('aria-label', 'Arena Coach');
    el.painel.innerHTML = `
      <header class="coach-topo">
        <span class="coach-logo"><img src="img/logo-arena.png" alt="" width="30" height="30"></span>
        <div class="coach-titulo"><strong>Arena Coach</strong><small>Orientação geral de esporte</small></div>
        <button type="button" class="btn-icone" data-acao="limpar" aria-label="Apagar histórico" title="Apagar histórico"><i class="fa-regular fa-trash-can"></i></button>
        <button type="button" class="btn-icone" data-acao="minimizar" aria-label="Minimizar" title="Minimizar"><i class="fa-solid fa-minus"></i></button>
        <button type="button" class="btn-icone" data-acao="fechar" aria-label="Fechar" title="Fechar"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <p class="coach-aviso"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Não substitui médico, nutricionista ou treinador.</p>
      <div class="coach-historico" role="log" aria-live="polite" aria-label="Conversa com o Arena Coach"></div>
      <div class="coach-sugestoes" hidden>${SUGESTOES.map((s) => `<button type="button" class="coach-chip" data-sugestao="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      <form class="coach-form" novalidate>
        <label class="sr-only" for="coach-texto">Sua pergunta ao Arena Coach</label>
        <textarea id="coach-texto" rows="1" maxlength="${LIMITE}" placeholder="Pergunte sobre treino e esporte"></textarea>
        <button class="coach-enviar" type="submit" aria-label="Enviar pergunta"><i class="fa-solid fa-arrow-up"></i></button>
      </form>
      <small class="coach-contador" hidden></small>`;
    document.body.appendChild(el.painel);

    el.historico = el.painel.querySelector('.coach-historico');
    el.sugestoes = el.painel.querySelector('.coach-sugestoes');
    el.form = el.painel.querySelector('.coach-form');
    el.texto = el.painel.querySelector('#coach-texto');
    el.enviar = el.painel.querySelector('.coach-enviar');
    el.contador = el.painel.querySelector('.coach-contador');

    el.painel.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-acao],[data-sugestao],[data-retry],[data-verificar]');
      if (!b) return;
      if (b.dataset.acao === 'fechar') fechar();
      if (b.dataset.acao === 'minimizar') el.painel.classList.toggle('minimizado');
      if (b.dataset.acao === 'limpar') limpar();
      if (b.dataset.sugestao) { el.texto.value = b.dataset.sugestao; el.texto.focus(); ajustarCampo(); }
      if (b.dataset.retry !== undefined) enviar(ultimaPergunta);
      if (b.dataset.verificar !== undefined) carregar();
    });
    el.painel.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') fechar(); });
    el.form.addEventListener('submit', (ev) => { ev.preventDefault(); enviar(el.texto.value); });
    el.texto.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); el.form.requestSubmit(); } // Enter envia; Shift+Enter quebra linha
    });
    el.texto.addEventListener('input', ajustarCampo);
    carregar();
  }

  function ajustarCampo() {
    el.texto.style.height = 'auto';
    el.texto.style.height = Math.min(el.texto.scrollHeight, 110) + 'px';
    const n = el.texto.value.length;
    el.contador.hidden = n < LIMITE * 0.8;
    el.contador.textContent = `${n}/${LIMITE}`;
  }

  function abrir() {
    if (!montado) return;
    aberto = true;
    el.painel.hidden = false;
    el.painel.classList.remove('minimizado');
    void el.painel.offsetWidth; // força o reflow para a transição disparar (requestAnimationFrame não roda em aba oculta)
    el.painel.classList.add('aberto');
    el.fab.hidden = true;
    el.texto.focus({ preventScroll: true });
    rolar();
  }

  function fechar() {
    aberto = false;
    el.painel.classList.remove('aberto');
    el.painel.hidden = true;
    el.fab.hidden = false;
    el.fab.focus({ preventScroll: true });
  }

  const rolar = () => { el.historico.scrollTop = el.historico.scrollHeight; };

  // ---------- render ----------
  function bolha(m) {
    return `<article class="coach-msg ${m.papel === 'PERGUNTA' ? 'pergunta' : 'resposta'}">
      <p>${esc(m.texto)}</p><time datetime="${esc(m.data)}">${hora(m.data)}</time></article>`;
  }

  function renderHistorico(lista) {
    el.historico.innerHTML = lista.length
      ? lista.map(bolha).join('')
      : '<p class="coach-vazio">Olá! 👋 Posso conversar sobre hábitos e orientações gerais de esporte. O que você quer saber?</p>';
    el.sugestoes.hidden = lista.length > 0 || !configurado;
    rolar();
  }

  function mostrarAviso(html, classe = 'coach-erro') {
    el.historico.querySelector('.coach-erro, .coach-digitando')?.remove();
    el.historico.insertAdjacentHTML('beforeend', `<div class="${classe}" role="alert">${html}</div>`);
    rolar();
  }

  function modoNaoConfigurado() {
    configurado = false;
    el.sugestoes.hidden = true;
    el.texto.disabled = true;
    el.enviar.disabled = true;
    el.texto.placeholder = 'Coach indisponível';
    el.historico.querySelector('.coach-vazio')?.remove();
    mostrarAviso(`<strong>Coach não configurado no servidor.</strong>
      <span>Defina a chave da IA no ambiente da API (veja o .env.example) e reinicie-a.</span>
      <button type="button" class="coach-retry" data-verificar>Verificar novamente</button>`);
  }

  function modoConfigurado() {
    configurado = true;
    el.texto.disabled = false;
    el.enviar.disabled = false;
    el.texto.placeholder = 'Pergunte sobre treino e esporte';
  }

  async function carregar() {
    el.historico.innerHTML = '<p class="coach-vazio">Carregando conversa...</p>';
    try {
      const [status, historico] = await Promise.all([window.Api.coach.status(), window.Api.coach.historico()]);
      renderHistorico(historico);
      if (status.disponivel) modoConfigurado();
      else modoNaoConfigurado();
    } catch (e) {
      el.historico.innerHTML = `<div class="coach-erro" role="alert"><strong>${e.status === 0 ? 'Sem conexão com a API.' : 'Não foi possível carregar a conversa.'}</strong>
        <span>${esc(e.message)}</span><button type="button" class="coach-retry" data-verificar>Tentar de novo</button></div>`;
    }
  }

  async function limpar() {
    if (!(await confirmar('Apagar o histórico?', 'Suas conversas com o Arena Coach serão removidas.', 'Apagar'))) return;
    try {
      await window.Api.coach.limpar();
      renderHistorico([]);
      toast('Histórico apagado.');
    } catch (e) { toast(e.message, 'erro'); }
  }

  // ---------- envio ----------
  async function enviar(texto) {
    const pergunta = String(texto || '').trim();
    if (!pergunta || enviando || !configurado) return;
    enviando = true;
    ultimaPergunta = pergunta;
    el.enviar.disabled = true;
    el.historico.querySelector('.coach-vazio')?.remove();
    el.historico.querySelector('.coach-erro')?.remove();
    el.sugestoes.hidden = true;
    if (!el.historico.querySelector('[data-pendente]')) {
      el.historico.insertAdjacentHTML('beforeend', `<article class="coach-msg pergunta" data-pendente><p>${esc(pergunta)}</p></article>`);
    }
    el.historico.insertAdjacentHTML('beforeend', '<div class="coach-digitando" aria-label="Arena Coach está digitando"><span></span><span></span><span></span></div>');
    el.texto.value = '';
    ajustarCampo();
    rolar();
    try {
      const resposta = await window.Api.coach.perguntar(pergunta);
      el.historico.querySelector('.coach-digitando')?.remove();
      el.historico.querySelector('[data-pendente]')?.removeAttribute('data-pendente');
      el.historico.insertAdjacentHTML('beforeend', bolha(resposta));
      ultimaPergunta = '';
      rolar();
    } catch (e) {
      el.historico.querySelector('.coach-digitando')?.remove();
      tratarErro(e);
    } finally {
      enviando = false;
      if (configurado) el.enviar.disabled = false;
      el.texto.focus({ preventScroll: true });
    }
  }

  /** Mensagens específicas para cada causa, com "Tentar de novo" quando faz sentido. */
  function tratarErro(e) {
    const retry = '<button type="button" class="coach-retry" data-retry>Tentar de novo</button>';
    if (e.status === 503) return modoNaoConfigurado();
    if (e.status === 0) return mostrarAviso(`<strong>Sem conexão com a API.</strong><span>Verifique se o backend está rodando e tente de novo.</span>${retry}`);
    if (e.status === 429) return mostrarAviso(`<strong>Muitas perguntas em pouco tempo.</strong><span>${esc(e.message)}</span>${retry}`);
    if (e.status === 502) return mostrarAviso(`<strong>O Coach está indisponível agora.</strong><span>${esc(e.message)}</span>${retry}`);
    if (e.status === 400) { el.historico.querySelector('[data-pendente]')?.remove(); return toast(e.message, 'erro'); }
    return mostrarAviso(`<strong>Algo deu errado.</strong><span>${esc(e.message)}</span>${retry}`);
  }

  window.Coach = { montar, abrir };
})();
