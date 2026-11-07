// Comunidades: listar/buscar (/comunidades), filtrar por esporte, criar, entrar e sair (/membros-comunidade).
(function () {
  const eu = window.Sessao.exigir();
  const { esc, carregando, vazio, falha, toast, erro, comCarregamento } = window.UI;
  window.UI.montarHeader('comunidades');

  const grade = document.getElementById('grade');
  const filtros = document.getElementById('filtros');
  const inputBusca = document.getElementById('busca');
  let esporte = '';
  let minhas = new Set();
  inputBusca.value = window.UI.param('busca') || '';

  async function carregar() {
    grade.innerHTML = carregando('Carregando comunidades...');
    try {
      const [pag, participacoes] = await Promise.all([
        window.Api.comunidades.listar({ busca: inputBusca.value.trim(), esporte, tamanho: 50 }),
        window.Api.membros.doUsuario(eu.id),
      ]);
      minhas = new Set(participacoes.map((m) => m.comunidadeId));
      grade.innerHTML = pag.conteudo.length
        ? pag.conteudo.map((c) => window.Componentes.comunidadeCardHtml(c, minhas.has(c.id))).join('')
        : vazio('fa-people-group', 'Nenhuma comunidade encontrada', 'Tente outra busca ou crie a primeira!');
      if (!esporte && !inputBusca.value.trim()) montarFiltros(pag.conteudo);
    } catch (e) {
      grade.innerHTML = falha(e, 'btn-retry');
      document.getElementById('btn-retry')?.addEventListener('click', carregar);
    }
  }

  function montarFiltros(lista) {
    const esportes = [...new Set(lista.map((c) => c.esporte))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    filtros.innerHTML = ['', ...esportes].map((e) =>
      `<button class="filtro" data-esporte="${esc(e)}" aria-pressed="${e === esporte}">${e ? esc(e) : 'Todos'}</button>`).join('');
  }

  filtros.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-esporte]');
    if (!b) return;
    esporte = b.dataset.esporte;
    filtros.querySelectorAll('.filtro').forEach((f) => f.setAttribute('aria-pressed', String(f === b)));
    carregar();
  });

  let timer;
  inputBusca.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(carregar, 300); });
  document.getElementById('form-busca').addEventListener('submit', (ev) => { ev.preventDefault(); carregar(); });

  grade.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-comunidade]');
    if (!btn) return;
    const id = Number(btn.dataset.comunidade);
    const participa = btn.dataset.participa === 'true';
    if (participa && !(await window.UI.confirmar('Sair da comunidade?', 'Você pode entrar novamente quando quiser.', 'Sair', false))) return;
    await comCarregamento(btn, async () => {
      try {
        if (participa) await window.Api.membros.sair(id);
        else await window.Api.membros.entrar(id);
        toast(participa ? 'Você saiu da comunidade.' : 'Bem-vindo à comunidade!');
      } catch (e) { erro(e); }
    });
    carregar();
  });

  // ---------- Criar ----------
  const dlg = document.getElementById('dlg-criar');
  const form = document.getElementById('form-criar');
  const seletorCapa = window.Upload.seletorImagem(document.getElementById('seletor-capa'), { rotulo: 'Imagem de capa' });
  document.getElementById('btn-criar').addEventListener('click', () => { form.reset(); seletorCapa.limpar(); dlg.showModal(); });
  document.getElementById('btn-cancelar').addEventListener('click', () => dlg.close());
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = form.elements;
    const dados = { nome: f.nome.value.trim(), esporte: f.esporte.value.trim(), descricao: f.descricao.value.trim() };
    if (!dados.nome || !dados.esporte || !dados.descricao) return toast('Preencha nome, esporte e descrição.', 'erro');
    await comCarregamento(form.querySelector('.btn-primario'), async () => {
      try {
        dados.imagemUrl = await seletorCapa.resolver(); // envia o arquivo (com progresso) ou usa o link colado
        const c = await window.Api.comunidades.criar(dados);
        dlg.close();
        toast('Comunidade criada! Você é o moderador.');
        window.location.href = 'comunidade.html?id=' + c.id;
      } catch (e) { erro(e); }
    });
  });

  carregar();
})();
