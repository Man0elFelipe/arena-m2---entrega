// Efeitos visuais leves (JS puro): inclinação 3D dos cards, parallax das capas e pílula deslizante da navegação.
// Tudo é desligado com prefers-reduced-motion e só roda em dispositivos com mouse (hover + ponteiro fino).
(function () {
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)');
  const comMouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  const ativo = () => !reduzir.matches && comMouse.matches;

  const ALVOS = '.comunidade-card, .pessoa-card, .mini-perfil, .card-missao, [data-tilt]';
  const INCLINACAO = 7; // graus no máximo

  // ---------- inclinação 3D seguindo o cursor ----------
  let atual = null;
  let ponto = null;

  function aplicar() {
    if (!atual || !ponto) return;
    const r = atual.getBoundingClientRect();
    const nx = ((ponto.x - r.left) / r.width) * 2 - 1;   // -1 .. 1
    const ny = ((ponto.y - r.top) / r.height) * 2 - 1;
    atual.style.setProperty('--ry', (nx * INCLINACAO).toFixed(2) + 'deg');
    atual.style.setProperty('--rx', (-ny * INCLINACAO).toFixed(2) + 'deg');
    atual.style.setProperty('--mx', ((nx + 1) * 50).toFixed(1) + '%');
    atual.style.setProperty('--my', ((ny + 1) * 50).toFixed(1) + '%');
    atual.style.setProperty('--nx', nx.toFixed(3));
    atual.style.setProperty('--ny', ny.toFixed(3));
  }

  function soltar(alvo) {
    if (!alvo) return;
    ['--rx', '--ry', '--mx', '--my', '--nx', '--ny'].forEach((p) => alvo.style.removeProperty(p));
    alvo.classList.remove('tilt-ativo');
  }

  document.addEventListener('pointermove', (ev) => {
    if (!ativo() || ev.pointerType !== 'mouse') return;
    const alvo = ev.target.closest && ev.target.closest(ALVOS);
    if (alvo !== atual) {
      soltar(atual);
      atual = alvo;
      if (atual) atual.classList.add('tilt-ativo');
    }
    if (!atual) return;
    ponto = { x: ev.clientX, y: ev.clientY };
    aplicar(); // direto no evento: uma leitura + escritas de variáveis CSS (barato, e não depende de requestAnimationFrame)
  }, { passive: true });

  // Ao sair do card (ou da janela) a inclinação é desfeita, para o repouso ficar sempre reto
  document.addEventListener('pointerout', (ev) => {
    if (atual && (!ev.relatedTarget || !atual.contains(ev.relatedTarget))) { soltar(atual); atual = null; }
  }, true);
  window.addEventListener('blur', () => { soltar(atual); atual = null; });

  // ---------- parallax no hero do login (profundidade entre camadas) ----------
  const hero = document.querySelector('.auth-hero');
  if (hero) {
    hero.addEventListener('pointermove', (ev) => {
      if (!ativo()) return;
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--px', (((ev.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      hero.style.setProperty('--py', (((ev.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { hero.style.setProperty('--px', 0); hero.style.setProperty('--py', 0); });
  }

  // ---------- parallax de rolagem nas capas (translação sutil, só transform) ----------
  const capas = () => document.querySelectorAll('.banner-comunidade > img, .perfil-capa');
  let rolando = false;
  function parallaxRolagem() {
    rolando = false;
    if (!ativo()) return;
    capas().forEach((c) => {
      const r = c.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      c.style.setProperty('--py-rolagem', Math.max(-30, Math.min(30, r.top * -0.12)).toFixed(1) + 'px');
    });
  }
  window.addEventListener('scroll', () => { if (!rolando) { rolando = true; requestAnimationFrame(parallaxRolagem); } }, { passive: true });

  // ---------- pílula deslizante da navegação (desktop) ----------
  function iniciarNav() {
    const nav = document.querySelector('.nav');
    if (!nav || nav.querySelector('.nav-pilula')) return;
    const pilula = document.createElement('span');
    pilula.className = 'nav-pilula';
    pilula.setAttribute('aria-hidden', 'true');
    nav.prepend(pilula);

    const mover = (alvo) => {
      if (!alvo || window.matchMedia('(max-width: 640px)').matches) { pilula.style.opacity = 0; return; }
      pilula.style.opacity = 1;
      pilula.style.width = alvo.offsetWidth + 'px';
      pilula.style.transform = `translate3d(${alvo.offsetLeft}px, 0, 0)`;
    };
    const ativoLink = () => nav.querySelector('.nav-link.ativo');
    nav.addEventListener('pointerover', (ev) => { const l = ev.target.closest('.nav-link:not(.nav-publicar):not(.coach-nav)'); if (l) mover(l); });
    nav.addEventListener('pointerleave', () => mover(ativoLink()));
    nav.addEventListener('focusin', (ev) => { const l = ev.target.closest('.nav-link:not(.nav-publicar):not(.coach-nav)'); if (l) mover(l); });
    nav.addEventListener('focusout', () => mover(ativoLink()));
    window.addEventListener('resize', () => mover(ativoLink()));
    document.fonts && document.fonts.ready.then(() => mover(ativoLink()));
    mover(ativoLink());
  }

  window.Efeitos = { aoMontarHeader: iniciarNav };
})();
