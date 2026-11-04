const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DEFAULT_AVATAR = 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg';
const DEFAULT_COMMUNITY_BANNERS = [
  { terms: ['basquete', 'basket'], image: 'Gemini_Generated_Image_kb5xt0kb5xt0kb5x.png' },
  { terms: ['academia', 'muscul', 'gym', 'treino', 'fitness'], image: 'academia.png' },
  { terms: ['corrida', 'run', 'maratona'], image: 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg' },
  { terms: ['futebol', 'bola'], image: 'images.jpeg' },
  { terms: ['volei', 'vôlei'], image: 'volei.jpg.jpeg' },
  { terms: ['capoeira'], image: 'capoeira-og.jpg.webp' },
  { terms: ['boxe', 'luta'], image: 'boxe.jpeg' },
  { terms: ['ginastica', 'ginástica'], image: 'ginastica.jpeg' },
];

const upload = multer({
  dest: path.join(ROOT, 'upload', '.tmp'),
  limits: { fileSize: 25 * 1024 * 1024 },
});

app.disable('x-powered-by');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  name: process.env.SESSION_NAME || 'PHPSESSID',
  secret: process.env.SESSION_SECRET || 'arena-plus-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
  },
}));

const staticFiles = express.static(ROOT, {
  index: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.php')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
  },
});

app.use((req, res, next) => {
  if (req.path.toLowerCase().endsWith('.php')) return next();
  return staticFiles(req, res, next);
});

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function communityThemeFrom(row = {}) {
  const text = `${row.theme || ''} ${row.categoria || ''} ${row.nome || ''} ${row.descricao || ''}`.toLowerCase();
  const match = DEFAULT_COMMUNITY_BANNERS.find((item) => item.terms.some((term) => text.includes(term)));
  return match ? match.terms[0] : 'esporte';
}

function defaultCommunityBanner(row = {}) {
  const text = `${row.theme || ''} ${row.categoria || ''} ${row.nome || ''} ${row.descricao || ''}`.toLowerCase();
  const match = DEFAULT_COMMUNITY_BANNERS.find((item) => item.terms.some((term) => text.includes(term)));
  return match?.image || 'LOGOARENA+PST.png';
}

function decorateCommunity(row = {}) {
  const theme = row.theme || row.categoria || communityThemeFrom(row);
  const banner = row.banner_url || row.capa_url || row.imagem || defaultCommunityBanner({ ...row, theme });
  return { ...row, theme, banner_url: banner };
}

function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.usuario_id) {
    if (req.path.startsWith('/api_') || req.path.startsWith('/api/') || req.path === '/salvar_perfil.php') {
      return res.json({ erro: 'Não autenticado.' });
    }
    return res.redirect('/login');
  }
  next();
}

async function currentUser(req) {
  if (!req.session.usuario_id) return null;
  const [rows] = await db.execute(
    'SELECT nome, username, bio, foto_perfil, cidade, esporte_favorito, posicao_modalidade FROM usuarios WHERE id = ? LIMIT 1',
    [req.session.usuario_id]
  );
  const user = rows[0];
  if (!user) {
    return {
      nome: req.session.nome || 'Usuário',
      username: req.session.username || '@usuario',
      bio: '',
      foto: '',
    };
  }
  const nome = user.nome || req.session.nome || 'Usuário';
  const username = '@' + String(user.username || req.session.username || 'usuario').replace(/^@/, '');
  req.session.nome = nome;
  req.session.username = username;
  return {
    nome,
    username,
    bio: user.bio || '',
    foto: user.foto_perfil || '',
    cidade: user.cidade || '',
    esporte_favorito: user.esporte_favorito || '',
    posicao_modalidade: user.posicao_modalidade || '',
  };
}

function bodyDataAttrs(user) {
  return `data-nome="${htmlEscape(user.nome)}" data-username="${htmlEscape(user.username)}" data-bio="${htmlEscape(user.bio)}" data-foto="${htmlEscape(user.foto)}" data-cidade="${htmlEscape(user.cidade || '')}" data-esporte="${htmlEscape(user.esporte_favorito || '')}" data-modalidade="${htmlEscape(user.posicao_modalidade || '')}"`;
}

function stripPhpHeader(html) {
  return html.replace(/^<\?php[\s\S]*?\?>\s*/, '');
}

