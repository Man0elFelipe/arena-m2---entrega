// Salvos: coleção privada do usuário autenticado (GET /api/salvos).
(function () {
  const eu = window.Sessao.exigir();
  const { vazio, falha, erro, comCarregamento } = window.UI;
  window.UI.montarHeader('salvos');

  const lista = document.getElementById('lista-posts');
  const btnMais = document.getElementById('btn-mais');
  let pagina = 0;

  const estadoVazio = () => vazio('fa-bookmark', 'Nada salvo ainda', 'Toque no marcador de uma publicação para guardá-la aqui.');

  async function carregar() {
    pagina = 0;
    btnMais.hidden = true;
    lista.innerHTML = window.UI.esqueleto(2);
    try {
      const pag = await window.Api.salvos.listar(0, 10);
      lista.innerHTML = pag.conteudo.length ? pag.conteudo.map((p) => window.Componentes.postHtml(p, eu.id)).join('') : estadoVazio();
      btnMais.hidden = pag.ultima;
    } catch (e) {
      lista.innerHTML = falha(e, 'btn-retry');
      document.getElementById('btn-retry')?.addEventListener('click', carregar);
    }
  }

  btnMais.addEventListener('click', () => comCarregamento(btnMais, async () => {
    try {
      const pag = await window.Api.salvos.listar(pagina + 1, 10);
      pagina += 1;
      lista.insertAdjacentHTML('beforeend', pag.conteudo.map((p) => window.Componentes.postHtml(p, eu.id)).join(''));
      btnMais.hidden = pag.ultima;
    } catch (e) { erro(e); }
  }));

  window.Componentes.ligarPosts(lista, {
    aoDessalvar(card) {
      card.remove();
      if (!lista.querySelector('.post')) lista.innerHTML = estadoVazio();
    },
    aoMudar() { if (!lista.querySelector('.post')) lista.innerHTML = estadoVazio(); },
  });
  carregar();
})();
