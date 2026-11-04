// Sessão de demonstração: guarda apenas id/nome do usuário no navegador.
// Não há token: a API Java é uma demonstração acadêmica (ver README).
(function () {
  const CHAVE = 'arenaplus.usuario';

  function ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE));
    } catch (e) {
      return null;
    }
  }

  window.Sessao = {
    usuario: ler,
    id() {
      const u = ler();
      return u ? u.id : null;
    },
    salvar(usuario) {
      const { id, nome, email, fotoPerfilUrl, esportePrincipal, tipoPerfil } = usuario;
      try {
        localStorage.setItem(CHAVE, JSON.stringify({ id, nome, email, fotoPerfilUrl, esportePrincipal, tipoPerfil }));
      } catch (e) { /* navegação privada: segue sem persistir */ }
    },
    sair() {
      try { localStorage.removeItem(CHAVE); } catch (e) { /* ignore */ }
      window.location.href = 'index.html';
    },
    /** Redireciona para o login se não houver usuário; devolve o usuário caso contrário. */
    exigir() {
      const u = ler();
      if (!u) {
        window.location.replace('index.html');
        throw new Error('Sem sessão');
      }
      return u;
    },
  };
})();