function readTemplate(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

async function renderSimplePhpPage(req, file, title) {
  const user = await currentUser(req);
  const photo = user.foto || DEFAULT_AVATAR;
  let html = stripPhpHeader(readTemplate(file));
  html = html
    .replace(/<title><\?php echo \$titulo; \?><\/title>/g, `<title>${htmlEscape(title)}</title>`)
    .replace(/<body <\?php echo bodyDataAtributos\(\); \?>>/g, `<body ${bodyDataAttrs(user)}>`)
    .replace(/<\?= htmlspecialchars\(\$fotoPerfil\) \?>/g, htmlEscape(photo))
    .replace(/<\?= htmlspecialchars\(\$usuarioAtual\['nome'\]\) \?>/g, htmlEscape(user.nome))
    .replace(/<\?= htmlspecialchars\(\$usuarioAtual\['username'\]\) \?>/g, htmlEscape(user.username));
  return html;
}

function renderLogin(error = '', success = '') {
  let html = stripPhpHeader(readTemplate('login.php'));
  html = html
    .replace(/<\?php if \(\$erro\):\s+\?><p class="msg-erro"><i class="fas fa-exclamation-circle"><\/i> <\?= htmlspecialchars\(\$erro\) \?><\/p><\?php endif; \?>/g, error ? `<p class="msg-erro"><i class="fas fa-exclamation-circle"></i> ${htmlEscape(error)}</p>` : '')
    .replace(/<\?php if \(\$sucesso\):\?><p class="msg-ok"><i class="fas fa-check-circle"><\/i> <\?= htmlspecialchars\(\$sucesso\) \?><\/p><\?php endif; \?>/g, success ? `<p class="msg-ok"><i class="fas fa-check-circle"></i> ${htmlEscape(success)}</p>` : '')
    .replace(/<\?= \(!\$sucesso \? 'active' : ''\) \?>/g, success ? '' : 'active')
    .replace(/<\?= \(\$sucesso  \? 'active' : ''\) \?>/g, success ? 'active' : '')
    .replace(/<\?= \(\$sucesso \? 'active' : ''\) \?>/g, success ? 'active' : '');
  return html;
}

function renderSetup(user, error = '') {
  let html = stripPhpHeader(readTemplate('setup_perfil.php'));
  const photo = user.foto_perfil || DEFAULT_AVATAR;
  html = html
    .replace(/<\?php if \(\$erro\): \?>\s*<p class="msg-erro"><i class="fas fa-exclamation-circle"><\/i> <\?= htmlspecialchars\(\$erro\) \?><\/p>\s*<\?php endif; \?>/g, error ? `<p class="msg-erro"><i class="fas fa-exclamation-circle"></i> ${htmlEscape(error)}</p>` : '')
    .replace(/<\?= \$u\['foto_perfil'\] \? htmlspecialchars\(\$u\['foto_perfil'\]\) : 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526\.jpg\.jpeg' \?>/g, htmlEscape(photo))
    .replace(/<\?= htmlspecialchars\(\$u\['nome'\] \?\? ''\) \?>/g, htmlEscape(user.nome || ''))
    .replace(/<\?= htmlspecialchars\(\$u\['username'\] \?\? ''\) \?>/g, htmlEscape(user.username || ''))
    .replace(/<\?= htmlspecialchars\(\$u\['bio'\] \?\? ''\) \?>/g, htmlEscape(user.bio || ''));
  return html;
}

async function saveUploadedFile(file, filename) {
  if (!file) return null;
  const uploadDir = path.join(ROOT, 'upload');
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const target = path.join(uploadDir, filename);
  await fs.promises.rename(file.path, target);
  return `upload/${filename}`;
}

function extOf(file) {
  return path.extname(file.originalname || '').replace('.', '').toLowerCase();
}

async function insertDefaultUserConfig(userId) {
  await db.execute('INSERT IGNORE INTO configuracoes_usuario (usuario_id) VALUES (?)', [userId]);
}

async function ensureCoreSchema() {
  const [userCols] = await db.query('SHOW COLUMNS FROM usuarios');
  const ucols = new Set(userCols.map((c) => c.Field));
  const userAlter = [];
  if (!ucols.has('cidade')) userAlter.push('ADD COLUMN cidade VARCHAR(100) DEFAULT NULL');
  if (!ucols.has('posicao_modalidade')) userAlter.push('ADD COLUMN posicao_modalidade VARCHAR(100) DEFAULT NULL');
  if (!ucols.has('esporte_favorito')) userAlter.push('ADD COLUMN esporte_favorito VARCHAR(80) DEFAULT NULL');
  if (userAlter.length) await db.query('ALTER TABLE usuarios ' + userAlter.join(', '));

  const adminId = adminUserIds()[0] || 15;
  const adminHash = await bcrypt.hash('12345678', 10);
  await db.execute(
    `INSERT INTO usuarios (id, nome, username, email, senha_hash, bio)
     SELECT ?, 'perfil 2gmja', '2gmja', 'admin@arena.com', ?, 'Administrador da Arena+'
     WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE id = ? OR username = '2gmja' OR email = 'admin@arena.com')
     ON DUPLICATE KEY UPDATE id = id`,
    [adminId, adminHash, adminId]
  );
  await db.query(`
    UPDATE usuarios
    SET email = 'admin@arena.com'
    WHERE (id = ${Number(adminId)} OR username = '2gmja')
      AND NOT EXISTS (
        SELECT 1 FROM (SELECT id FROM usuarios WHERE email = 'admin@arena.com' AND id <> ${Number(adminId)} AND username <> '2gmja' LIMIT 1) AS admin_email_em_uso
      )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS seguidores (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      seguidor_id INT UNSIGNED NOT NULL,
      seguido_id INT UNSIGNED NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unico_seguidor (seguidor_id, seguido_id),
      KEY idx_seguidor (seguidor_id),
      KEY idx_seguido (seguido_id),
      FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (seguido_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS notificacoes (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT UNSIGNED NOT NULL,
      ator_id INT UNSIGNED DEFAULT NULL,
      tipo VARCHAR(40) NOT NULL,
      mensagem VARCHAR(255) NOT NULL,
      link VARCHAR(255) DEFAULT NULL,
      lida TINYINT(1) DEFAULT 0,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (ator_id) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function notifyUser(userId, actorId, type, message, link = null) {
  if (!userId || Number(userId) === Number(actorId)) return;
  await db.execute(
    'INSERT INTO notificacoes (usuario_id, ator_id, tipo, mensagem, link) VALUES (?, ?, ?, ?, ?)',
    [userId, actorId || null, type, message, link]
  );
}

async function removeUploadedMedia(mediaUrl) {
  if (!mediaUrl || /^https?:\/\//i.test(mediaUrl)) return;
  const mediaPath = path.join(ROOT, mediaUrl);
  const uploadRoot = path.join(ROOT, 'upload');
  if (mediaPath.startsWith(uploadRoot) && fs.existsSync(mediaPath)) {
    await fs.promises.unlink(mediaPath);
  }
}

async function deletePostById(postId) {
  const [rows] = await db.execute('SELECT id, midia_url FROM posts WHERE id=? LIMIT 1', [postId]);
  const post = rows[0];
  if (!post) return false;
  await removeUploadedMedia(post.midia_url);
  await db.execute('DELETE FROM posts WHERE id=?', [postId]);
  return true;
}

async function deleteUserById(userId) {
  const [posts] = await db.execute('SELECT id, midia_url FROM posts WHERE usuario_id=?', [userId]);
  for (const post of posts) {
    await removeUploadedMedia(post.midia_url);
  }
  await db.execute('DELETE FROM notificacoes WHERE usuario_id=? OR ator_id=?', [userId, userId]);
  await db.execute('DELETE FROM curtidas WHERE usuario_id=?', [userId]);
  await db.execute('DELETE FROM comentarios WHERE usuario_id=?', [userId]);
  await db.execute('DELETE FROM seguidores WHERE seguidor_id=? OR seguido_id=?', [userId, userId]);
  await db.execute('DELETE FROM membros_comunidade WHERE usuario_id=?', [userId]);
  await db.execute('UPDATE comunidades SET criador_id=NULL WHERE criador_id=?', [userId]);
  await db.execute('DELETE FROM posts WHERE usuario_id=?', [userId]);
  await db.execute('DELETE FROM configuracoes_usuario WHERE usuario_id=?', [userId]).catch(() => {});
  const [result] = await db.execute('DELETE FROM usuarios WHERE id=?', [userId]);
  return result.affectedRows > 0;
}

function adminUserIds() {
  return String(process.env.ADMIN_USER_IDS || '1')
    .split(',')
    .map((id) => Number(id.trim()))
    .filter(Boolean);
}

function requireAdmin(req, res, next) {
  if (!req.session.usuario_id) return res.redirect('/login');
  if (!adminUserIds().includes(Number(req.session.usuario_id))) {
    if (req.path.startsWith('/api/')) return res.status(403).json({ erro: 'Acesso restrito ao admin.' });
    return res.status(403).send('Acesso restrito ao admin.');
  }
  next();
}

function homeForSession(req) {
  if (!req.session.usuario_id) return '/login';
  return adminUserIds().includes(Number(req.session.usuario_id)) ? '/admin' : '/feed';
}

async function ensureCommunitySchema() {
  await ensureCoreSchema();
  const [communityCols] = await db.query('SHOW COLUMNS FROM comunidades');
  const ccols = new Set(communityCols.map((c) => c.Field));
  const communityAlter = [];
  if (!ccols.has('categoria')) communityAlter.push('ADD COLUMN categoria VARCHAR(80) DEFAULT NULL');
  if (!ccols.has('theme')) communityAlter.push('ADD COLUMN theme VARCHAR(100) DEFAULT NULL');
  if (!ccols.has('capa_url')) communityAlter.push('ADD COLUMN capa_url VARCHAR(255) DEFAULT NULL');
  if (!ccols.has('banner_url')) communityAlter.push('ADD COLUMN banner_url VARCHAR(255) DEFAULT NULL');
  if (!ccols.has('avatar_url')) communityAlter.push('ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL');
  if (!ccols.has('criador_id')) communityAlter.push('ADD COLUMN criador_id INT UNSIGNED DEFAULT NULL');
  if (communityAlter.length) await db.query('ALTER TABLE comunidades ' + communityAlter.join(', '));

  const [postCols] = await db.query('SHOW COLUMNS FROM posts');
  const pcols = new Set(postCols.map((c) => c.Field));
  const postAlter = [];
  if (!pcols.has('comunidade_id')) postAlter.push('ADD COLUMN comunidade_id INT UNSIGNED DEFAULT NULL');
  if (!pcols.has('community_id')) postAlter.push('ADD COLUMN community_id INT UNSIGNED DEFAULT NULL');
  if (!pcols.has('fixado')) postAlter.push('ADD COLUMN fixado TINYINT(1) DEFAULT 0');
  if (postAlter.length) await db.query('ALTER TABLE posts ' + postAlter.join(', '));
  await db.query('CREATE INDEX IF NOT EXISTS idx_posts_comunidade ON posts (comunidade_id)').catch(() => {});
  await db.query('CREATE INDEX IF NOT EXISTS idx_posts_community ON posts (community_id)').catch(() => {});

  await db.query(`
    CREATE TABLE IF NOT EXISTS membros_comunidade (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      comunidade_id INT UNSIGNED NOT NULL,
      usuario_id INT UNSIGNED NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unico_membro (comunidade_id, usuario_id),
      KEY idx_membro_usuario (usuario_id),
      KEY idx_membro_comunidade (comunidade_id),
      FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query("UPDATE comunidades SET categoria = LOWER(nome) WHERE categoria IS NULL OR categoria = ''");
  await db.query("UPDATE comunidades SET theme = categoria WHERE (theme IS NULL OR theme = '') AND categoria IS NOT NULL");
  await db.query("UPDATE comunidades SET avatar_url = imagem WHERE (avatar_url IS NULL OR avatar_url = '') AND imagem IS NOT NULL");
  await db.query("UPDATE comunidades SET banner_url = COALESCE(capa_url, imagem) WHERE (banner_url IS NULL OR banner_url = '') AND (capa_url IS NOT NULL OR imagem IS NOT NULL)");
  await db.query('UPDATE posts SET community_id = comunidade_id WHERE community_id IS NULL AND comunidade_id IS NOT NULL').catch(() => {});
  await db.query('UPDATE posts SET comunidade_id = community_id WHERE comunidade_id IS NULL AND community_id IS NOT NULL').catch(() => {});
}

async function isCommunityAdmin(communityId, userId) {
  const [rows] = await db.execute('SELECT criador_id FROM comunidades WHERE id = ? LIMIT 1', [communityId]);
  return Number(rows[0]?.criador_id || 0) === Number(userId);
}

async function renderCommunityPage(req, file, title) {
  const user = await currentUser(req);
  const photo = user.foto || DEFAULT_AVATAR;
  return readTemplate(file)
    .replace(/{{BODY_DATA}}/g, bodyDataAttrs(user))
    .replace(/{{COMMUNITY_ID}}/g, htmlEscape(req.query.id || '0'))
    .replace(/{{USER_PHOTO}}/g, htmlEscape(photo))
    .replace(/{{USER_NAME}}/g, htmlEscape(user.nome))
    .replace(/{{USER_USERNAME}}/g, htmlEscape(user.username))
    .replace(/<title>.*?<\/title>/, `<title>${htmlEscape(title)}</title>`);
}

async function runSearch(query) {
  await ensureCommunitySchema();
  const like = `%${query}%`;
  const [usuarios] = await db.execute(
    `SELECT id, nome, username, foto_perfil, cidade, esporte_favorito, posicao_modalidade
     FROM usuarios
     WHERE nome LIKE ? OR username LIKE ? OR bio LIKE ? OR cidade LIKE ? OR esporte_favorito LIKE ? OR posicao_modalidade LIKE ?
     ORDER BY nome
     LIMIT 12`,
    [like, like, like, like, like, like]
  );
  const [posts] = await db.execute(
    `SELECT p.id, p.texto, p.criado_em, u.nome, u.username, u.foto_perfil
     FROM posts p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.texto LIKE ?
     ORDER BY p.criado_em DESC
     LIMIT 12`,
    [like]
  );
  const [comunidades] = await db.execute(
    `SELECT id, nome, descricao, imagem, avatar_url, capa_url, banner_url, categoria, theme
     FROM comunidades
     WHERE nome LIKE ? OR descricao LIKE ? OR categoria LIKE ? OR theme LIKE ?
     ORDER BY nome
     LIMIT 12`,
    [like, like, like, like]
  );
  return { usuarios, posts, comunidades: comunidades.map(decorateCommunity) };
}

app.get('/', (req, res) => {
  res.redirect(homeForSession(req));
});

app.get('/index.php', (req, res) => {
  res.redirect(homeForSession(req));
});

app.get(['/login', '/login.php'], noCache, (req, res) => {
  if (req.session.usuario_id) return res.redirect(homeForSession(req));
  res.send(renderLogin());
});

app.post(['/login', '/login.php'], noCache, upload.none(), async (req, res, next) => {
  try {
    if (req.session.usuario_id) return res.redirect(homeForSession(req));
    const action = req.body.acao || '';

    if (action === 'cadastro') {
      const nome = String(req.body.nome || '').trim();
      const username = String(req.body.username || '').trim().replace(/^@/, '');
      const email = String(req.body.email || '').trim();
      const senha = String(req.body.senha || '').trim();
      const bio = String(req.body.bio || '').trim();
      const esporte = String(req.body.esporte_favorito || '').trim();
      const objetivo = String(req.body.objetivo || '').trim();
      const nivel = String(req.body.nivel || '').trim();

      if (!nome || !username || !email || !senha) {
        return res.send(renderLogin('Preencha todos os campos obrigatórios.'));
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.send(renderLogin('E-mail inválido.'));
      }
      if (senha.length < 6) {
        return res.send(renderLogin('A senha deve ter pelo menos 6 caracteres.'));
      }

      const [exists] = await db.execute('SELECT id FROM usuarios WHERE email = ? OR username = ? LIMIT 1', [email, username]);
      if (exists.length) {
        return res.send(renderLogin('E-mail ou nome de usuário já cadastrado.'));
      }

      const hash = await bcrypt.hash(senha, 10);
      const [result] = await db.execute(
        'INSERT INTO usuarios (nome, username, email, senha_hash, bio, esporte_favorito, objetivo, nivel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nome, username, email, hash, bio, esporte || null, objetivo || null, nivel || null]
      );
      await insertDefaultUserConfig(result.insertId);
      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.usuario_id = result.insertId;
        req.session.nome = nome;
        req.session.username = '@' + username;
        res.redirect('/setup-profile');
      });
      return;
    }

    if (action === 'login') {
      const email = String(req.body.email || '').trim();
      const senha = String(req.body.senha || '').trim();
      if (!email || !senha) return res.send(renderLogin('Preencha e-mail e senha.'));

      const [rows] = await db.execute('SELECT id, nome, username, senha_hash FROM usuarios WHERE email = ? LIMIT 1', [email]);
      const user = rows[0];
      if (!user || !(await bcrypt.compare(senha, user.senha_hash))) {
        return res.send(renderLogin('E-mail ou senha incorretos.'));
      }

      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.usuario_id = user.id;
        req.session.nome = user.nome;
        req.session.username = '@' + user.username;
        res.redirect(homeForSession(req));
      });
      return;
    }

    res.send(renderLogin());
  } catch (err) {
    next(err);
  }
});

