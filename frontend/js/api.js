// Cliente centralizado da API Java da Arena+. Toda chamada passa por request(), que
// envia o token Bearer e converte erros em ApiError.
(function () {
  const BASE = (window.ARENA_CONFIG && window.ARENA_CONFIG.API_BASE_URL) || 'http://localhost:8080/api';
  const ORIGEM = BASE.replace(/\/api\/?$/, '');

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

  function cabecalhos(comCorpo) {
    const h = { Accept: 'application/json' };
    if (comCorpo) h['Content-Type'] = 'application/json';
    const token = window.Sessao && window.Sessao.token();
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }

  /** Token inválido/expirado: limpa a sessão e leva ao login (exceto na própria tela de login). */
  function sessaoExpirada(path) {
    if (path.startsWith('/auth/login') || !window.Sessao || !window.Sessao.token()) return;
    window.Sessao.limpar();
    window.location.replace('index.html?expirada=1');
  }

  async function request(method, path, { body, params } = {}) {
    let res;
    try {
      res = await fetch(BASE + path + query(params), {
        method,
        headers: cabecalhos(body !== undefined),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o backend Java está rodando em ' + ORIGEM + '.');
    }
    if (res.status === 204) return null;
    let data = null;
    const texto = await res.text();
    if (texto) {
      try { data = JSON.parse(texto); } catch (e) { data = null; }
    }
    if (res.status === 401) sessaoExpirada(path);
    if (!res.ok) {
      throw new ApiError(res.status, (data && data.mensagem) || 'Erro ' + res.status + ' ao comunicar com a API.', data && data.campos);
    }
    return data;
  }

  const get = (p, params) => request('GET', p, { params });
  const post = (p, body) => request('POST', p, { body });
  const put = (p, body) => request('PUT', p, { body });
  const patch = (p, body) => request('PATCH', p, { body });
  const del = (p, params) => request('DELETE', p, { params });

  /** Upload multipart com progresso (fetch não expõe progresso de envio, então usa XMLHttpRequest). */
  function enviarMidia(arquivo, aoProgredir) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', BASE + '/midias');
      xhr.setRequestHeader('Accept', 'application/json');
      const token = window.Sessao && window.Sessao.token();
      if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && aoProgredir) aoProgredir(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onerror = () => reject(new ApiError(0, 'Falha de conexão durante o envio. Verifique a API e tente novamente.'));
      xhr.ontimeout = () => reject(new ApiError(0, 'O envio demorou demais. Tente novamente.'));
      xhr.onload = () => {
        let data = null;
        try { data = JSON.parse(xhr.responseText); } catch (e) { data = null; }
        if (xhr.status === 401) sessaoExpirada('/midias');
        if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
        reject(new ApiError(xhr.status, (data && data.mensagem) || 'Não foi possível enviar o arquivo (erro ' + xhr.status + ').'));
      };
      const form = new FormData();
      form.append('arquivo', arquivo);
      xhr.send(form);
    });
  }

  window.Api = {
    ApiError,
    origem: ORIGEM,
    auth: {
      login: (email, senha) => post('/auth/login', { email, senha }),
      logout: () => post('/auth/logout'),
      eu: () => get('/auth/eu'),
    },
    usuarios: {
      cadastrar: (dados) => post('/usuarios', dados),
      listar: (params) => get('/usuarios', params),
      parceiros: (params) => get('/usuarios/parceiros', params),
      buscar: (id) => get('/usuarios/' + id),
      perfil: (id) => get('/usuarios/' + id + '/perfil'),
      atualizar: (id, dados) => put('/usuarios/' + id, dados),
      desativar: (id) => del('/usuarios/' + id),
      alterarSenha: (id, senhaAtual, novaSenha) => patch('/usuarios/' + id + '/senha', { senhaAtual, novaSenha }),
    },
    midias: { enviar: enviarMidia },
    publicacoes: {
      criar: (dados) => post('/publicacoes', dados),
      listar: (params) => get('/publicacoes', params),
      feed: (pagina = 0, tamanho = 10) => get('/feed', { pagina, tamanho }),
      buscar: (id) => get('/publicacoes/' + id),
      atualizar: (id, dados) => put('/publicacoes/' + id, dados),
      excluir: (id) => del('/publicacoes/' + id),
    },
    salvos: {
      listar: (pagina = 0, tamanho = 10) => get('/salvos', { pagina, tamanho }),
      salvar: (publicacaoId) => post('/salvos/' + publicacaoId),
      remover: (publicacaoId) => del('/salvos/' + publicacaoId),
    },
    comentarios: {
      criar: (publicacaoId, texto) => post('/comentarios', { publicacaoId, texto }),
      listar: (publicacaoId) => get('/comentarios', { publicacaoId }),
      excluir: (id) => del('/comentarios/' + id),
    },
    curtidas: {
      curtir: (publicacaoId) => post('/curtidas', { publicacaoId }),
      descurtir: (publicacaoId) => del('/curtidas', { publicacaoId }),
    },
    seguimentos: {
      seguir: (seguidoId) => post('/seguimentos', { seguidoId }),
      deixar: (seguidoId) => del('/seguimentos', { seguidoId }),
      seguidores: (usuarioId) => get('/seguimentos/seguidores/' + usuarioId),
      seguindo: (usuarioId) => get('/seguimentos/seguindo/' + usuarioId),
      verificar: (seguidoId) => get('/seguimentos/verificar', { seguidoId }),
    },
    comunidades: {
      criar: (dados) => post('/comunidades', dados),
      listar: (params) => get('/comunidades', params),
      buscar: (id) => get('/comunidades/' + id),
      atualizar: (id, dados) => put('/comunidades/' + id, dados),
      excluir: (id) => del('/comunidades/' + id),
    },
    membros: {
      entrar: (comunidadeId) => post('/membros-comunidade', { comunidadeId }),
      sair: (comunidadeId) => del('/membros-comunidade', { comunidadeId }),
      daComunidade: (comunidadeId) => get('/membros-comunidade', { comunidadeId }),
      doUsuario: (usuarioId) => get('/membros-comunidade', { usuarioId }),
      alterarPapel: (id, papel) => patch('/membros-comunidade/' + id + '/papel', { papel }),
    },
    conversas: {
      listar: () => get('/conversas'),
      iniciar: (usuarioId) => post('/conversas', { usuarioId }),
      mensagens: (id, apos) => get('/conversas/' + id + '/mensagens', { apos }),
      enviar: (id, texto) => post('/conversas/' + id + '/mensagens', { texto }),
      naoLidas: () => get('/conversas/nao-lidas'),
    },
    eventos: {
      criar: (dados) => post('/eventos', dados),
      listar: (params) => get('/eventos', params),
      buscar: (id) => get('/eventos/' + id),
      participar: (id) => post('/eventos/' + id + '/participar'),
      cancelarParticipacao: (id) => del('/eventos/' + id + '/participar'),
      participantes: (id) => get('/eventos/' + id + '/participantes'),
      cancelar: (id) => patch('/eventos/' + id + '/cancelar'),
      encerrar: (id) => patch('/eventos/' + id + '/encerrar'),
    },
    coach: {
      status: () => get('/coach/status'),
      historico: () => get('/coach/mensagens'),
      perguntar: (texto) => post('/coach/mensagens', { texto }),
      limpar: () => del('/coach/mensagens'),
    },
  };
})();
