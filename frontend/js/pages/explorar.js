// Explorar: busca global com filtros e paginação — publicações, pessoas, comunidades e parceiros esportivos.
// Todos os resultados vêm da API (sem dados fictícios).
(function () {
  const eu = window.Sessao.exigir();
  const { esc, carregando, vazio, falha, toast, erro, comCarregamento } = window.UI;
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

  function eventoHtml(e) { return `<article class="card evento-card"><div class="evento-topo"><span class="tag">${esc(e.modalidade)}</span><span class="tag">${esc(e.estado)}</span></div><h2>${esc(e.titulo)}</h2><p>${esc(e.descricao)}</p><p><strong>${esc(e.cidade)}</strong> · ${esc(e.local)}</p><p>${esc(new Date(e.dataHora).toLocaleString('pt-BR',{dateStyle:'medium',timeStyle:'short'}))}</p><p>${e.participantes} / ${e.vagasMaximas} vagas · organizado por ${esc(e.organizador)}</p><div class="evento-acoes"><button class="btn btn-secundario btn-pequeno" data-evento-detalhe="${e.id}">Ver participantes</button>${e.estado==='ABERTO'?`<button class="btn ${e.participando?'btn-secundario':'btn-primario'} btn-pequeno" data-evento-participar="${e.id}" data-participa="${e.participando}">${e.participando?'Cancelar inscrição':'Participar'}</button>`:''}${e.organizadorId===eu.id&&e.estado==='ABERTO'?`<button class="btn btn-secundario btn-pequeno" data-evento-encerrar="${e.id}">Encerrar</button><button class="btn btn-secundario btn-pequeno" data-evento-cancelar="${e.id}">Cancelar evento</button>`:''}</div></article>`; }

  function abrirCriacaoEvento() {
    const {dlg,fechar}=window.UI.dialogoTemporario(`<form id="form-evento" class="form-dialogo"><h2>Criar evento</h2><label class="campo"><span>Modalidade *</span><input name="modalidade" required maxlength="80"></label><label class="campo"><span>Título *</span><input name="titulo" required maxlength="120"></label><label class="campo"><span>Descrição *</span><textarea name="descricao" required maxlength="1500"></textarea></label><div class="linha-campos"><label class="campo"><span>Cidade *</span><input name="cidade" required maxlength="100"></label><label class="campo"><span>Local *</span><input name="local" required maxlength="160"></label></div><label class="campo"><span>Data e hora *</span><input name="dataHora" type="datetime-local" required></label><label class="campo"><span>Vagas (2 a 500) *</span><input name="vagasMaximas" type="number" min="2" max="500" value="10" required></label><div class="dialogo-acoes"><button type="button" class="btn btn-secundario" data-cancelar>Cancelar</button><button class="btn btn-primario">Criar evento</button></div></form>`);
    dlg.querySelector('[data-cancelar]').onclick=fechar;
    dlg.querySelector('form').addEventListener('submit',async ev=>{ev.preventDefault();const f=new FormData(ev.currentTarget),dados=Object.fromEntries(f);dados.vagasMaximas=Number(dados.vagasMaximas);try{await window.Api.eventos.criar(dados);fechar();toast('Evento criado.');await buscar(true);}catch(e){erro(e);}});
  }

  async function detalheEvento(id){try{const [e,pessoas]=await Promise.all([window.Api.eventos.buscar(id),window.Api.eventos.participantes(id)]);const lista=pessoas.length?pessoas.map(p=>`<li>${esc(p.nome)} · ${esc(p.esportePrincipal||'Atleta')}</li>`).join(''):'<li>Ninguém inscrito ainda.</li>';const {dlg,fechar}=window.UI.dialogoTemporario(`<section><h2>${esc(e.titulo)}</h2><p>${esc(e.descricao)}</p><p>${esc(e.cidade)} · ${esc(e.local)}</p><h3>Participantes (${pessoas.length}/${e.vagasMaximas})</h3><ul>${lista}</ul><div class="dialogo-acoes"><button class="btn btn-primario" data-fechar>Fechar</button></div></section>`);dlg.querySelector('[data-fechar]').onclick=fechar;}catch(e){erro(e);}}

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
