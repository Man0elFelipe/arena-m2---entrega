// Login e cadastro integrados à API Java (/api/auth/login e /api/usuarios).
(function () {
  if (window.Sessao.usuario()) {
    window.location.replace('feed.html');
    return;
  }

  const alerta = document.getElementById('alerta');
  const formLogin = document.getElementById('form-login');
  const formCadastro = document.getElementById('form-cadastro');
  const tabs = { entrar: document.getElementById('tab-entrar'), cadastro: document.getElementById('tab-cadastro') };

  function mostrarAlerta(msg) {
    alerta.innerHTML = `<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> ${window.UI.esc(msg)}`;
    alerta.hidden = !msg;
  }

  function alternar(qual) {
    const cadastro = qual === 'cadastro';
    tabs.entrar.setAttribute('aria-selected', String(!cadastro));
    tabs.cadastro.setAttribute('aria-selected', String(cadastro));
    formLogin.hidden = cadastro;
    formCadastro.hidden = !cadastro;
    mostrarAlerta('');
    (cadastro ? formCadastro : formLogin).querySelector('input').focus();
  }
  tabs.entrar.addEventListener('click', () => alternar('entrar'));
  tabs.cadastro.addEventListener('click', () => alternar('cadastro'));

  function limparErros(form) {
    form.querySelectorAll('.campo').forEach((c) => c.classList.remove('invalido'));
    form.querySelectorAll('.msg-campo').forEach((m) => { m.textContent = ''; });
  }

  function erroCampo(form, campo, msg) {
    const el = form.querySelector(`[data-campo="${campo}"]`);
    if (el) {
      el.textContent = msg;
      el.closest('.campo').classList.add('invalido');
    }
  }

  function entrarCom(usuario) {
    window.Sessao.salvar(usuario);
    window.location.href = 'feed.html';
  }

  formLogin.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    mostrarAlerta('');
    const email = formLogin.elements.email.value.trim();
    const senha = formLogin.elements.senha.value;
    if (!email || !senha) return mostrarAlerta('Informe email e senha.');
    await window.UI.comCarregamento(formLogin.querySelector('button'), async () => {
      try {
        entrarCom(await window.Api.auth.login(email, senha));
      } catch (e) {
        mostrarAlerta(e.message);
      }
    });
  });

  formCadastro.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    mostrarAlerta('');
    limparErros(formCadastro);
    const f = formCadastro.elements;
    const dados = {
      nome: f.nome.value.trim(),
      email: f.email.value.trim(),
      senha: f.senha.value,
      esportePrincipal: f.esportePrincipal.value.trim() || null,
      cidade: f.cidade.value.trim() || null,
    };
    let ok = true;
    if (!dados.nome) { erroCampo(formCadastro, 'nome', 'Informe seu nome.'); ok = false; }
    if (!/^\S+@\S+\.\S+$/.test(dados.email)) { erroCampo(formCadastro, 'email', 'Informe um email válido.'); ok = false; }
    if (dados.senha.length < 6) { erroCampo(formCadastro, 'senha', 'A senha precisa ter pelo menos 6 caracteres.'); ok = false; }
    if (!ok) return;

    await window.UI.comCarregamento(formCadastro.querySelector('button'), async () => {
      try {
        const usuario = await window.Api.usuarios.cadastrar(dados);
        window.UI.toast('Conta criada! Bem-vindo à Arena+.');
        entrarCom(usuario);
      } catch (e) {
        if (e.campos) Object.entries(e.campos).forEach(([c, m]) => erroCampo(formCadastro, c, m));
        if (e.status === 409) erroCampo(formCadastro, 'email', e.message);
        mostrarAlerta(e.message);
      }
    });
  });
})();
