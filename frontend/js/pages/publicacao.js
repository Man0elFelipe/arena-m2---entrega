// Publicação individual: é o destino do link de compartilhamento (publicacao.html?id=N).
(function () {
  const eu = window.Sessao.exigir();
  const { vazio, falha, carregando } = window.UI;
  window.UI.montarHeader('');

  const conteudo = document.getElementById('conteudo');
  const id = Number(window.UI.param('id'));

  async function carregar() {
    if (!id) return (conteudo.innerHTML = vazio('fa-circle-question', 'Publicação não informada', 'O link parece incompleto.'));
    conteudo.innerHTML = carregando('Carregando publicação...');
    try {
      const p = await window.Api.publicacoes.buscar(id);
      document.title = 'Arena+ | ' + p.autor.nome;
      conteudo.innerHTML = window.Componentes.postHtml(p, eu.id);
      conteudo.querySelector('[data-acao=comentarios]')?.click(); // mostra os comentários direto
    } catch (e) {
      conteudo.innerHTML = e.status === 404
        ? vazio('fa-ghost', 'Publicação não encontrada', 'Ela pode ter sido excluída pelo autor.')
        : falha(e, 'btn-retry');
      document.getElementById('btn-retry')?.addEventListener('click', carregar);
    }
  }

  window.Componentes.ligarPosts(conteudo, { aoMudar: () => { conteudo.innerHTML = vazio('fa-trash', 'Publicação excluída'); } });
  carregar();
})();
