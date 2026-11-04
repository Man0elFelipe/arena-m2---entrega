// Busca global: pessoas (/usuarios?busca=) e comunidades (/comunidades?busca=) em paralelo.
(function () {
  const eu = window.Sessao.exigir();
  const { esc, avatar, carregando, vazio, falha } = window.UI;
  window.UI.montarHeader('');

  const input = document.getElementById('q');
  const resPessoas = document.getElementById('res-pessoas');
  const resComunidades = document.getElementById('res-comunidades');
  input.value = window.UI.param('q') || '';
  let seq = 0;

  async function buscar() {
    const termo = input.value.trim();
    const minha = ++seq; // ignora respostas de buscas antigas
    history.replaceState(null, '', termo ? '?q=' + encodeURIComponent(termo) : 'busca.html');
    resPessoas.innerHTML = carregando();
    resComunidades.innerHTML = carregando();
    try {
      const [pessoas, comunidades, minhas] = await Promise.all([
        window.Api.usuarios.listar({ busca: termo, tamanho: 12 }),
        window.Api.comunidades.listar({ busca: termo, tamanho: 12 }),
        window.Api.membros.doUsuario(eu.id),
      ]);
      if (minha !== seq) return;
      const participo = new Set(minhas.map((m) => m.comunidadeId));
      const lista = pessoas.conteudo.filter((u) => u.id !== eu.id);
      document.getElementById('n-pessoas').textContent = lista.length;
      document.getElementById('n-comunidades').textContent = comunidades.totalElementos;
      resPessoas.innerHTML = lista.length ? lista.map((u) => `
        <a class="card pessoa-card" href="perfil.html?id=${u.id}">
          ${avatar(u)}
          <h3>${esc(u.nome)}</h3>
          <small style="color:var(--texto-3)">${esc([u.esportePrincipal, u.cidade].filter(Boolean).join(' · ') || 'Atleta')}</small>
          <p>${esc(u.biografia || '')}</p>
        </a>`).join('') : vazio('fa-user-slash', 'Nenhuma pessoa encontrada');
      resComunidades.innerHTML = comunidades.conteudo.length
        ? comunidades.conteudo.map((c) => window.Componentes.comunidadeCardHtml(c)).join('')
        : vazio('fa-people-group', 'Nenhuma comunidade encontrada');
      resComunidades.querySelectorAll('.comunidade-card').forEach((card, i) => {
        if (participo.has(comunidades.conteudo[i].id)) card.querySelector('.chip-esporte').insertAdjacentHTML('afterend', ' <span class="chip">Participando</span>');
      });
    } catch (e) {
      if (minha !== seq) return;
      resPessoas.innerHTML = falha(e, 'btn-retry');
      resComunidades.innerHTML = '';
      document.getElementById('btn-retry')?.addEventListener('click', buscar);
    }
  }

  let timer;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(buscar, 300); });
  document.getElementById('form-busca').addEventListener('submit', (ev) => { ev.preventDefault(); buscar(); });
  input.focus();
  buscar();
})();
