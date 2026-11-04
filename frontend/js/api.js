// Cliente centralizado da API Java da Arena+.
// Todas as chamadas passam por request(), que padroniza erros em ApiError.
(function () {
  const BASE = (window.ARENA_CONFIG && window.ARENA_CONFIG.API_BASE_URL) || 'http://localhost:8080/api';

  class ApiError extends Error {
    constructor(status, mensagem, campos) {
      super(mensagem);
      this.status = status;
      this.campos = campos || null;
    }
  }

  function query(params) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    const s = qs.toString();
    return s ? '?' + s : '';
  }

  async function request(method, path, { body, params } = {}) {
    let res;
    try {
      res = await fetch(BASE + path + query(params), {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o backend Java está rodando em ' + BASE.replace(/\/api$/, '') + '.');
    }
    if (res.status === 204) return null;
    let data = null;
    const texto = await res.text();
    if (texto) {
      try { data = JSON.parse(texto); } catch (e) { data = null; }
    }
    if (!res.ok) {
      throw new ApiError(res.status, (data && data.mensagem) || 'Erro ' + res.status + ' ao comunicar com a API.', data && data.campos);
    }
    return data;
  }

  const get = (p, params) => request('GET', p, { params });
  const post = (p, body) => request('POST', p, { body });
  const put = (p, body) => request('PUT', p, { body });
  const del = (p, params) => request('DELETE', p, { params });

  window.Api = {
    ApiError,
    auth: {
      login: (email, senha) => post('/auth/login', { email, senha }),
    },
    usuarios: {
      cadastrar: (dados) => post('/usuarios', dados),
      listar: (params) => get('/usuarios', params),
      buscar: (id) => get('/usuarios/' + id),
      perfil: (id) => get('/usuarios/' + id + '/perfil'),
      feed: (id, pagina = 0, tamanho = 10) => get('/usuarios/' + id + '/feed', { pagina, tamanho }),
      atualizar: (id, dados) => put('/usuarios/' + id, dados),
      desativar: (id) => del('/usuarios/' + id),
      alterarSenha: (id, senhaAtual, novaSenha) => request('PATCH', '/usuarios/' + id + '/senha', { body: { senhaAtual, novaSenha } }),
    },
    publicacoes: {
      criar: (dados) => post('/publicacoes', dados),
      listar: (params) => get('/publicacoes', params),
      buscar: (id, viewerId) => get('/publicacoes/' + id, { viewerId }),
      atualizar: (id, dados) => put('/publicacoes/' + id, dados),
      excluir: (id) => del('/publicacoes/' + id),
    },
    comentarios: {
      criar: (usuarioId, publicacaoId, texto) => post('/comentarios', { usuarioId, publicacaoId, texto }),
      listar: (publicacaoId) => get('/comentarios', { publicacaoId }),
      excluir: (id) => del('/comentarios/' + id),
    },
    curtidas: {
      curtir: (usuarioId, publicacaoId) => post('/curtidas', { usuarioId, publicacaoId }),
      descurtir: (usuarioId, publicacaoId) => del('/curtidas', { usuarioId, publicacaoId }),
    },
    seguimentos: {
      seguir: (seguidorId, seguidoId) => post('/seguimentos', { seguidorId, seguidoId }),
      deixar: (seguidorId, seguidoId) => del('/seguimentos', { seguidorId, seguidoId }),
      seguidores: (usuarioId) => get('/seguimentos/seguidores/' + usuarioId),
      seguindo: (usuarioId) => get('/seguimentos/seguindo/' + usuarioId),
      verificar: (seguidorId, seguidoId) => get('/seguimentos/verificar', { seguidorId, seguidoId }),
    },
    comunidades: {
      criar: (dados) => post('/comunidades', dados),
      listar: (params) => get('/comunidades', params),
      buscar: (id) => get('/comunidades/' + id),
      atualizar: (id, dados) => put('/comunidades/' + id, dados),
      excluir: (id) => del('/comunidades/' + id),
    },
    membros: {
      entrar: (usuarioId, comunidadeId) => post('/membros-comunidade', { usuarioId, comunidadeId }),
      sair: (usuarioId, comunidadeId) => del('/membros-comunidade', { usuarioId, comunidadeId }),
      daComunidade: (comunidadeId) => get('/membros-comunidade', { comunidadeId }),
      doUsuario: (usuarioId) => get('/membros-comunidade', { usuarioId }),
      alterarPapel: (id, papel) => request('PATCH', '/membros-comunidade/' + id + '/papel', { body: { papel } }),
    },
  };
})();
