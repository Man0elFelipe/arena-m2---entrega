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
  };

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
