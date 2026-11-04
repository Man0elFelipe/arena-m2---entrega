// Sessão: guarda o token Bearer emitido pela API e um resumo do usuário (para exibir nome/foto).
// A identidade REAL é sempre validada pelo backend a partir do token.
(function () {
  const CHAVE = 'arenaplus.sessao';

  function ler() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      return s && s.token && s.usuario ? s : null;
    } catch (e) {
      return null;
    }
  }

  function gravar(sessao) {
    try { localStorage.setItem(CHAVE, JSON.stringify(sessao)); } catch (e) { /* modo privado: segue em memória */ }
  }

  function resumo(u) {
    const { id, nome, fotoPerfilUrl, esportePrincipal, tipoPerfil } = u;
    return { id, nome, fotoPerfilUrl, esportePrincipal, tipoPerfil };
  }

  window.Sessao = {
    token: () => (ler() || {}).token || null,
    usuario: () => (ler() || {}).usuario || null,
    id() {
      const u = this.usuario();
      return u ? u.id : null;
    },
    /** Guarda o resultado de POST /auth/login ({token, usuario}). */
    iniciar(login) {
      gravar({ token: login.token, usuario: resumo(login.usuario) });
    },
    /** Atualiza só os dados exibidos do usuário (mantém o token). */
    salvar(usuario) {
      const s = ler();
      if (s) gravar({ token: s.token, usuario: resumo(usuario) });
    },
    limpar() {
      try { localStorage.removeItem(CHAVE); } catch (e) { /* ignore */ }
    },
    /** Encerra a sessão no servidor (revoga o token) e volta ao login. */
    async sair() {
      try { await window.Api.auth.logout(); } catch (e) { /* o token pode já ter expirado */ }
      this.limpar();
      window.location.href = 'index.html';
    },
    /** Redireciona para o login se não houver sessão; devolve o usuário caso contrário. */
    exigir() {
      const u = this.usuario();
      if (!u) {
        window.location.replace('index.html');
        throw new Error('Sem sessão');
      }
      return u;
    },
  };
})();
