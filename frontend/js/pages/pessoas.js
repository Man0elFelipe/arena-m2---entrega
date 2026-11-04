// Pessoas: busca de usuários (/usuarios?busca=) e seguir/deixar de seguir.
(function () {
  const eu = window.Sessao.exigir();
  const { esc, avatar, carregando, vazio, falha, toast, erro, comCarregamento } = window.UI;
  window.UI.montarHeader('pessoas');

  const grade = document.getElementById('grade');
  const input = document.getElementById('busca');

  async function carregar() {
    grade.innerHTML = carregando();
    try {
      const [pag, seguindo] = await Promise.all([
        window.Api.usuarios.listar({ busca: input.value.trim(), tamanho: 50 }),
        window.Api.seguimentos.seguindo(eu.id),
      ]);
      const sigo = new Set(seguindo.map((s) => s.seguidoId));
      const pessoas = pag.conteudo.filter((u) => u.id !== eu.id);
      grade.innerHTML = pessoas.length ? pessoas.map((u) => `
        <article class="card pessoa-card">
          <a href="perfil.html?id=${u.id}">${avatar(u)}</a>
          <h3><a href="perfil.html?id=${u.id}">${esc(u.nome)}</a></h3>
          <small style="color:var(--texto-3)">${esc([u.esportePrincipal, u.cidade].filter(Boolean).join(' · ') || 'Atleta')}</small>
          <p>${esc(u.biografia || '')}</p>
          <button class="btn ${sigo.has(u.id) ? 'btn-secundario' : 'btn-primario'} btn-pequeno" data-usuario="${u.id}" data-segue="${sigo.has(u.id)}" data-carregando="...">
            ${sigo.has(u.id) ? '<i class="fa-solid fa-check"></i> Seguindo' : '<i class="fa-solid fa-user-plus"></i> Seguir'}</button>
        </article>`).join('') : vazio('fa-user-group', 'Ninguém encontrado', 'Tente outro termo de busca.');
    } catch (e) {
      grade.innerHTML = falha(e, 'btn-retry');
      document.getElementById('btn-retry')?.addEventListener('click', carregar);
    }
  }

  grade.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-usuario]');
    if (!btn) return;
    const alvo = Number(btn.dataset.usuario);
    const segue = btn.dataset.segue === 'true';
    await comCarregamento(btn, async () => {
      try {
        if (segue) await window.Api.seguimentos.deixar(eu.id, alvo);
        else await window.Api.seguimentos.seguir(eu.id, alvo);
        toast(segue ? 'Você deixou de seguir.' : 'Seguindo!');
      } catch (e) { erro(e); }
    });
    carregar();
  });

  let timer;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(carregar, 300); });
  document.getElementById('form-busca').addEventListener('submit', (ev) => { ev.preventDefault(); carregar(); });
  carregar();
})();
