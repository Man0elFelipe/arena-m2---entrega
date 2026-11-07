// Upload no navegador: validação com os limites do SERVIDOR (GET /api/midias/limites) e o seletor de imagem
// (arquivo do computador/celular + prévia + link alternativo + progresso) usado em comunidades e eventos.
(function () {
  const { esc, urlSegura } = window.UI;

  // Valores iniciais; são substituídos pelos do servidor assim que carregam (ARENAPLUS_UPLOAD_MAX_*_MB).
  let limites = {
    imagemMaxMb: 10, videoMaxMb: 50,
    tiposImagem: ['image/jpeg', 'image/png', 'image/webp'], tiposVideo: ['video/mp4', 'video/quicktime', 'video/webm'],
    extensoesImagem: ['jpg', 'jpeg', 'png', 'webp'], extensoesVideo: ['mp4', 'm4v', 'mov', 'webm'],
  };
  let promessa = null;

  function carregarLimites() {
    if (!promessa) {
      promessa = window.Api.midias.limites().then((l) => { limites = l; }).catch(() => { /* usa os valores iniciais */ });
    }
    return promessa;
  }

  const extensao = (nome) => (String(nome).split('.').pop() || '').toLowerCase();

  function formatarTamanho(bytes) {
    return bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  /** 'imagem', 'video' ou null. Usa o tipo informado e, se o navegador não informar (comum em .mov), a extensão. */
  function classificar(arquivo) {
    const tipo = (arquivo.type || '').toLowerCase();
    const ext = extensao(arquivo.name);
    if (limites.tiposVideo.includes(tipo) || (!tipo.startsWith('image/') && limites.extensoesVideo.includes(ext))) return 'video';
    if (limites.tiposImagem.includes(tipo) || (!tipo && limites.extensoesImagem.includes(ext))) return 'imagem';
    return null;
  }

  /** Devolve uma mensagem de erro legível ou null. apenas: 'imagem' restringe o seletor a imagens. */
  function validar(arquivo, apenas) {
    const tipo = classificar(arquivo);
    if (!tipo || (apenas === 'imagem' && tipo !== 'imagem')) {
      return apenas === 'imagem'
        ? 'Formato não suportado. Use uma imagem JPG, PNG ou WebP.'
        : 'Formato não suportado. Use imagens JPG, PNG ou WebP, ou vídeos MP4, MOV ou WebM.';
    }
    if (arquivo.size === 0) return 'O arquivo está vazio.';
    const maxMb = tipo === 'video' ? limites.videoMaxMb : limites.imagemMaxMb;
    if (arquivo.size > maxMb * 1024 * 1024) {
      return `Arquivo grande demais (${formatarTamanho(arquivo.size)}). O limite para ${tipo === 'video' ? 'vídeos' : 'imagens'} é ${maxMb} MB.`;
    }
    return null;
  }

  const aceitarImagem = () => 'image/jpeg,image/png,image/webp';
  const aceitarMidia = () => 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.mov,.mp4,.m4v,.webm';

  // ---------- seletor de imagem ----------
  let contador = 0;

  /**
   * Monta o seletor dentro de `container`. Devolve { resolver, limpar, definir }:
   *  - resolver(): envia o arquivo escolhido (se houver) e devolve a URL a salvar (ou null);
   *  - limpar(): zera; definir(url): mostra uma imagem já existente (edição).
   */
  function seletorImagem(container, opcoes = {}) {
    const id = 'seletor-' + (++contador);
    container.classList.add('seletor-imagem');
    container.innerHTML = `
      <span class="seletor-rotulo" id="${id}-rotulo">${esc(opcoes.rotulo || 'Imagem')}</span>
      <input type="file" accept="${aceitarImagem()}" hidden id="${id}-arquivo">
      <div class="seletor-zona" role="button" tabindex="0" aria-labelledby="${id}-rotulo" aria-describedby="${id}-dica">
        <div class="seletor-vazio">
          <i class="fa-regular fa-image" aria-hidden="true"></i>
          <strong>Escolher imagem</strong>
          <small id="${id}-dica">ou arraste aqui · JPG, PNG ou WebP até <span data-limite></span> MB</small>
        </div>
        <div class="seletor-preview" hidden>
          <img alt="Pré-visualização da imagem escolhida">
          <div class="seletor-info"><span class="seletor-nome"></span>
            <button type="button" class="btn-icone btn-mini" data-remover aria-label="Remover imagem"><i class="fa-solid fa-xmark"></i></button></div>
        </div>
      </div>
      <label class="seletor-url"><span>ou cole um link de imagem</span>
        <input type="text" inputmode="url" maxlength="500" placeholder="https://..." autocomplete="off"></label>
      <div class="progresso" hidden role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="progresso-barra"></div><span class="progresso-rotulo">0%</span>
      </div>
      <p class="msg-erro-form" role="alert" hidden></p>`;

    const el = {
      arquivo: container.querySelector('input[type=file]'),
      zona: container.querySelector('.seletor-zona'),
      vazio: container.querySelector('.seletor-vazio'),
      preview: container.querySelector('.seletor-preview'),
      img: container.querySelector('.seletor-preview img'),
      nome: container.querySelector('.seletor-nome'),
      url: container.querySelector('.seletor-url input'),
      progresso: container.querySelector('.progresso'),
      erro: container.querySelector('.msg-erro-form'),
    };
    carregarLimites().then(() => { container.querySelector('[data-limite]').textContent = limites.imagemMaxMb; });
    container.querySelector('[data-limite]').textContent = limites.imagemMaxMb;

    let escolhido = null;    // File ainda não enviado
    let blobUrl = null;
    let existente = null;    // URL já salva (modo edição)
    let ocupado = false;

    const mostrarErro = (m) => { el.erro.textContent = m || ''; el.erro.hidden = !m; };
    const soltarBlob = () => { if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = null; };

    function mostrarPreview(src, rotulo) {
      el.img.src = src;
      el.nome.textContent = rotulo;
      el.preview.hidden = false;
      el.vazio.hidden = true;
    }
    function esconderPreview() {
      el.preview.hidden = true;
      el.vazio.hidden = false;
      el.img.removeAttribute('src');
    }
    el.img.addEventListener('error', () => {
      if (el.img.getAttribute('src')) { mostrarErro('Não foi possível carregar essa imagem. Confira o arquivo ou o link.'); esconderPreview(); }
    });

    function escolher(arquivo) {
      mostrarErro('');
      if (!arquivo) return;
      const problema = validar(arquivo, 'imagem');
      if (problema) { el.arquivo.value = ''; return mostrarErro(problema); }
      soltarBlob();
      escolhido = arquivo;
      existente = null;
      el.url.value = '';
      blobUrl = URL.createObjectURL(arquivo);
      mostrarPreview(blobUrl, `${arquivo.name} · ${formatarTamanho(arquivo.size)}`);
    }

    function limpar() {
      soltarBlob();
      escolhido = null; existente = null;
      el.arquivo.value = ''; el.url.value = '';
      esconderPreview(); mostrarErro('');
      el.progresso.hidden = true;
    }

    el.zona.addEventListener('click', (ev) => { if (ocupado || ev.target.closest('[data-remover]')) return; el.arquivo.click(); });
    el.zona.addEventListener('keydown', (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && !ocupado) { ev.preventDefault(); el.arquivo.click(); } });
    el.arquivo.addEventListener('change', () => escolher(el.arquivo.files[0]));
    container.querySelector('[data-remover]').addEventListener('click', (ev) => { ev.stopPropagation(); if (!ocupado) limpar(); });
    ['dragenter', 'dragover'].forEach((t) => el.zona.addEventListener(t, (ev) => { ev.preventDefault(); el.zona.classList.add('arrastando'); }));
    ['dragleave', 'drop'].forEach((t) => el.zona.addEventListener(t, (ev) => { ev.preventDefault(); el.zona.classList.remove('arrastando'); }));
    el.zona.addEventListener('drop', (ev) => { if (!ocupado) escolher(ev.dataTransfer.files[0]); });

    let timer;
    el.url.addEventListener('input', () => {
      clearTimeout(timer);
      mostrarErro('');
      timer = setTimeout(() => {
        const v = el.url.value.trim();
        if (!v) { if (!escolhido && !existente) esconderPreview(); return; }
        soltarBlob(); escolhido = null; el.arquivo.value = ''; existente = null;
        const seguro = urlSegura(v);
        if (!seguro) return mostrarErro('Link inválido. Use um endereço que comece com http:// ou https://.');
        mostrarPreview(seguro, v);
      }, 400);
    });

    return {
      limpar,
      definir(url) {
        limpar();
        if (!url) return;
        existente = url;
        const seguro = urlSegura(url);
        if (seguro) mostrarPreview(seguro, 'Imagem atual');
        if (/^https?:\/\//i.test(url)) el.url.value = url;
      },
      /** Envia o arquivo (com progresso) e devolve a URL final; lança ApiError em caso de falha. */
      async resolver() {
        mostrarErro('');
        if (escolhido) {
          ocupado = true;
          el.progresso.hidden = false;
          try {
            const m = await window.Api.midias.enviar(escolhido, (pct) => {
              el.progresso.querySelector('.progresso-barra').style.width = pct + '%';
              el.progresso.querySelector('.progresso-rotulo').textContent = pct + '%';
              el.progresso.setAttribute('aria-valuenow', String(pct));
            });
            existente = m.url; escolhido = null;
            return m.url;
          } catch (e) {
            mostrarErro(e.message);
            throw e;
          } finally {
            ocupado = false;
            el.progresso.hidden = true;
          }
        }
        const colada = el.url.value.trim();
        if (colada) return colada;
        return existente; // sem mudança (edição) ou null
      },
    };
  }

  window.Upload = { carregarLimites, validar, classificar, formatarTamanho, aceitarImagem, aceitarMidia, seletorImagem, limites: () => limites };
})();