app.get(['/logout', '/logout.php'], noCache, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(process.env.SESSION_NAME || 'PHPSESSID');
    res.redirect('/login');
  });
});

app.get(['/setup-profile', '/setup_perfil.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT nome, username, bio, foto_perfil FROM usuarios WHERE id=? LIMIT 1', [req.session.usuario_id]);
    res.send(renderSetup(rows[0] || {}));
  } catch (err) {
    next(err);
  }
});

app.post(['/setup-profile', '/setup_perfil.php'], noCache, requireAuth, upload.single('foto'), async (req, res, next) => {
  try {
    const uid = req.session.usuario_id;
    const nome = String(req.body.nome || '').trim();
    const username = String(req.body.username || '').trim().replace(/^@/, '');
    const bio = String(req.body.bio || '').trim();
    const [rows] = await db.execute('SELECT nome, username, bio, foto_perfil FROM usuarios WHERE id=? LIMIT 1', [uid]);
    const current = rows[0] || {};

    if (!nome || !username) return res.send(renderSetup(current, 'Nome e usuário são obrigatórios.'));

    const [dupes] = await db.execute('SELECT id FROM usuarios WHERE username=? AND id!=? LIMIT 1', [username, uid]);
    if (dupes.length) return res.send(renderSetup(current, 'Nome de usuário já em uso. Escolha outro.'));

    let photo = current.foto_perfil || null;
    if (req.file) {
      const ext = extOf(req.file);
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        return res.send(renderSetup(current, 'Formato de foto inválido.'));
      }
      photo = await saveUploadedFile(req.file, `foto_${uid}.${ext}`);
    }

    await db.execute('UPDATE usuarios SET nome=?, username=?, bio=?, foto_perfil=? WHERE id=?', [nome, username, bio, photo, uid]);
    req.session.nome = nome;
    req.session.username = '@' + username;
    res.redirect('/feed');
  } catch (err) {
    next(err);
  }
});

async function renderFeedRoute(req, res, next) {
  try {
    res.send(await renderSimplePhpPage(req, 'arena+.php', 'Arena+ | Sua rede social esportiva'));
  } catch (err) {
    next(err);
  }
}

app.get('/feed', noCache, requireAuth, renderFeedRoute);
app.get(/^\/arena\+\.php$/, noCache, requireAuth, renderFeedRoute);

app.get(['/profile', '/perfil.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    res.send(await renderSimplePhpPage(req, 'perfil.php', 'Perfil | Arena+'));
  } catch (err) {
    next(err);
  }
});

app.get('/Perfil.php', noCache, requireAuth, async (req, res) => {
  res.redirect('/profile');
});

app.get(['/comunidades', '/comunidades.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    res.send(await renderSimplePhpPage(req, 'comunidades.php', 'Comunidades | Arena+'));
  } catch (err) {
    next(err);
  }
});

app.get(['/communities/discover', '/comunidades_descobrir.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    await ensureCommunitySchema();
    res.send(await renderCommunityPage(req, 'comunidades_descobrir.php', 'Descobrir Comunidades | Arena+'));
  } catch (err) {
    next(err);
  }
});

app.get(['/communities/:id', '/comunidade/:id', '/comunidade.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    await ensureCommunitySchema();
    if (req.params.id) req.query.id = req.params.id;
    res.send(await renderCommunityPage(req, 'comunidade.php', 'Comunidade | Arena+'));
  } catch (err) {
    next(err);
  }
});

app.get(['/communities/:id/members', '/comunidade_membros.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    await ensureCommunitySchema();
    if (req.params.id) req.query.id = req.params.id;
    res.send(await renderCommunityPage(req, 'comunidade_membros.php', 'Membros da Comunidade | Arena+'));
  } catch (err) {
    next(err);
  }
});

app.get(['/communities/:id/admin', '/comunidade_admin.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    await ensureCommunitySchema();
    if (req.params.id) req.query.id = req.params.id;
    res.send(await renderCommunityPage(req, 'comunidade_admin.php', 'Admin Comunidade | Arena+'));
  } catch (err) {
    next(err);
  }
});

app.get(['/coach', '/chat.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    res.send(await renderSimplePhpPage(req, 'chat.php', 'Chat | Arena+'));
  } catch (err) {
    next(err);
  }
});

app.get(['/settings', '/config.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    res.send(await renderSimplePhpPage(req, 'config.php', 'Configurações | Arena+'));
  } catch (err) {
    next(err);
  }
});

app.get('/search', noCache, requireAuth, async (req, res, next) => {
  try {
    const user = await currentUser(req);
    const q = String(req.query.q || '').trim();
    const results = q ? await runSearch(q) : { usuarios: [], posts: [], comunidades: [] };
    const photo = user.foto || DEFAULT_AVATAR;
    res.send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Busca | Arena+</title>
  <link rel="stylesheet" href="style.css?v=31">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <link rel="icon" href="LOGOARENA+PST.png" type="image/x-icon">
</head>
<body ${bodyDataAttrs(user)}>
<header><div class="header-content"><div class="logo"><img src="LOGOARENA+PST.png" alt="Arena+"></div><div class="search-bar"><i class="fas fa-search"></i><input id="global-search" value="${htmlEscape(q)}" placeholder="Buscar na Arena+"></div><nav class="main-nav"><ul><li><a href="/feed"><i class="fas fa-home"></i> Início</a></li><li><a href="/comunidades"><i class="fas fa-users"></i> Comunidades</a></li><li><a href="/coach"><i class="fas fa-comments"></i> Coach</a></li></ul></nav><div class="user-profile"><a href="/profile"><img src="${htmlEscape(photo)}" class="js-profile-photo"></a></div></div></header>
<div class="main-container"><aside class="left-sidebar"><div class="profile-info"><img src="${htmlEscape(photo)}" class="js-profile-photo"><h4>${htmlEscape(user.nome)}</h4><p>${htmlEscape(user.username)}</p></div></aside><main class="feed-container">
<div class="communities-header"><h2>Resultados da busca</h2><p>${q ? htmlEscape(q) : 'Digite algo para pesquisar usuários, posts e comunidades.'}</p></div>
<section class="sidebar-section"><h4>Usuários</h4>${results.usuarios.map((u) => `<div class="follow-card"><img src="${htmlEscape(u.foto_perfil || DEFAULT_AVATAR)}" alt="${htmlEscape(u.nome)}"><div><h5>${htmlEscape(u.nome)}</h5><p>@${htmlEscape(u.username)}</p></div></div>`).join('') || '<p>Nenhum usuário encontrado.</p>'}</section>
<section class="sidebar-section"><h4>Comunidades</h4>${results.comunidades.map((c) => `<div class="community-card"><img src="${htmlEscape(c.banner_url || c.avatar_url || c.imagem || 'LOGOARENA+PST.png')}" alt="${htmlEscape(c.nome)}"><div><h5>${htmlEscape(c.nome)}</h5><p>${htmlEscape(c.theme || c.categoria || 'esporte')}</p></div><a class="follow-btn" href="/comunidade/${c.id}">Abrir</a></div>`).join('') || '<p>Nenhuma comunidade encontrada.</p>'}</section>
<section>${results.posts.map((p) => `<article class="post"><div class="post-header"><img src="${htmlEscape(p.foto_perfil || DEFAULT_AVATAR)}"><div class="post-info"><h4>${htmlEscape(p.nome)}</h4><span>@${htmlEscape(p.username)}</span></div></div><div class="post-content"><p>${htmlEscape(p.texto)}</p></div></article>`).join('') || '<div class="post"><div class="post-content"><p>Nenhum post encontrado.</p></div></div>'}</section>
</main></div><script src="index.js?v=31"></script></body></html>`);
  } catch (err) {
    next(err);
  }
});

app.get('/admin', noCache, requireAdmin, async (req, res, next) => {
  try {
    const user = await currentUser(req);
    res.send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin | Arena+</title>
  <link rel="stylesheet" href="style.css?v=31">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <link rel="icon" href="LOGOARENA+PST.png" type="image/x-icon">
</head>
<body ${bodyDataAttrs(user)} data-page="admin">
<header><div class="header-content"><div class="logo"><img src="LOGOARENA+PST.png" alt="Arena+"></div><div class="search-bar"><i class="fas fa-search"></i><input id="admin-search" placeholder="Buscar usuários ou posts"></div><nav class="main-nav"><ul><li><a href="/feed"><i class="fas fa-home"></i> Início</a></li><li><a href="/admin" class="active"><i class="fas fa-shield-alt"></i> Admin</a></li><li><a href="/logout"><i class="fas fa-sign-out-alt"></i> Sair</a></li></ul></nav></div></header>
<div class="main-container"><aside class="left-sidebar"><nav class="sidebar-nav"><ul><li><a href="#users"><i class="fas fa-users"></i> Perfis</a></li><li><a href="#posts"><i class="fas fa-flag"></i> Publicações</a></li><li><a id="alterar-tema"><i class="fas fa-moon"></i> Alterar Tema</a></li></ul></nav></aside><main class="feed-container"><section class="communities-header"><h2>Painel admin</h2><p>Controle perfis, publicações e conteúdo impróprio.</p></section><section id="admin-users" class="sidebar-section"><h4>Perfis</h4></section><section id="admin-posts" class="sidebar-section"><h4>Publicações recentes</h4></section></main></div>
<script src="index.js?v=31"></script><script src="admin_app.js?v=1"></script></body></html>`);
  } catch (err) {
    next(err);
  }
});

