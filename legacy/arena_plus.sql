-- ============================================================
--  Arena+ | Banco de dados completo para MAMP
--  Execute este arquivo no phpMyAdmin:
--  1. Clique em "SQL" no menu
--  2. Cole este conteúdo e clique em Executar
-- ============================================================

CREATE DATABASE IF NOT EXISTS arena_plus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE arena_plus;

-- ──────────────────────────────────────────
--  USUÁRIOS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome         VARCHAR(100)  NOT NULL,
    username     VARCHAR(50)   NOT NULL UNIQUE,
    email        VARCHAR(150)  NOT NULL UNIQUE,
    senha_hash   VARCHAR(255)  NOT NULL,
    bio          TEXT          DEFAULT NULL,
    cidade       VARCHAR(100)  DEFAULT NULL,
    esporte_favorito VARCHAR(80) DEFAULT NULL,
    posicao_modalidade VARCHAR(100) DEFAULT NULL,
    objetivo     VARCHAR(120) DEFAULT NULL,
    nivel        VARCHAR(40) DEFAULT NULL,
    foto_perfil  VARCHAR(255)  DEFAULT NULL,
    criado_em    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
--  CONFIGURAÇÕES DO USUÁRIO
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracoes_usuario (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id          INT UNSIGNED NOT NULL UNIQUE,
    conta_privada       TINYINT(1)   DEFAULT 0,
    notif_seguidores    TINYINT(1)   DEFAULT 1,
    notif_comunidades   TINYINT(1)   DEFAULT 1,
    notif_chat          TINYINT(1)   DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
--  POSTS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT UNSIGNED NOT NULL,
    texto       TEXT         DEFAULT NULL,
    midia_url   VARCHAR(255) DEFAULT NULL,
    midia_tipo  ENUM('image','video') DEFAULT NULL,
    comunidade_id INT UNSIGNED DEFAULT NULL,
    community_id INT UNSIGNED DEFAULT NULL,
    fixado      TINYINT(1) DEFAULT 0,
    criado_em   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    KEY idx_posts_comunidade (comunidade_id),
    KEY idx_posts_community (community_id),
    KEY idx_posts_usuario (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
--  CURTIDAS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS curtidas (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id     INT UNSIGNED NOT NULL,
    usuario_id  INT UNSIGNED NOT NULL,
    criado_em   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unico_curtir (post_id, usuario_id),
    FOREIGN KEY (post_id)    REFERENCES posts(id)    ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
--  COMENTÁRIOS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comentarios (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id     INT UNSIGNED NOT NULL,
    usuario_id  INT UNSIGNED NOT NULL,
    texto       TEXT         NOT NULL,
    criado_em   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id)    REFERENCES posts(id)    ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
--  SEGUIDORES
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seguidores (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    seguidor_id     INT UNSIGNED NOT NULL,   -- quem segue
    seguido_id      INT UNSIGNED NOT NULL,   -- quem é seguido
    criado_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unico_seguir (seguidor_id, seguido_id),
    FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (seguido_id)  REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
--  COMUNIDADES
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comunidades (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    descricao   TEXT         DEFAULT NULL,
    categoria   VARCHAR(80)  DEFAULT NULL,
    theme       VARCHAR(100) DEFAULT NULL,
    imagem      VARCHAR(255) DEFAULT NULL,
    avatar_url  VARCHAR(255) DEFAULT NULL,
    capa_url    VARCHAR(255) DEFAULT NULL,
    banner_url  VARCHAR(255) DEFAULT NULL,
    criador_id  INT UNSIGNED DEFAULT NULL,
    criado_em   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
--  NOTIFICAÇÕES
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacoes (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT UNSIGNED NOT NULL,
    ator_id     INT UNSIGNED DEFAULT NULL,
    tipo        VARCHAR(40) NOT NULL,
    mensagem    VARCHAR(255) NOT NULL,
    link        VARCHAR(255) DEFAULT NULL,
    lida        TINYINT(1) DEFAULT 0,
    criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (ator_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin: no Node, defina ADMIN_USER_IDS no .env, exemplo:
-- ADMIN_USER_IDS=1
-- Por padrão, o usuário id=1 acessa /admin.

-- ──────────────────────────────────────────
--  MEMBROS DAS COMUNIDADES
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membros_comunidade (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    comunidade_id   INT UNSIGNED NOT NULL,
    usuario_id      INT UNSIGNED NOT NULL,
    criado_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unico_membro (comunidade_id, usuario_id),
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
--  DESAFIOS / GAMIFICAÇÃO
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS desafios (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    comunidade_id  INT UNSIGNED DEFAULT NULL,
    titulo         VARCHAR(120) NOT NULL,
    descricao      TEXT NOT NULL,
    estilo         VARCHAR(40) DEFAULT 'gym-rats',
    pontos         INT UNSIGNED DEFAULT 100,
    data_fim       DATE DEFAULT NULL,
    criado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios_desafios (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    desafio_id  INT UNSIGNED NOT NULL,
    usuario_id  INT UNSIGNED NOT NULL,
    status      ENUM('ativo','concluido') DEFAULT 'ativo',
    criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unico_usuario_desafio (desafio_id, usuario_id),
    FOREIGN KEY (desafio_id) REFERENCES desafios(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
--  BASE RAG DO ARENA COACHING
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS arena_coach_base (
    id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo    VARCHAR(120) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    conteudo  TEXT NOT NULL,
    tags      VARCHAR(255) DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FULLTEXT KEY ft_coach (titulo, conteudo, tags)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
--  DADOS INICIAIS: comunidades padrão
-- ──────────────────────────────────────────
INSERT IGNORE INTO comunidades (nome, descricao, categoria, imagem, avatar_url, capa_url) VALUES
('Fãs de Basquete',  'Tudo sobre basquete, NBB e NBA!', 'quadra', 'Gemini_Generated_Image_kb5xt0kb5xt0kb5x.png', 'Gemini_Generated_Image_kb5xt0kb5xt0kb5x.png', 'Gemini_Generated_Image_kb5xt0kb5xt0kb5x.png'),
('Muscle Gang',      'Treinos, academia e evolução física.', 'academia', 'academia.png', 'academia.png', 'academia.png'),
('Futebol Raiz',     'Peladas, campeonatos de bairro e histórias de vestiário.', 'futebol', 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg', 'jogador-de-futebol-masculino-com-bola-no-campo-de-grama_23-2150821526.jpg.jpeg', 'images.jpeg'),
('Vôlei Brasil',     'Seleção, clubes e campeonatos de vôlei.', 'quadra', 'volei.jpg.jpeg', 'volei.jpg.jpeg', 'volei_selecao_bras_copa_do_mundo_x_catar.jpg.webp'),
('Boxe & Artes Marciais', 'Lutas, treinos e competições.', 'lutas', 'boxe.jpeg', 'boxe.jpeg', 'boxe.jpeg');

INSERT IGNORE INTO desafios (titulo, descricao, estilo, pontos, data_fim) VALUES
('Gym Rats 21 dias', 'Faça check-in de treino por 21 dias e poste sua evolução na comunidade.', 'gym-rats', 450, DATE_ADD(CURDATE(), INTERVAL 21 DAY)),
('Cardio da Semana', 'Complete 90 minutos de cardio na semana e compartilhe seu melhor tempo.', 'cardio', 180, DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
('Prato de Campeão', 'Publique 3 refeições equilibradas com proteína, carboidrato e vegetais.', 'nutricao', 220, DATE_ADD(CURDATE(), INTERVAL 10 DAY));

INSERT IGNORE INTO arena_coach_base (titulo, categoria, conteudo, tags) VALUES
('Pré-treino simples', 'alimentacao', 'Para treinos intensos, uma refeição 60 a 120 minutos antes pode combinar carboidrato de fácil digestão, proteína leve e hidratação.', 'pre treino energia carboidrato academia corrida futebol'),
('Pós-treino e recuperação', 'alimentacao', 'Depois do treino, priorize proteína, carboidrato e água para apoiar recuperação muscular e reposição de energia.', 'pos treino proteina recuperacao hipertrofia emagrecimento'),
('Treino para iniciantes', 'esporte', 'Iniciantes evoluem melhor com consistência, técnica e progressão. Comece com 3 a 4 sessões semanais e registre cargas ou tempos.', 'iniciante musculacao corrida esporte tecnica'),
('Comunidade Gym Rats', 'comunidade', 'Desafios estilo Gym Rats funcionam bem com check-in de treino, ranking por pontos, fotos de evolução e missões semanais.', 'gym rats desafio ranking treino comunidade');
