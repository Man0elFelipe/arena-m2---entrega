-- Arena+ updates: seguidores, membros de comunidades e vinculo post-comunidade.
-- Use no MySQL do MAMP, no banco arena_plus.

CREATE TABLE IF NOT EXISTS seguidores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seguidor_id INT UNSIGNED NOT NULL,
  seguido_id INT UNSIGNED NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unico_seguidor (seguidor_id, seguido_id),
  KEY idx_seguidor (seguidor_id),
  KEY idx_seguido (seguido_id),
  CONSTRAINT fk_seguidores_seguidor
    FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_seguidores_seguido
    FOREIGN KEY (seguido_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS membros_comunidade (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  comunidade_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unico_membro (comunidade_id, usuario_id),
  KEY idx_membro_usuario (usuario_id),
  KEY idx_membro_comunidade (comunidade_id),
  CONSTRAINT fk_membros_comunidade_comunidade
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE,
  CONSTRAINT fk_membros_comunidade_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //

CREATE PROCEDURE arena_add_column_if_missing(
  IN table_name_param VARCHAR(64),
  IN column_name_param VARCHAR(64),
  IN column_sql_param VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_param
      AND COLUMN_NAME = column_name_param
  ) THEN
    SET @arena_sql = CONCAT('ALTER TABLE ', table_name_param, ' ADD COLUMN ', column_sql_param);
    PREPARE arena_stmt FROM @arena_sql;
    EXECUTE arena_stmt;
    DEALLOCATE PREPARE arena_stmt;
  END IF;
END//

CREATE PROCEDURE arena_add_index_if_missing(
  IN table_name_param VARCHAR(64),
  IN index_name_param VARCHAR(64),
  IN index_sql_param VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_param
      AND INDEX_NAME = index_name_param
  ) THEN
    SET @arena_idx_sql = CONCAT('CREATE INDEX ', index_name_param, ' ON ', table_name_param, ' ', index_sql_param);
    PREPARE arena_idx_stmt FROM @arena_idx_sql;
    EXECUTE arena_idx_stmt;
    DEALLOCATE PREPARE arena_idx_stmt;
  END IF;
END//

DELIMITER ;

CALL arena_add_column_if_missing('posts', 'comunidade_id', 'comunidade_id INT UNSIGNED DEFAULT NULL');
CALL arena_add_column_if_missing('posts', 'community_id', 'community_id INT UNSIGNED DEFAULT NULL');
CALL arena_add_column_if_missing('posts', 'fixado', 'fixado TINYINT(1) DEFAULT 0');

CALL arena_add_column_if_missing('comunidades', 'categoria', 'categoria VARCHAR(80) DEFAULT NULL');
CALL arena_add_column_if_missing('comunidades', 'theme', 'theme VARCHAR(100) DEFAULT NULL');
CALL arena_add_column_if_missing('comunidades', 'capa_url', 'capa_url VARCHAR(255) DEFAULT NULL');
CALL arena_add_column_if_missing('comunidades', 'banner_url', 'banner_url VARCHAR(255) DEFAULT NULL');
CALL arena_add_column_if_missing('comunidades', 'avatar_url', 'avatar_url VARCHAR(255) DEFAULT NULL');
CALL arena_add_column_if_missing('comunidades', 'criador_id', 'criador_id INT UNSIGNED DEFAULT NULL');

DROP PROCEDURE arena_add_column_if_missing;

UPDATE comunidades
SET theme = categoria
WHERE (theme IS NULL OR theme = '') AND categoria IS NOT NULL;

UPDATE comunidades
SET banner_url = COALESCE(capa_url, imagem)
WHERE (banner_url IS NULL OR banner_url = '') AND (capa_url IS NOT NULL OR imagem IS NOT NULL);

UPDATE posts
SET community_id = comunidade_id
WHERE community_id IS NULL AND comunidade_id IS NOT NULL;

UPDATE posts
SET comunidade_id = community_id
WHERE comunidade_id IS NULL AND community_id IS NOT NULL;

CALL arena_add_index_if_missing('posts', 'idx_posts_comunidade', '(comunidade_id)');
CALL arena_add_index_if_missing('posts', 'idx_posts_community', '(community_id)');
CALL arena_add_index_if_missing('posts', 'idx_posts_usuario', '(usuario_id)');

DROP PROCEDURE arena_add_index_if_missing;

UPDATE usuarios
SET email = 'admin@arena.com'
WHERE username = '2gmja'
  AND NOT EXISTS (
    SELECT 1
    FROM (SELECT id FROM usuarios WHERE email = 'admin@arena.com' AND username <> '2gmja' LIMIT 1) AS admin_email_em_uso
  );

INSERT INTO usuarios (id, nome, username, email, senha_hash, bio)
SELECT 15, 'perfil 2gmja', '2gmja', 'admin@arena.com', '$2a$10$/hahIvPbt59TCZSZRWC0P.yjPhymqB0KSu1l7ZrwEVz2/j7g4suFm', 'Administrador da Arena+'
WHERE NOT EXISTS (
  SELECT 1
  FROM usuarios
  WHERE id = 15 OR username = '2gmja' OR email = 'admin@arena.com'
);