app.get(['/api/usuario', '/api_usuario.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    const user = await currentUser(req);
    res.json({
      ok: true,
      usuario: {
        nome: user.nome,
        username: user.username,
        bio: user.bio || '',
        foto: user.foto || '',
        cidade: user.cidade || '',
        esporte_favorito: user.esporte_favorito || '',
        posicao_modalidade: user.posicao_modalidade || '',
      },
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/search', noCache, requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ ok: true, usuarios: [], posts: [], comunidades: [] });
    const data = await runSearch(q);
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});

app.get('/api/notifications', noCache, requireAuth, async (req, res, next) => {
  try {
    await ensureCoreSchema();
    const [rows] = await db.execute(
      `SELECT n.*, u.nome AS ator_nome, u.username AS ator_username, u.foto_perfil AS ator_foto
       FROM notificacoes n
       LEFT JOIN usuarios u ON u.id = n.ator_id
       WHERE n.usuario_id = ?
       ORDER BY n.criado_em DESC
       LIMIT 20`,
      [req.session.usuario_id]
    );
    res.json({ ok: true, notificacoes: rows });
  } catch (err) {
    next(err);
  }
});

app.get('/api/usuario/communities', noCache, requireAuth, async (req, res, next) => {
  try {
    await ensureCommunitySchema();
    const [rows] = await db.execute(
      `SELECT c.id, c.nome, c.descricao, c.categoria, c.theme, c.imagem, c.avatar_url, c.capa_url, c.banner_url, mc.criado_em
       FROM membros_comunidade mc
       JOIN comunidades c ON c.id = mc.comunidade_id
       WHERE mc.usuario_id = ?
       ORDER BY mc.criado_em DESC`,
      [req.session.usuario_id]
    );
    res.json({ ok: true, comunidades: rows.map(decorateCommunity) });
  } catch (err) {
    next(err);
  }
});

app.get(['/api/admin/users', '/admin/users'], noCache, requireAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const like = `%${q}%`;
    const [users] = await db.execute(
      `SELECT u.id, u.nome, u.username, u.email, u.bio, u.cidade, u.esporte_favorito, u.posicao_modalidade, u.foto_perfil, u.criado_em,
              (SELECT COUNT(*) FROM posts WHERE usuario_id = u.id) AS total_posts,
              (SELECT COUNT(*) FROM seguidores WHERE seguido_id = u.id) AS total_seguidores,
              (SELECT COUNT(*) FROM membros_comunidade WHERE usuario_id = u.id) AS total_comunidades
       FROM usuarios u
       WHERE ? = '' OR u.nome LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.bio LIKE ?
       ORDER BY u.criado_em DESC
       LIMIT 80`,
      [q, like, like, like, like]
    );
    res.json({
      ok: true,
      usuarios: users.map((user) => ({
        ...user,
        e_admin_logado: Number(user.id) === Number(req.session.usuario_id),
      })),
    });
  } catch (err) {
    next(err);
  }
});

app.get(['/api/admin/posts', '/admin/posts'], noCache, requireAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const like = `%${q}%`;
    const [posts] = await db.execute(
      `SELECT p.id, p.texto, p.midia_url, p.midia_tipo, p.criado_em, p.comunidade_id, p.fixado,
              u.id AS usuario_id, u.nome, u.username, u.foto_perfil,
              c.nome AS comunidade_nome,
              COUNT(DISTINCT curt.id) AS total_curtidas,
              COUNT(DISTINCT cm.id) AS total_comentarios
       FROM posts p
       JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN comunidades c ON c.id = COALESCE(p.comunidade_id, p.community_id)
       LEFT JOIN curtidas curt ON curt.post_id = p.id
       LEFT JOIN comentarios cm ON cm.post_id = p.id
       WHERE ? = '' OR p.texto LIKE ? OR u.nome LIKE ? OR u.username LIKE ? OR c.nome LIKE ?
       GROUP BY p.id, p.texto, p.midia_url, p.midia_tipo, p.criado_em, p.comunidade_id, p.community_id, p.fixado, c.nome, u.id, u.nome, u.username, u.foto_perfil
       ORDER BY p.criado_em DESC
       LIMIT 120`,
      [q, like, like, like, like]
    );
    res.json({ ok: true, posts });
  } catch (err) {
    next(err);
  }
});

