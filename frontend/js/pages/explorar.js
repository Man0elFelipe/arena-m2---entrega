// Explorar: busca global com filtros e paginação — publicações, pessoas, comunidades e parceiros esportivos.
// Todos os resultados vêm da API (sem dados fictícios).
(function () {
  const eu = window.Sessao.exigir();
  const { esc, avatar, carregando, vazio, falha, toast, erro, comCarregamento } = window.UI;
  window.UI.montarHeader('explorar');

  const form = document.getElementById('filtros');
  const alvo = document.getElementById('resultados');
  const resumo = document.getElementById('resumo');
  const btnMais = document.getElementById('btn-mais');
  const abasEl = document.getElementById('abas');
  let sigo = new Set();
  let participo = new Set();
  let aba = null;
  let pagina = 0;
  let seq = 0; // descarta respostas de buscas antigas

  const filtros = () => ({ q: form.q.value.trim(), esporte: form.esporte.value.trim(), cidade: form.cidade.value.trim(), nivel: form.nivel.value });

  const ABAS = {
    publicacoes: {
      mostrar: [], classe: 'coluna', tamanho: 10,
      buscar: (f, p) => window.Api.publicacoes.listar({ pagina: p, tamanho: 10 }),
      item: (p) => window.Componentes.postHtml(p, eu.id),
      vazio: () => vazio('fa-newspaper', 'Nenhuma publicação ainda', 'Seja o primeiro a publicar!'),
    },
    pessoas: {
      mostrar: ['q', 'esporte', 'cidade'], classe: 'grade-pessoas', tamanho: 12,
      buscar: (f, p) => window.Api.usuarios.listar({ busca: f.q, esporte: f.esporte, cidade: f.cidade, pagina: p, tamanho: 12 }),
      item: (u) => (u.id === eu.id ? '' : window.Componentes.pessoaCardHtml(u, { sigo: sigo.has(u.id) })),
      vazio: () => vazio('fa-user-slash', 'Nenhuma pessoa encontrada', 'Tente outro nome, esporte ou cidade.'),
    },
    comunidades: {
      mostrar: ['q', 'esporte'], classe: 'grade-comunidades', tamanho: 12,
      buscar: (f, p) => window.Api.comunidades.listar({ busca: f.q, esporte: f.esporte, pagina: p, tamanho: 12 }),
      item: (c) => window.Componentes.comunidadeCardHtml(c, participo.has(c.id)),
      vazio: () => vazio('fa-people-group', 'Nenhuma comunidade encontrada', 'Tente outro termo ou crie a primeira!'),
    },
    parceiros: {
      mostrar: ['esporte', 'cidade', 'nivel'], classe: 'grade-pessoas', tamanho: 12,
      buscar: (f, p) => window.Api.usuarios.parceiros({ modalidade: f.esporte, cidade: f.cidade, nivel: f.nivel, pagina: p, tamanho: 12 }),
      item: (u) => window.Componentes.pessoaCardHtml(u, { sigo: sigo.has(u.id), detalhes: true }),
      vazio: () => vazio('fa-handshake', 'Nenhum parceiro encontrado',
        'Só aparecem atletas que ativaram “Encontrar parceiros” no perfil. Ative a sua opção em Perfil → Editar perfil.'),
    },
    eventos: {
      mostrar: ['q', 'esporte', 'cidade'], classe: 'grade-eventos', tamanho: 10,
      buscar: (f, p) => window.Api.eventos.listar({ busca: f.q, modalidade: f.esporte, cidade: f.cidade, pagina: p, tamanho: 10 }),
      item: eventoHtml,
      vazio: () => vazio('fa-calendar-xmark', 'Nenhum evento encontrado', 'Crie um evento esportivo ou ajuste os filtros.'),
    },
  };

  // ---------- Eventos ----------
  const ESTADOS = { ABERTO: ['Aberto', 'aberto'], ENCERRADO: ['Encerrado', 'encerrado'], CANCELADO: ['Cancelado', 'cancelado'] };
  const ICONES = [
    [/futeb|futsal|society/i, 'fa-futbol'], [/v[oô]lei/i, 'fa-volleyball'], [/basquet/i, 'fa-basketball'],
    [/corrida|maratona|run/i, 'fa-person-running'], [/t[eê]nis|padel|beach/i, 'fa-table-tennis-paddle-ball'],
    [/muscula|academia|funcional|crossfit|treino/i, 'fa-dumbbell'], [/nata[cç]|aqu[aá]tic/i, 'fa-person-swimming'],
    [/cicl|bike|bicicleta/i, 'fa-person-biking'], [/boxe|luta|jiu|muay|karat|judo|capoeira/i, 'fa-hand-fist'],
    [/yoga|pilates|alongamento/i, 'fa-spa'],
  ];
  // Capa sem imagem: degradê da paleta da Arena+ (a cor varia com a modalidade) + ícone do esporte.
  const PALETAS = [['#1e3a8a', '#1d4ed8'], ['#1d4ed8', '#f97316'], ['#334155', '#1d4ed8'], ['#9a3412', '#f97316'], ['#0f766e', '#1d4ed8']];

  function iconeDoEsporte(modalidade) {
    const achado = ICONES.find(([rx]) => rx.test(modalidade || ''));
    return achado ? achado[1] : 'fa-trophy';
  }
  function paletaDoEsporte(modalidade) {
    let h = 0;
    for (const ch of String(modalidade || '').toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return PALETAS[h % PALETAS.length];
  }
  function quando(iso) {
    const d = new Date(iso);
    const opcoes = { weekday: 'short', day: 'numeric', month: 'short' };
    if (d.getFullYear() !== new Date().getFullYear()) opcoes.year = 'numeric';
    return `${d.toLocaleDateString('pt-BR', opcoes)} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function capaEventoHtml(e) {
    const [corA, corB] = paletaDoEsporte(e.modalidade);
    const [rotuloEstado, classeEstado] = ESTADOS[e.estado] || [e.estado, 'encerrado'];
    const imagem = window.UI.urlSegura(e.imagemUrl);
    return `<div class="evento-capa ${imagem ? '' : 'sem-imagem'}" style="--capa-a:${corA};--capa-b:${corB}">
        ${imagem ? `<img src="${esc(imagem)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('sem-imagem');this.remove()">` : ''}
        <i class="fa-solid ${iconeDoEsporte(e.modalidade)} evento-capa-icone" aria-hidden="true"></i>
        <div class="evento-badges">
          <span class="pill pill-esporte">${esc(e.modalidade)}</span>
          <span class="pill pill-estado pill-${classeEstado}">${esc(rotuloEstado)}</span>
        </div>
      </div>`;
  }

  function eventoHtml(e) {
    const lotado = e.participantes >= e.vagasMaximas;
    const pct = Math.min(100, Math.round((e.participantes / Math.max(1, e.vagasMaximas)) * 100));
    const aberto = e.estado === 'ABERTO';
    const organizador = e.organizadorId === eu.id;
    return `<article class="card evento-card" data-evento="${e.id}">
      ${capaEventoHtml(e)}
      <div class="evento-corpo">
        <h3 class="evento-titulo">${esc(e.titulo)}</h3>
        <p class="evento-desc">${esc(e.descricao)}</p>
        <ul class="evento-infos">
          <li><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span><strong>${esc(e.local)}</strong><small>${esc(e.cidade)}</small></span></li>
          <li><i class="fa-regular fa-calendar" aria-hidden="true"></i><span>${esc(quando(e.dataHora))}</span></li>
          <li><i class="fa-solid fa-user-group" aria-hidden="true"></i>
            <span class="evento-vagas"><span class="vagas-texto">${lotado ? '<b>Lotado</b> · ' : ''}${e.participantes}/${e.vagasMaximas} vagas</span>
              <span class="vagas-barra ${lotado ? 'cheia' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="${e.vagasMaximas}" aria-valuenow="${e.participantes}" aria-label="Vagas preenchidas"><span style="width:${pct}%"></span></span></span></li>
          <li><i class="fa-regular fa-user" aria-hidden="true"></i><span>Organizado por <a href="perfil.html?id=${e.organizadorId}">${esc(e.organizador)}</a></span></li>
        </ul>
      </div>
      <footer class="evento-rodape">
        <button class="btn btn-secundario btn-pequeno" data-evento-detalhe="${e.id}"><i class="fa-solid fa-users" aria-hidden="true"></i> Ver participantes</button>
        ${aberto ? `<button class="btn ${e.participando ? 'btn-secundario' : 'btn-primario'} btn-pequeno" data-evento-participar="${e.id}" data-participa="${e.participando}" ${lotado && !e.participando ? 'disabled title="Evento lotado"' : ''}>
          ${e.participando ? '<i class="fa-solid fa-check"></i> Inscrito · cancelar' : '<i class="fa-solid fa-plus"></i> Participar'}</button>` : ''}
        ${organizador && aberto ? `<span class="evento-gestao">
          <button class="btn-link" data-evento-encerrar="${e.id}">Encerrar</button>
          <button class="btn-link perigo" data-evento-cancelar="${e.id}">Cancelar evento</button></span>` : ''}
      </footer>
    </article>`;
  }

  function abrirCriacaoEvento() {
    const { dlg, fechar } = window.UI.dialogoTemporario(`
      <form id="form-evento" class="form-dialogo" novalidate>
        <h3>Criar evento</h3>
        <label class="campo"><span>Modalidade *</span><input name="modalidade" required maxlength="80" placeholder="Ex.: Futebol"></label>
        <label class="campo"><span>Título *</span><input name="titulo" required maxlength="120" placeholder="Ex.: Racha de sábado"></label>
        <label class="campo"><span>Descrição *</span><textarea name="descricao" required maxlength="1500" rows="3"></textarea></label>
        <div class="linha-campos">
          <label class="campo"><span>Cidade *</span><input name="cidade" required maxlength="100"></label>
          <label class="campo"><span>Local *</span><input name="local" required maxlength="160" placeholder="Ex.: Quadra do parque"></label>
        </div>
        <div class="linha-campos">
          <label class="campo"><span>Data e hora *</span><input name="dataHora" type="datetime-local" required></label>
          <label class="campo"><span>Vagas (2 a 500) *</span><input name="vagasMaximas" type="number" min="2" max="500" value="10" required></label>
        </div>
        <div class="campo" id="seletor-capa-evento"></div>
        <div class="dialogo-acoes">
          <button type="button" class="btn btn-secundario" data-cancelar>Cancelar</button>
          <button class="btn btn-primario" data-carregando="Criando">Criar evento</button>
        </div>
      </form>`);
    const seletor = window.Upload.seletorImagem(dlg.querySelector('#seletor-capa-evento'), { rotulo: 'Imagem de capa (opcional)' });
    dlg.querySelector('[data-cancelar]').addEventListener('click', fechar);
    dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); fechar(); });
    dlg.querySelector('form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = ev.currentTarget.elements;
      const dados = {
        modalidade: f.modalidade.value.trim(), titulo: f.titulo.value.trim(), descricao: f.descricao.value.trim(),
        cidade: f.cidade.value.trim(), local: f.local.value.trim(), dataHora: f.dataHora.value, vagasMaximas: Number(f.vagasMaximas.value),
      };
      if (!dados.modalidade || !dados.titulo || !dados.descricao || !dados.cidade || !dados.local || !dados.dataHora) {
        return toast('Preencha todos os campos obrigatórios.', 'erro');
      }
      await comCarregamento(ev.currentTarget.querySelector('.btn-primario'), async () => {
        try {
          dados.imagemUrl = await seletor.resolver(); // arquivo (com progresso) ou link
          await window.Api.eventos.criar(dados);
          fechar();
          toast('Evento criado!');
          await buscar(true);
        } catch (e) { erro(e); }
      });
    });
  }

  async function detalheEvento(id) {
    try {
      const [e, pessoas] = await Promise.all([window.Api.eventos.buscar(id), window.Api.eventos.participantes(id)]);
      const lista = pessoas.length
        ? pessoas.map((p) => `<li><a href="perfil.html?id=${p.id}">${avatar(p, 'sm')}<span><strong>${esc(p.nome)}</strong><small>${esc(p.esportePrincipal || 'Atleta')}</small></span></a></li>`).join('')
        : '<li class="sem-comentarios">Ninguém inscrito ainda.</li>';
      const { dlg, fechar } = window.UI.dialogoTemporario(`<section class="evento-detalhe">
        <h3>${esc(e.titulo)}</h3>
        <p class="evento-desc-completa">${esc(e.descricao)}</p>
        <p class="evento-detalhe-meta"><i class="fa-solid fa-location-dot"></i> ${esc(e.local)}, ${esc(e.cidade)} · <i class="fa-regular fa-calendar"></i> ${esc(quando(e.dataHora))}</p>
        <h4>Participantes (${pessoas.length}/${e.vagasMaximas})</h4>
        <ul class="lista-participantes">${lista}</ul>
        <div class="dialogo-acoes"><button class="btn btn-primario" data-fechar>Fechar</button></div></section>`);
      dlg.querySelector('[data-fechar]').addEventListener('click', fechar);
      dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); fechar(); });
    } catch (e) { erro(e); }
  }

  async function carregarRelacoes() {
    try {
      const [seguindo, minhas] = await Promise.all([window.Api.seguimentos.seguindo(eu.id), window.Api.membros.doUsuario(eu.id)]);
      sigo = new Set(seguindo.map((s) => s.seguidoId));
      participo = new Set(minhas.map((m) => m.comunidadeId));
    } catch (e) { /* os botões só mostram o estado padrão */ }
  }

  function atualizarFiltros() {
    const visiveis = ABAS[aba].mostrar;
    form.querySelectorAll('[data-filtro]').forEach((l) => { l.hidden = !visiveis.includes(l.dataset.filtro); });
    form.hidden = !visiveis.length;
    abasEl.querySelectorAll('[data-aba]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === aba)));
  }

  async function buscar(reiniciar = true) {
    const def = ABAS[aba];
    const minha = ++seq;
    if (reiniciar) {
      pagina = 0;
      btnMais.hidden = true;
      resumo.textContent = '';
      alvo.className = def.classe;
      alvo.innerHTML = aba === 'publicacoes' ? window.UI.esqueleto(2) : carregando('Buscando...');
    }
    try {
      const pag = await def.buscar(filtros(), pagina);
      if (minha !== seq) return;
      const html = pag.conteudo.map(def.item).join('');
      if (reiniciar) {
        alvo.innerHTML = html || def.vazio();
        if (!html) alvo.className = '';
        resumo.textContent = pag.totalElementos ? `${window.UI.plural(pag.totalElementos, 'resultado')}` : '';
      } else {
        alvo.insertAdjacentHTML('beforeend', html);
      }
      btnMais.hidden = pag.ultima;
    } catch (e) {
      if (minha !== seq) return;
      alvo.className = '';
      alvo.innerHTML = falha(e, 'btn-retry');
      document.getElementById('btn-retry')?.addEventListener('click', () => buscar(true));
    }
  }

  async function trocarAba(nova) {
    aba = nova;
    atualizarFiltros();
    const url = new URL(window.location.href);
    url.searchParams.set('aba', aba);
    history.replaceState(null, '', url);
    buscar(true);
  }

  abasEl.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-aba]');
    if (b && b.dataset.aba !== aba) trocarAba(b.dataset.aba);
  });
  document.getElementById('criar-evento')?.addEventListener('click', abrirCriacaoEvento);
  alvo.addEventListener('click', async ev=>{
    const detalhe=ev.target.closest('[data-evento-detalhe]');if(detalhe)return detalheEvento(Number(detalhe.dataset.eventoDetalhe));
    const participar=ev.target.closest('[data-evento-participar]');if(participar){const id=Number(participar.dataset.eventoParticipar),ja=participar.dataset.participa==='true';if(ja&&!(await window.UI.confirmar('Cancelar inscrição?','Você poderá se inscrever novamente enquanto houver vagas.','Cancelar inscrição',false)))return;try{if(ja)await window.Api.eventos.cancelarParticipacao(id);else await window.Api.eventos.participar(id);toast(ja?'Inscrição cancelada.':'Inscrição confirmada.');buscar(true);}catch(e){erro(e);}return;}
    const encerrar=ev.target.closest('[data-evento-encerrar]');if(encerrar){if(await window.UI.confirmar('Encerrar evento?','Novas inscrições serão bloqueadas.','Encerrar'))try{await window.Api.eventos.encerrar(encerrar.dataset.eventoEncerrar);buscar(true);}catch(e){erro(e);}return;}
    const cancelar=ev.target.closest('[data-evento-cancelar]');if(cancelar&&await window.UI.confirmar('Cancelar evento?','O evento ficará marcado como cancelado.','Cancelar evento',true))try{await window.Api.eventos.cancelar(cancelar.dataset.eventoCancelar);buscar(true);}catch(e){erro(e);}
  });

  let timer;
  form.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => buscar(true), 350); });
  form.addEventListener('submit', (ev) => { ev.preventDefault(); buscar(true); });
  btnMais.addEventListener('click', () => comCarregamento(btnMais, async () => { pagina += 1; await buscar(false); }));

  window.Componentes.ligarPosts(alvo);
  window.Componentes.ligarPessoas(alvo, carregarRelacoes);

  alvo.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-comunidade]');
    if (!btn) return;
    const id = Number(btn.dataset.comunidade);
    const entrou = btn.dataset.participa === 'true';
    if (entrou && !(await window.UI.confirmar('Sair da comunidade?', 'Você pode entrar novamente quando quiser.', 'Sair', false))) return;
    await comCarregamento(btn, async () => {
      try {
        if (entrou) await window.Api.membros.sair(id);
        else await window.Api.membros.entrar(id);
        toast(entrou ? 'Você saiu da comunidade.' : 'Bem-vindo à comunidade!');
      } catch (e) { erro(e); }
    });
    await carregarRelacoes();
    buscar(true);
  });

  const params = new URLSearchParams(location.search);
  if (params.get('q')) form.q.value = params.get('q');
  ['esporte', 'cidade'].forEach((c) => { if (params.get(c)) form[c].value = params.get(c); });
  carregarRelacoes().then(() => trocarAba(ABAS[params.get('aba')] ? params.get('aba') : params.get('q') ? 'pessoas' : 'publicacoes'));
})();