app.delete(['/api/admin/users/:id', '/admin/users/:id'], noCache, requireAdmin, async (req, res, next) => {
  try {
    const userId = Number(req.params.id || 0);
    if (!userId) return res.json({ erro: 'Usuário inválido.' });
    if (userId === Number(req.session.usuario_id)) return res.status(400).json({ erro: 'O admin não pode excluir a própria conta logada.' });
    const deleted = await deleteUserById(userId);
    if (!deleted) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/users/delete', noCache, requireAdmin, upload.none(), async (req, res, next) => {
  try {
    const userId = Number(req.body.usuario_id || req.body.user_id || 0);
    if (!userId) return res.json({ erro: 'Usuário inválido.' });
    if (userId === Number(req.session.usuario_id)) return res.status(400).json({ erro: 'O admin não pode excluir a própria conta logada.' });
    const deleted = await deleteUserById(userId);
    if (!deleted) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.delete(['/api/admin/posts/:id', '/admin/posts/:id'], noCache, requireAdmin, async (req, res, next) => {
  try {
    const postId = Number(req.params.id || 0);
    if (!postId) return res.json({ erro: 'Post inválido.' });
    const deleted = await deletePostById(postId);
    if (!deleted) return res.status(404).json({ erro: 'Post não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/posts/delete', noCache, requireAdmin, upload.none(), async (req, res, next) => {
  try {
    const postId = Number(req.body.post_id || 0);
    if (!postId) return res.json({ erro: 'Post inválido.' });
    const deleted = await deletePostById(postId);
    if (!deleted) return res.status(404).json({ erro: 'Post não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.post(['/api/usuario', '/salvar_perfil.php'], noCache, requireAuth, upload.single('foto'), async (req, res, next) => {
  try {
    const uid = req.session.usuario_id;
    const nome = String(req.body.nome || '').trim();
    const username = String(req.body.username || '').trim().replace(/^@/, '');
    const bio = String(req.body.bio || '').trim();
    const cidade = String(req.body.cidade || '').trim();
    const esporteFavorito = String(req.body.esporte_favorito || '').trim();
    const posicaoModalidade = String(req.body.posicao_modalidade || '').trim();
    if (!nome || !username) return res.json({ erro: 'Nome e usuário são obrigatórios.' });

    const [dupes] = await db.execute('SELECT id FROM usuarios WHERE username = ? AND id != ? LIMIT 1', [username, uid]);
    if (dupes.length) return res.json({ erro: 'Nome de usuário já em uso.' });

    let photo = null;
    if (req.file) {
      const ext = extOf(req.file);
      if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
        return res.json({ erro: 'Formato de foto inválido.' });
      }
      photo = await saveUploadedFile(req.file, `foto_${uid}.${ext}`);
    }

    if (photo) {
      await db.execute('UPDATE usuarios SET nome=?, username=?, bio=?, cidade=?, esporte_favorito=?, posicao_modalidade=?, foto_perfil=? WHERE id=?', [nome, username, bio, cidade || null, esporteFavorito || null, posicaoModalidade || null, photo, uid]);
    } else {
      await db.execute('UPDATE usuarios SET nome=?, username=?, bio=?, cidade=?, esporte_favorito=?, posicao_modalidade=? WHERE id=?', [nome, username, bio, cidade || null, esporteFavorito || null, posicaoModalidade || null, uid]);
      const [rows] = await db.execute('SELECT foto_perfil FROM usuarios WHERE id=? LIMIT 1', [uid]);
      photo = rows[0]?.foto_perfil || null;
    }

    req.session.nome = nome;
    req.session.username = '@' + username;
    res.json({ ok: true, nome, username: '@' + username, bio, cidade, esporte_favorito: esporteFavorito, posicao_modalidade: posicaoModalidade, foto: photo });
  } catch (err) {
    next(err);
  }
});

app.all(['/api/posts', '/api_posts.php'], noCache, requireAuth, upload.single('midia'), async (req, res, next) => {
  try {
    const uid = req.session.usuario_id;
    const action = req.query.acao || req.body.acao || '';

    if (action === 'feed') {
      await ensureCommunitySchema();
      const page = Math.max(1, Number(req.query.pagina || 1));
      const limit = 10;
      const offset = (page - 1) * limit;
      const [posts] = await db.query(
        `SELECT p.id, p.texto, p.midia_url, p.midia_tipo, p.criado_em,
                COALESCE(p.comunidade_id, p.community_id) AS comunidade_id, p.fixado, co.nome AS comunidade_nome,
                u.nome, u.username, u.foto_perfil,
                COUNT(DISTINCT c.id) AS total_curtidas,
                MAX(CASE WHEN c.usuario_id = ? THEN 1 ELSE 0 END) AS curtido_por_mim,
                COUNT(DISTINCT cm.id) AS total_comentarios
         FROM posts p
         JOIN usuarios u ON u.id = p.usuario_id
         LEFT JOIN comunidades co ON co.id = COALESCE(p.comunidade_id, p.community_id)
         LEFT JOIN curtidas c ON c.post_id = p.id
         LEFT JOIN comentarios cm ON cm.post_id = p.id
         GROUP BY p.id, p.texto, p.midia_url, p.midia_tipo, p.criado_em, p.comunidade_id, p.community_id, p.fixado, co.nome, u.id, u.nome, u.username, u.foto_perfil
         ORDER BY p.criado_em DESC
         LIMIT ? OFFSET ?`,
        [uid, limit, offset]
      );
      return res.json({ ok: true, posts });
    }

    if (action === 'perfil' || action === 'meus') {
      await ensureCommunitySchema();
      const targetId = Number(req.query.usuario_id || uid);
      const [posts] = await db.query(
        `SELECT p.id, p.texto, p.midia_url, p.midia_tipo, p.criado_em,
                COALESCE(p.comunidade_id, p.community_id) AS comunidade_id, p.fixado, co.nome AS comunidade_nome,
                u.nome, u.username, u.foto_perfil,
                COUNT(DISTINCT c.id) AS total_curtidas,
                MAX(CASE WHEN c.usuario_id = ? THEN 1 ELSE 0 END) AS curtido_por_mim,
                COUNT(DISTINCT cm.id) AS total_comentarios
         FROM posts p
         JOIN usuarios u ON u.id = p.usuario_id
         LEFT JOIN comunidades co ON co.id = COALESCE(p.comunidade_id, p.community_id)
         LEFT JOIN curtidas c ON c.post_id = p.id
         LEFT JOIN comentarios cm ON cm.post_id = p.id
         WHERE p.usuario_id = ?
         GROUP BY p.id, p.texto, p.midia_url, p.midia_tipo, p.criado_em, p.comunidade_id, p.community_id, p.fixado, co.nome, u.id, u.nome, u.username, u.foto_perfil
         ORDER BY p.criado_em DESC`,
        [uid, targetId]
      );
      return res.json({ ok: true, posts });
    }

    if (action === 'criar') {
      await ensureCommunitySchema();
      const text = String(req.body.texto || '').trim();
      const communityId = Number(req.body.comunidade_id || 0) || null;
      const legacyCommunityId = Number(req.body.community_id || 0) || null;
      const finalCommunityId = communityId || legacyCommunityId;
      let mediaUrl = null;
      let mediaType = null;
      if (!text && !req.file) return res.json({ erro: 'Post vazio.' });

      if (finalCommunityId) {
        const [member] = await db.execute('SELECT id FROM membros_comunidade WHERE comunidade_id=? AND usuario_id=? LIMIT 1', [finalCommunityId, uid]);
        if (!member.length) return res.json({ erro: 'Entre na comunidade antes de publicar nela.' });
      }

      if (req.file) {
        const ext = extOf(req.file);
        if (!['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'webm'].includes(ext)) {
          return res.json({ erro: 'Formato de mídia inválido.' });
        }
        const filename = `post_${uid}_${Math.floor(Date.now() / 1000)}.${ext}`;
        mediaUrl = await saveUploadedFile(req.file, filename);
        mediaType = ['mp4', 'mov', 'webm'].includes(ext) ? 'video' : 'image';
      }

      const [result] = await db.execute(
        'INSERT INTO posts (usuario_id, texto, midia_url, midia_tipo, comunidade_id, community_id) VALUES (?, ?, ?, ?, ?, ?)',
        [uid, text || null, mediaUrl, mediaType, finalCommunityId, finalCommunityId]
      );
      const [rows] = await db.execute(
        `SELECT p.*, co.nome AS comunidade_nome, u.nome, u.username, u.foto_perfil
         FROM posts p
         JOIN usuarios u ON u.id=p.usuario_id
         LEFT JOIN comunidades co ON co.id=p.comunidade_id
         WHERE p.id=?`,
        [result.insertId]
      );
      const post = rows[0];
      post.total_curtidas = 0;
      post.curtido_por_mim = 0;
      post.total_comentarios = 0;
      return res.json({ ok: true, post });
    }

    if (action === 'curtir') {
      const postId = Number(req.body.post_id || 0);
      if (!postId) return res.json({ erro: 'Post inválido.' });

      const [likes] = await db.execute('SELECT id FROM curtidas WHERE post_id=? AND usuario_id=? LIMIT 1', [postId, uid]);
      let done;
      if (likes.length) {
        await db.execute('DELETE FROM curtidas WHERE post_id=? AND usuario_id=?', [postId, uid]);
        done = 'descurtido';
      } else {
        await db.execute('INSERT INTO curtidas (post_id, usuario_id) VALUES (?, ?)', [postId, uid]);
        done = 'curtido';
        const [ownerRows] = await db.execute('SELECT usuario_id FROM posts WHERE id=? LIMIT 1', [postId]);
        await notifyUser(ownerRows[0]?.usuario_id, uid, 'curtida', `${req.session.nome || 'Alguém'} curtiu seu post.`, `/feed`);
      }
      const [totalRows] = await db.execute('SELECT COUNT(*) AS total FROM curtidas WHERE post_id=?', [postId]);
      return res.json({ ok: true, acao: done, total: Number(totalRows[0].total) });
    }

    if (action === 'comentar') {
      const postId = Number(req.body.post_id || 0);
      const text = String(req.body.texto || '').trim();
      if (!postId || !text) return res.json({ erro: 'Dados incompletos.' });

      await db.execute('INSERT INTO comentarios (post_id, usuario_id, texto) VALUES (?, ?, ?)', [postId, uid, text]);
      const [ownerRows] = await db.execute('SELECT usuario_id FROM posts WHERE id=? LIMIT 1', [postId]);
      await notifyUser(ownerRows[0]?.usuario_id, uid, 'comentario', `${req.session.nome || 'Alguém'} comentou no seu post.`, `/feed`);
      return res.json({
        ok: true,
        comentario: {
          texto: htmlEscape(text),
          nome: req.session.nome,
          username: req.session.username,
          criado_em: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      });
    }

    if (action === 'comentarios') {
      const postId = Number(req.query.post_id || 0);
      if (!postId) return res.json({ erro: 'Post inválido.' });
      const [comments] = await db.execute(
        `SELECT cm.texto, cm.criado_em, u.nome, u.username, u.foto_perfil
         FROM comentarios cm
         JOIN usuarios u ON u.id = cm.usuario_id
         WHERE cm.post_id = ?
         ORDER BY cm.criado_em ASC`,
        [postId]
      );
      return res.json({ ok: true, comentarios: comments });
    }

    if (action === 'deletar') {
      const postId = Number(req.body.post_id || 0);
      if (!postId) return res.json({ erro: 'Post inválido.' });
      const [rows] = await db.execute('SELECT id, midia_url FROM posts WHERE id=? AND usuario_id=? LIMIT 1', [postId, uid]);
      const post = rows[0];
      if (!post) return res.json({ erro: 'Sem permissão.' });
      if (post.midia_url) {
        const mediaPath = path.join(ROOT, post.midia_url);
        if (mediaPath.startsWith(path.join(ROOT, 'upload')) && fs.existsSync(mediaPath)) {
          await fs.promises.unlink(mediaPath);
        }
      }
      await db.execute('DELETE FROM posts WHERE id=?', [postId]);
      return res.json({ ok: true });
    }

    res.json({ erro: 'Ação desconhecida.' });
  } catch (err) {
    next(err);
  }
});

app.all(['/api/follow', '/api_seguir.php'], noCache, requireAuth, upload.none(), async (req, res, next) => {
  try {
    const uid = req.session.usuario_id;
    const action = req.query.acao || req.body.acao || '';

    if (action === 'toggle') {
      const targetId = Number(req.body.usuario_id || 0);
      if (!targetId || targetId === uid) return res.json({ erro: 'Usuário inválido.' });
      const [rows] = await db.execute('SELECT id FROM seguidores WHERE seguidor_id=? AND seguido_id=? LIMIT 1', [uid, targetId]);
      let done;
      if (rows.length) {
        await db.execute('DELETE FROM seguidores WHERE seguidor_id=? AND seguido_id=?', [uid, targetId]);
        done = 'deixou_de_seguir';
      } else {
        await db.execute('INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)', [uid, targetId]);
        done = 'seguindo';
        await notifyUser(targetId, uid, 'seguidor', `${req.session.nome || 'Alguém'} começou a seguir você.`, `/profile`);
      }
      const [totals] = await db.execute('SELECT COUNT(*) AS total FROM seguidores WHERE seguido_id=?', [targetId]);
      return res.json({ ok: true, acao: done, total_seguidores: Number(totals[0].total) });
    }

    if (action === 'contagens') {
      const targetId = Number(req.query.usuario_id || uid);
      const [[seguidores], [seguindo], [posts], [check]] = await Promise.all([
        db.execute('SELECT COUNT(*) AS total FROM seguidores WHERE seguido_id=?', [targetId]),
        db.execute('SELECT COUNT(*) AS total FROM seguidores WHERE seguidor_id=?', [targetId]),
        db.execute('SELECT COUNT(*) AS total FROM posts WHERE usuario_id=?', [targetId]),
        targetId !== uid
          ? db.execute('SELECT id FROM seguidores WHERE seguidor_id=? AND seguido_id=? LIMIT 1', [uid, targetId])
          : Promise.resolve([[]]),
      ]);
      return res.json({
        ok: true,
        seguidores: Number(seguidores[0].total),
        seguindo: Number(seguindo[0].total),
        posts: Number(posts[0].total),
        eu_sigo: check.length > 0,
        e_meu_perfil: targetId === uid,
      });
    }

    if (action === 'sugestoes') {
      const [suggestions] = await db.execute(
        `SELECT u.id, u.nome, u.username, u.foto_perfil,
                (SELECT COUNT(*) FROM seguidores WHERE seguido_id = u.id) AS total_seguidores
         FROM usuarios u
         WHERE u.id != ?
           AND u.id NOT IN (SELECT seguido_id FROM seguidores WHERE seguidor_id = ?)
         ORDER BY total_seguidores DESC
         LIMIT 5`,
        [uid, uid]
      );
      if (suggestions.length < 3) {
        const [fallbackUsers] = await db.execute(
          `SELECT u.id, u.nome, u.username, u.foto_perfil,
                  (SELECT COUNT(*) FROM seguidores WHERE seguido_id = u.id) AS total_seguidores
           FROM usuarios u
           WHERE u.id != ?
           ORDER BY total_seguidores DESC, u.criado_em DESC
           LIMIT 5`,
          [uid]
        );
        const merged = [...suggestions];
        fallbackUsers.forEach((u) => {
          if (!merged.some((m) => Number(m.id) === Number(u.id))) merged.push(u);
        });
        return res.json({ ok: true, sugestoes: merged.slice(0, 5) });
      }
      return res.json({ ok: true, sugestoes: suggestions });
    }

    res.json({ erro: 'Ação desconhecida.' });
  } catch (err) {
    next(err);
  }
});

app.all(['/api/communities', '/api_comunidades.php'], noCache, requireAuth, upload.none(), async (req, res, next) => {
  try {
    await ensureCommunitySchema();
    const uid = req.session.usuario_id;
    const action = req.body.acao || req.query.acao || '';

    if (action === 'listar') {
      const q = String(req.query.q || '').trim();
      const category = String(req.query.categoria || '').trim();
      const where = [];
      const params = [];
      if (q) {
        where.push('(c.nome LIKE ? OR c.descricao LIKE ? OR c.categoria LIKE ? OR c.theme LIKE ?)');
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }
      if (category) {
        where.push('(c.categoria LIKE ? OR c.theme LIKE ?)');
        params.push(`%${category}%`, `%${category}%`);
      }
      const [communities] = await db.execute(
        `SELECT c.*, COUNT(mc.id) AS total_membros,
                MAX(CASE WHEN mc.usuario_id = ? THEN 1 ELSE 0 END) AS participa
         FROM comunidades c
         LEFT JOIN membros_comunidade mc ON mc.comunidade_id = c.id
         ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
         GROUP BY c.id
         ORDER BY total_membros DESC, c.nome ASC`,
        [uid, ...params]
      );
      return res.json({ ok: true, comunidades: communities.map(decorateCommunity) });
    }

    if (action === 'criar') {
      const name = String(req.body.nome || '').trim();
      if (!name) return res.json({ erro: 'Nome da comunidade é obrigatório.' });
      const description = String(req.body.descricao || '').trim() || 'Comunidade criada pela Arena+.';
      const category = String(req.body.categoria || '').trim() || null;
      const theme = String(req.body.theme || '').trim() || category || name.toLowerCase();
      const [exists] = await db.execute('SELECT id FROM comunidades WHERE nome=? LIMIT 1', [name]);
      if (exists.length) return res.json({ erro: 'Já existe uma comunidade com esse nome.' });
      const [created] = await db.execute(
        'INSERT INTO comunidades (nome, descricao, categoria, theme, avatar_url, capa_url, banner_url, criador_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          name,
          description,
          category,
          theme,
          String(req.body.avatar_url || '').trim() || null,
          String(req.body.capa_url || '').trim() || null,
          String(req.body.banner_url || req.body.capa_url || '').trim() || null,
          uid,
        ]
      );
      await db.execute('INSERT IGNORE INTO membros_comunidade (comunidade_id, usuario_id) VALUES (?, ?)', [created.insertId, uid]);
      return res.json({ ok: true, id: created.insertId });
    }

    if (action === 'detalhe') {
      const id = Number(req.query.id || req.body.id || 0);
      if (!id) return res.json({ erro: 'Comunidade inválida.' });
      const [rows] = await db.execute(
        `SELECT c.*, COUNT(mc.id) AS total_membros,
                MAX(CASE WHEN mc.usuario_id = ? THEN 1 ELSE 0 END) AS participa
         FROM comunidades c
         LEFT JOIN membros_comunidade mc ON mc.comunidade_id = c.id
         WHERE c.id = ?
         GROUP BY c.id
         LIMIT 1`,
        [uid, id]
      );
      if (!rows.length) return res.json({ erro: 'Comunidade não encontrada.' });
      return res.json({
        ok: true,
        comunidade: decorateCommunity(rows[0]),
        participa: Number(rows[0].participa) === 1,
        admin: Number(rows[0].criador_id || 0) === uid,
      });
    }

    if (action === 'feed') {
      const id = Number(req.query.id || req.body.id || 0);
      if (!id) return res.json({ erro: 'Comunidade inválida.' });
      const sql =
        `SELECT p.id, p.texto, p.midia_url, p.midia_tipo, p.criado_em, p.fixado,
                co.nome AS comunidade_nome,
                u.nome, u.username, u.foto_perfil,
                COUNT(DISTINCT cm.id) AS total_comentarios
         FROM posts p
         JOIN usuarios u ON u.id = p.usuario_id
         LEFT JOIN comunidades co ON co.id = COALESCE(p.comunidade_id, p.community_id)
         LEFT JOIN comentarios cm ON cm.post_id = p.id
         WHERE COALESCE(p.comunidade_id, p.community_id) = ?
         GROUP BY p.id, p.texto, p.midia_url, p.midia_tipo, p.criado_em, p.comunidade_id, p.community_id, p.fixado, co.nome, u.id, u.nome, u.username, u.foto_perfil
         ORDER BY p.fixado DESC, p.criado_em DESC`;
      const [posts] = await db.execute(sql, [id]);
      return res.json({
        ok: true,
        fixados: posts.filter((p) => Number(p.fixado) === 1),
        posts: posts.filter((p) => Number(p.fixado) !== 1),
      });
    }

    if (action === 'membros') {
      const id = Number(req.query.id || req.body.id || 0);
      if (!id) return res.json({ erro: 'Comunidade inválida.' });
      const [members] = await db.execute(
        `SELECT u.id, u.nome, u.username, u.foto_perfil, mc.criado_em
         FROM membros_comunidade mc
         JOIN usuarios u ON u.id = mc.usuario_id
         WHERE mc.comunidade_id = ?
         ORDER BY mc.criado_em ASC`,
        [id]
      );
      return res.json({ ok: true, membros: members });
    }

    if (action === 'entrar') {
      const name = String(req.body.nome || '').trim();
      let id = Number(req.body.id || 0);
      if (!id && !name) return res.json({ erro: 'Comunidade inválida.' });

      const [rows] = id
        ? await db.execute('SELECT id FROM comunidades WHERE id = ? LIMIT 1', [id])
        : await db.execute('SELECT id FROM comunidades WHERE nome = ? LIMIT 1', [name]);
      if (id && !rows.length) return res.json({ erro: 'Comunidade não encontrada.' });
      id = rows[0]?.id || id;
      if (!id) {
        const [created] = await db.execute('INSERT INTO comunidades (nome, descricao, categoria, theme, criador_id) VALUES (?, ?, ?, ?, ?)', [name, 'Comunidade criada pela Arena+.', name.toLowerCase(), name.toLowerCase(), uid]);
        id = created.insertId;
      }

      await db.execute('INSERT IGNORE INTO membros_comunidade (comunidade_id, usuario_id) VALUES (?, ?)', [id, uid]);
      const [total] = await db.execute('SELECT COUNT(*) AS total FROM membros_comunidade WHERE comunidade_id = ?', [id]);
      return res.json({ ok: true, membros: Number(total[0].total) });
    }

    if (action === 'sair') {
      const id = Number(req.body.id || 0);
      if (!id) return res.json({ erro: 'Comunidade inválida.' });
      if (await isCommunityAdmin(id, uid)) return res.json({ erro: 'O criador não pode sair antes de transferir a administração.' });
      await db.execute('DELETE FROM membros_comunidade WHERE comunidade_id=? AND usuario_id=?', [id, uid]);
      const [total] = await db.execute('SELECT COUNT(*) AS total FROM membros_comunidade WHERE comunidade_id = ?', [id]);
      return res.json({ ok: true, membros: Number(total[0].total) });
    }

    if (action === 'atualizar_info') {
      const id = Number(req.body.id || 0);
      if (!id || !(await isCommunityAdmin(id, uid))) return res.json({ erro: 'Sem permissão.' });
      const nome = String(req.body.nome || '').trim();
      if (!nome) return res.json({ erro: 'Nome é obrigatório.' });
      await db.execute(
        'UPDATE comunidades SET nome=?, descricao=?, categoria=?, theme=?, avatar_url=?, capa_url=?, banner_url=? WHERE id=?',
        [
          nome,
          String(req.body.descricao || '').trim(),
          String(req.body.categoria || '').trim() || null,
          String(req.body.theme || req.body.categoria || '').trim() || null,
          String(req.body.avatar_url || '').trim() || null,
          String(req.body.capa_url || '').trim() || null,
          String(req.body.banner_url || req.body.capa_url || '').trim() || null,
          id,
        ]
      );
      return res.json({ ok: true });
    }

    if (action === 'remover_membro') {
      const id = Number(req.body.id || 0);
      const userId = Number(req.body.usuario_id || 0);
      if (!id || !userId || !(await isCommunityAdmin(id, uid))) return res.json({ erro: 'Sem permissão.' });
      if (userId === uid) return res.json({ erro: 'Você não pode remover o criador.' });
      await db.execute('DELETE FROM membros_comunidade WHERE comunidade_id=? AND usuario_id=?', [id, userId]);
      return res.json({ ok: true });
    }

    if (action === 'fixar_post') {
      const id = Number(req.body.id || 0);
      const postId = Number(req.body.post_id || 0);
      const fixed = Number(req.body.fixado || 0) === 1 ? 1 : 0;
      if (!id || !postId || !(await isCommunityAdmin(id, uid))) return res.json({ erro: 'Sem permissão.' });
      await db.execute('UPDATE posts SET fixado=? WHERE id=? AND COALESCE(comunidade_id, community_id)=?', [fixed, postId, id]);
      return res.json({ ok: true });
    }

    if (action === 'desafio') {
      const challengeId = Number(req.body.desafio_id || 0);
      if (!challengeId) return res.json({ erro: 'Desafio inválido.' });
      await db.execute('INSERT IGNORE INTO usuarios_desafios (desafio_id, usuario_id) VALUES (?, ?)', [challengeId, uid]);
      return res.json({ ok: true });
    }

    res.json({ erro: 'Ação desconhecida.' });
  } catch (err) {
    next(err);
  }
});

async function coachContext(question) {
  const terms = String(question || '').toLowerCase().split(/\s+/).filter((t) => t.length >= 4).slice(0, 5);
  let like = `%${terms.join('%')}%`;
  if (like === '%%') like = `%${question || ''}%`;
  const [rows] = await db.execute(
    `SELECT titulo, categoria, conteudo
     FROM arena_coach_base
     WHERE titulo LIKE ? OR conteudo LIKE ? OR tags LIKE ?
     ORDER BY id DESC
     LIMIT 5`,
    [like, like, like]
  );
  const finalRows = rows.length ? rows : (await db.query('SELECT titulo, categoria, conteudo FROM arena_coach_base ORDER BY id LIMIT 5'))[0];
  return finalRows.map((r) => `[${r.categoria}] ${r.titulo}: ${r.conteudo}`).join('\n');
}

async function coachArenaUserContext(uid) {
  const parts = [];
  const [[profileRows], [countsRows], [followersRows], [followingRows]] = await Promise.all([
    db.execute('SELECT id, nome, username, bio, cidade, esporte_favorito, posicao_modalidade, objetivo, nivel, criado_em FROM usuarios WHERE id=? LIMIT 1', [uid]),
    db.execute(
      `SELECT
        (SELECT COUNT(*) FROM posts WHERE usuario_id=?) AS total_posts,
        (SELECT COUNT(*) FROM seguidores WHERE seguido_id=?) AS total_seguidores,
        (SELECT COUNT(*) FROM seguidores WHERE seguidor_id=?) AS total_seguindo,
        (SELECT COUNT(*) FROM membros_comunidade WHERE usuario_id=?) AS total_comunidades`,
      [uid, uid, uid, uid]
    ),
    db.execute(
      `SELECT u.nome, u.username, u.esporte_favorito
       FROM seguidores s
       JOIN usuarios u ON u.id = s.seguidor_id
       WHERE s.seguido_id = ?
       ORDER BY s.criado_em DESC
       LIMIT 12`,
      [uid]
    ),
    db.execute(
      `SELECT u.nome, u.username, u.esporte_favorito
       FROM seguidores s
       JOIN usuarios u ON u.id = s.seguido_id
       WHERE s.seguidor_id = ?
       ORDER BY s.criado_em DESC
       LIMIT 12`,
      [uid]
    ),
  ]);
  const profile = profileRows[0] || {};
  const counts = countsRows[0] || {};
  parts.push('Perfil completo do usuário logado:\n' + JSON.stringify({ ...profile, ...counts }, null, 2));
  if (followersRows.length) {
    parts.push('Seguidores recentes do usuário:\n' + followersRows.map((u) => `- ${u.nome} (@${u.username})${u.esporte_favorito ? `, esporte: ${u.esporte_favorito}` : ''}`).join('\n'));
  }
  if (followingRows.length) {
    parts.push('Perfis que o usuário segue:\n' + followingRows.map((u) => `- ${u.nome} (@${u.username})${u.esporte_favorito ? `, esporte: ${u.esporte_favorito}` : ''}`).join('\n'));
  }

  const [communities] = await db.query('SELECT nome, descricao FROM comunidades ORDER BY nome LIMIT 30');
  if (communities.length) {
    parts.push('Comunidades disponíveis na Arena+:\n' + communities.map((c) => `- ${c.nome}: ${c.descricao || 'Comunidade esportiva da Arena+.'}`).join('\n'));
  }

  const [myCommunities] = await db.execute(
    `SELECT c.nome, c.descricao
     FROM membros_comunidade mc
     JOIN comunidades c ON c.id = mc.comunidade_id
     WHERE mc.usuario_id = ?
     ORDER BY mc.criado_em DESC
     LIMIT 15`,
    [uid]
  );
  parts.push(myCommunities.length
    ? 'Comunidades que o usuário participa:\n' + myCommunities.map((c) => `- ${c.nome}: ${c.descricao || 'Sem descrição.'}`).join('\n')
    : 'Comunidades que o usuário participa: nenhuma ainda.');

  const [posts] = await db.execute('SELECT texto, midia_tipo, criado_em FROM posts WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 12', [uid]);
  parts.push(posts.length
    ? 'Posts recentes do próprio usuário, não usar posts de outras pessoas:\n' + posts.map((p) => {
      const text = String(p.texto || '').trim() || '[post sem texto]';
      const media = p.midia_tipo ? ` mídia=${p.midia_tipo}` : '';
      return `- ${p.criado_em}${media}: ${text}`;
    }).join('\n')
    : 'Posts recentes do próprio usuário: nenhum post ainda.');

  const [publicPosts] = await db.query(
    `SELECT p.texto, p.midia_tipo, p.criado_em, u.username
     FROM posts p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.texto IS NOT NULL AND p.texto <> ''
     ORDER BY p.criado_em DESC
     LIMIT 20`
  );
  if (publicPosts.length) {
    parts.push('Posts públicos recentes para resumo/moderação sob demanda:\n' + publicPosts.map((p) => {
      const media = p.midia_tipo ? ` mídia=${p.midia_tipo}` : '';
      return `- @${p.username} em ${p.criado_em}${media}: ${String(p.texto).slice(0, 280)}`;
    }).join('\n'));
  }

  const [challenges] = await db.query('SELECT titulo, descricao, estilo, pontos FROM desafios ORDER BY criado_em DESC LIMIT 12');
  if (challenges.length) {
    parts.push('Desafios ativos:\n' + challenges.map((d) => `- ${d.titulo} (${d.estilo}, ${d.pontos} pts): ${d.descricao}`).join('\n'));
  }
  return parts.join('\n\n');
}

function localCoachFallback(question, context) {
  const text = String(question || '').toLowerCase();
  if (text.includes('sug') && (text.includes('post') || text.includes('conteúdo') || text.includes('conteudo'))) {
    return 'Sugestões de post para a Arena+: 1) conte como foi seu último treino e marque o esporte; 2) publique uma meta da semana; 3) peça dicas para uma comunidade; 4) compartilhe um antes/depois de evolução com uma legenda curta e honesta.';
  }
  if (text.includes('moder') || text.includes('resum')) {
    const match = context.match(/Posts públicos recentes para resumo\/moderação sob demanda:(.*?)(?:\n\n|$)/su);
    if (match) {
      return 'Resumo/moderação dos posts recentes: procure linguagem ofensiva, exposição de dados pessoais, promessas médicas absolutas e incentivo a práticas perigosas. Conteúdo esportivo comum pode ser mantido; quando houver dica de saúde, recomende orientação profissional.\n\nAmostra analisada:\n' + match[1].trim();
    }
    return 'Não encontrei posts públicos suficientes para resumir ou moderar agora.';
  }
  if (text.includes('postei') || text.includes('meus post') || text.includes('minhas publica') || ((text.includes('últimos posts') || text.includes('ultimos posts')) && text.includes('meus'))) {
    const match = context.match(/Posts recentes do próprio usuário:(.*?)(?:\n\n|$)/su);
    const posts = match ? match[1].trim() : '';
    return posts && !posts.includes('nenhum post ainda')
      ? `Sim. Encontrei estes posts seus mais recentes:\n${posts}`
      : 'Ainda não encontrei posts seus no banco. Quando você publicar no feed, eu consigo usar somente os seus posts como contexto.';
  }
  if (text.includes('quem sigo') || text.includes('amigos eu sigo') || text.includes('perfis que sigo')) {
    const match = context.match(/Perfis que o usuário segue:(.*?)(?:\n\n|$)/su);
    return match
      ? `Você segue estes perfis na Arena+:\n${match[1].trim()}`
      : 'Ainda não encontrei perfis que você segue no banco.';
  }
  if ((text.includes('comunidades') || text.includes('comunidade')) && (text.includes('sigo') || text.includes('participo') || text.includes('minhas'))) {
    const match = context.match(/Comunidades que o usuário participa:(.*?)(?:\n\n|$)/su);
    return match && !match[1].includes('nenhuma ainda')
      ? `Você participa destas comunidades:\n${match[1].trim()}`
      : 'Ainda não encontrei comunidades seguidas por você no banco.';
  }
  if (text.includes('recomenda') && (text.includes('seguir') || text.includes('alguém') || text.includes('alguem'))) {
    const following = context.match(/Perfis que o usuário segue:(.*?)(?:\n\n|$)/su);
    const communities = context.match(/Comunidades que o usuário participa:(.*?)(?:\n\n|$)/su);
    const base = [following?.[1]?.trim(), communities?.[1]?.trim()].filter(Boolean).join('\n');
    return base
      ? `Com base no seu perfil e nas suas conexões, procure pessoas com esportes parecidos aos seus e ativas nas mesmas comunidades. Seu contexto atual:\n${base}`
      : 'Ainda tenho pouco dado seu para recomendar alguém com precisão. Siga algumas comunidades e publique treinos para eu melhorar essa recomendação.';
  }
  if (text.includes('comunidade')) {
    const match = context.match(/Comunidades disponíveis na Arena\+:(.*?)(?:\n\n|$)/su);
    if (match) return `Estas são algumas comunidades disponíveis na Arena+:\n${match[1].trim()}`;
  }
  if (text.includes('desafio') || text.includes('gym rats')) {
    const match = context.match(/Desafios ativos:(.*?)(?:\n\n|$)/su);
    if (match) return `Desafios ativos agora:\n${match[1].trim()}`;
  }
  if (text.includes('emagrecer') || text.includes('perder peso')) {
    return 'Para emagrecimento, combine déficit calórico moderado, proteína em todas as refeições, treino de força e cardio progressivo. Comece registrando 3 hábitos: água, passos e proteína diária.';
  }
  if (text.includes('hipertrofia') || text.includes('ganhar massa')) {
    return 'Para hipertrofia, foque em progressão de carga, sono, proteína suficiente e carboidratos perto do treino. Um desafio bom: 4 treinos por semana + registro de carga em 3 exercícios principais.';
  }
  return `Modo local do Arena Coaching ativo. Base consultada:\n${context}\n\nConfigure OPENAI_API_KEY para respostas personalizadas por IA.`;
}

function openAiText(response) {
  if (response.output_text) return String(response.output_text).trim();
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) return String(content.text).trim();
    }
  }
  return '';
}

async function openAiPost(endpoint, payload) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: 'OPENAI_API_KEY não configurada.' };
  const response = await fetch(`https://api.openai.com/v1/${endpoint.replace(/^\//, '')}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: data.error?.message || 'Erro na API OpenAI.', status: response.status };
  }
  return { ok: true, data };
}

function coachSystemPrompt(profile, generalContext, arenaContext, question) {
  return (
    'Você é o Arena Coaching, assistente de IA da Arena+, uma rede social esportiva brasileira.\n' +
    'Responda em português brasileiro, de forma curta, prática e segura.\n' +
    'Você pode: responder perguntas sobre esportes, sugerir posts/conteúdo para o usuário, resumir posts públicos recentes e apontar riscos de moderação em comunidades sob demanda.\n' +
    'Para falar de posts pessoais, use somente os posts do próprio usuário logado. Não invente posts de outras pessoas.\n' +
    'Ao moderar, foque em discurso ofensivo, assédio, dados pessoais, riscos físicos, promessas médicas absolutas e spam. Não seja moralista.\n' +
    'Não faça diagnóstico médico. Quando houver risco, recomende profissional.\n\n' +
    `Perfil: ${JSON.stringify(profile || {})}\n\n` +
    `Contexto RAG geral:\n${generalContext}\n\nContexto da Arena+ e do usuário:\n${arenaContext}\n\nPergunta: ${question}`
  );
}

async function buildCoachRequest(uid, question, extraContent = []) {
  const generalContext = await coachContext(question);
  const arenaContext = await coachArenaUserContext(uid);
  const fallback = localCoachFallback(question, `${generalContext}\n\n${arenaContext}`);
  const [profileRows] = await db.execute('SELECT nome, username, bio, cidade, esporte_favorito, posicao_modalidade, objetivo, nivel FROM usuarios WHERE id=? LIMIT 1', [uid]);
  const content = [{
    type: 'input_text',
    text: coachSystemPrompt(profileRows[0] || {}, generalContext, arenaContext, question),
  }, ...extraContent];
  return { fallback, content };
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function streamFallback(res, text) {
  const parts = String(text || '').match(/.{1,28}(\s|$)/g) || [String(text || '')];
  for (const part of parts) {
    writeSse(res, 'token', { token: part });
    await new Promise((resolve) => setTimeout(resolve, 18));
  }
  writeSse(res, 'done', { ok: true, modo: 'local' });
  res.end();
}

async function streamOpenAiResponse(res, payload, fallback) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return streamFallback(res, fallback);

  const upstream = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...payload, stream: true }),
  });

  if (!upstream.ok || !upstream.body) {
    return streamFallback(res, fallback);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let emitted = false;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\n\n/);
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      const dataLines = block.split(/\n/).filter((line) => line.startsWith('data:'));
      if (!dataLines.length) continue;
      const raw = dataLines.map((line) => line.replace(/^data:\s?/, '')).join('\n').trim();
      if (!raw || raw === '[DONE]') continue;

      let event;
      try {
        event = JSON.parse(raw);
      } catch (err) {
        continue;
      }

      if (event.type === 'response.output_text.delta' && event.delta) {
        emitted = true;
        writeSse(res, 'token', { token: event.delta });
      }
      if (event.type === 'response.error') {
        writeSse(res, 'error', { erro: event.error?.message || 'Erro no streaming da OpenAI.' });
      }
    }
  }

  if (!emitted) {
    await streamFallback(res, fallback);
    return;
  }
  writeSse(res, 'done', { ok: true, modo: 'openai' });
  res.end();
}

app.get(['/api/coach/stream', '/api_arena_coach_stream.php'], noCache, requireAuth, async (req, res, next) => {
  try {
    const question = String(req.query.mensagem || '').trim();
    if (!question) {
      res.writeHead(400, { 'Content-Type': 'text/event-stream; charset=utf-8' });
      writeSse(res, 'error', { erro: 'Digite uma pergunta.' });
      return res.end();
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    writeSse(res, 'ready', { ok: true });

    const { fallback, content } = await buildCoachRequest(req.session.usuario_id, question);
    await streamOpenAiResponse(res, {
      model: process.env.OPENAI_TEXT_MODEL || 'gpt-5',
      input: [{ role: 'user', content }],
    }, fallback);
  } catch (err) {
    if (!res.headersSent) return next(err);
    writeSse(res, 'error', { erro: err.message || 'Erro no streaming.' });
    res.end();
  }
});

app.all(['/api/coach', '/api_arena_coach.php'], noCache, requireAuth, upload.fields([{ name: 'imagem', maxCount: 1 }]), async (req, res, next) => {
  try {
    const uid = req.session.usuario_id;
    const action = req.body.acao || req.query.acao || 'chat';

    if (action === 'chat' || action === 'analisar_imagem') {
      const question = String(req.body.mensagem || '').trim();
      if (!question && action === 'chat') return res.json({ erro: 'Digite uma pergunta.' });
      const lower = question.toLowerCase();
      const extraContent = [];
      const image = req.files?.imagem?.[0];
      if (image) {
        const bytes = await fs.promises.readFile(image.path);
        const mime = image.mimetype || 'image/png';
        extraContent.push({ type: 'input_image', image_url: `data:${mime};base64,${bytes.toString('base64')}` });
      }
      const { fallback, content } = await buildCoachRequest(uid, question, extraContent);
      if (action === 'chat' && (lower.includes('postei') || lower.includes('meus post') || lower.includes('minhas publica') || lower.includes('quais comunidades') || lower.includes('desafios'))) {
        return res.json({ ok: true, modo: 'rag-local', resposta: fallback });
      }

      const result = await openAiPost('responses', {
        model: process.env.OPENAI_TEXT_MODEL || 'gpt-5',
        input: [{ role: 'user', content }],
      });
      if (!result.ok) return res.json({ ok: true, modo: 'local', resposta: fallback });
      return res.json({ ok: true, modo: 'openai', resposta: openAiText(result.data) || fallback });
    }

    if (action === 'gerar_imagem') {
      const prompt = String(req.body.prompt || '').trim();
      if (!prompt) return res.json({ erro: 'Digite o prompt da imagem.' });

      const models = [...new Set([process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5', 'gpt-image-1', 'dall-e-3'])];
      let result = { ok: false, error: 'Não foi possível gerar imagem.' };
      let modelUsed = models[0];
      for (const model of models) {
        const payload = {
          model,
          prompt: 'Arte esportiva para a rede social Arena+, estilo moderno e motivacional: ' + prompt,
          size: '1024x1024',
          n: 1,
        };
        if (model.startsWith('gpt-image')) payload.quality = 'medium';
        result = await openAiPost('images/generations', payload);
        modelUsed = model;
        if (result.ok) break;
      }
      if (!result.ok) return res.json({ erro: result.error });

      const item = result.data.data?.[0] || {};
      const filename = `arena_ai_${uid}_${Math.floor(Date.now() / 1000)}.png`;
      const target = path.join(ROOT, 'upload', filename);
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      if (item.b64_json) {
        await fs.promises.writeFile(target, Buffer.from(item.b64_json, 'base64'));
      } else if (item.url) {
        const imageResponse = await fetch(item.url);
        if (!imageResponse.ok) return res.json({ erro: 'A API retornou URL, mas não consegui baixar a imagem.' });
        await fs.promises.writeFile(target, Buffer.from(await imageResponse.arrayBuffer()));
      } else {
        return res.json({ erro: 'A API não retornou uma imagem válida.' });
      }
      return res.json({ ok: true, imagem_url: `upload/${filename}`, modelo: modelUsed });
    }

    res.json({ erro: 'Ação desconhecida.' });
  } catch (err) {
    next(err);
  }
});

app.get('/openapi.json', noCache, (req, res, next) => {
  try {
    res.sendFile(path.join(ROOT, 'openapi.json'));
  } catch (err) {
    next(err);
  }
});

app.get('/api-docs', noCache, (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Arena+ Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      persistAuthorization: true
    });
  </script>
</body>
</html>`);
});

app.use((err, req, res, next) => {
  console.error(err);
  const message = process.env.NODE_ENV === 'production' ? 'Erro interno no servidor.' : err.message;
  if (req.path.startsWith('/api_') || req.path.startsWith('/api/') || req.path === '/salvar_perfil.php') {
    return res.status(500).json({ erro: message });
  }
  res.status(500).send(`<pre>${htmlEscape(message)}</pre>`);
});

ensureCommunitySchema()
  .catch((err) => console.error('Falha ao preparar schema de comunidades:', err.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Arena+ Express rodando em http://localhost:${PORT}`);
    });
  });
