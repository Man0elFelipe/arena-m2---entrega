<?php
// ============================================================
// Arena+ | Arena Coaching com RAG simples + imagem
// ============================================================
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}
require_once 'conexao.php';
require_once 'openai_client.php';

header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['usuario_id'])) {
    echo json_encode(['erro' => 'Não autenticado.']);
    exit;
}

$uid = (int) $_SESSION['usuario_id'];
$pdo = conectar();
$acao = $_POST['acao'] ?? $_GET['acao'] ?? 'chat';

function coachEnsureSchema(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS arena_coach_base (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(120) NOT NULL,
            categoria VARCHAR(50) NOT NULL,
            conteudo TEXT NOT NULL,
            tags VARCHAR(255) DEFAULT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FULLTEXT KEY ft_coach (titulo, conteudo, tags)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $count = (int) $pdo->query('SELECT COUNT(*) FROM arena_coach_base')->fetchColumn();
    if ($count > 0) return;

    $seed = $pdo->prepare('INSERT INTO arena_coach_base (titulo, categoria, conteudo, tags) VALUES (?,?,?,?)');
    $items = [
        ['Pré-treino simples', 'alimentacao', 'Para treinos intensos, uma refeição 60 a 120 minutos antes pode combinar carboidrato de fácil digestão, proteína leve e hidratação. Exemplos: banana com iogurte, pão integral com ovos, aveia com fruta.', 'pre treino energia carboidrato academia corrida futebol'],
        ['Pós-treino e recuperação', 'alimentacao', 'Depois do treino, priorize proteína, carboidrato e água. Isso ajuda recuperação muscular e reposição de energia. Ajuste quantidades ao objetivo, peso, rotina e orientação profissional.', 'pos treino proteina recuperacao hipertrofia emagrecimento'],
        ['Treino para iniciantes', 'esporte', 'Iniciantes evoluem melhor com consistência, técnica e progressão. Comece com 3 a 4 sessões semanais, aqueça, registre cargas ou tempos e aumente volume aos poucos.', 'iniciante musculacao corrida esporte tecnica'],
        ['Comunidade Gym Rats', 'comunidade', 'Desafios estilo Gym Rats funcionam bem com metas semanais: check-in de treino, sequência de dias, ranking por pontos, fotos de evolução e missões como treino de pernas, cardio e mobilidade.', 'gym rats desafio ranking treino comunidade'],
        ['Cuidados gerais', 'saude', 'Dicas de IA não substituem nutricionista, médico ou educador físico. Dor forte, tontura, lesão, doença ou dieta restritiva exigem acompanhamento profissional.', 'seguranca saude lesao medico nutricionista'],
    ];
    foreach ($items as $item) $seed->execute($item);
}

function coachEnsureUserColumns(PDO $pdo): void {
    $cols = $pdo->query("SHOW COLUMNS FROM usuarios")->fetchAll(PDO::FETCH_COLUMN);
    $alter = [];
    if (!in_array('esporte_favorito', $cols, true)) $alter[] = "ADD COLUMN esporte_favorito VARCHAR(80) DEFAULT NULL";
    if (!in_array('objetivo', $cols, true)) $alter[] = "ADD COLUMN objetivo VARCHAR(120) DEFAULT NULL";
    if (!in_array('nivel', $cols, true)) $alter[] = "ADD COLUMN nivel VARCHAR(40) DEFAULT NULL";
    if ($alter) $pdo->exec('ALTER TABLE usuarios ' . implode(', ', $alter));
}

function coachContext(PDO $pdo, string $pergunta): string {
    coachEnsureSchema($pdo);
    $termos = preg_split('/\s+/u', mb_strtolower($pergunta), -1, PREG_SPLIT_NO_EMPTY);
    $termos = array_values(array_filter($termos, fn($t) => mb_strlen($t) >= 4));
    $like = '%' . implode('%', array_slice($termos, 0, 5)) . '%';
    if ($like === '%%') $like = '%' . $pergunta . '%';

    $stmt = $pdo->prepare("
        SELECT titulo, categoria, conteudo
        FROM arena_coach_base
        WHERE titulo LIKE :q1 OR conteudo LIKE :q2 OR tags LIKE :q3
        ORDER BY id DESC
        LIMIT 5
    ");
    $stmt->execute([':q1' => $like, ':q2' => $like, ':q3' => $like]);
    $rows = $stmt->fetchAll();

    if (!$rows) {
        $rows = $pdo->query('SELECT titulo, categoria, conteudo FROM arena_coach_base ORDER BY id LIMIT 5')->fetchAll();
    }

    $out = [];
    foreach ($rows as $r) {
        $out[] = "[{$r['categoria']}] {$r['titulo']}: {$r['conteudo']}";
    }
    return implode("\n", $out);
}

function coachArenaUserContext(PDO $pdo, int $uid): string {
    $partes = [];

    $comunidades = $pdo->query('SELECT nome, descricao FROM comunidades ORDER BY nome LIMIT 30')->fetchAll();
    if ($comunidades) {
        $linhas = array_map(fn($c) => "- {$c['nome']}: " . ($c['descricao'] ?: 'Comunidade esportiva da Arena+.'), $comunidades);
        $partes[] = "Comunidades disponíveis na Arena+:\n" . implode("\n", $linhas);
    }

    $stmt = $pdo->prepare("
        SELECT c.nome, c.descricao
        FROM membros_comunidade mc
        JOIN comunidades c ON c.id = mc.comunidade_id
        WHERE mc.usuario_id = ?
        ORDER BY mc.criado_em DESC
        LIMIT 15
    ");
    $stmt->execute([$uid]);
    $minhasComunidades = $stmt->fetchAll();
    if ($minhasComunidades) {
        $linhas = array_map(fn($c) => "- {$c['nome']}: " . ($c['descricao'] ?: 'Sem descrição.'), $minhasComunidades);
        $partes[] = "Comunidades que o usuário participa:\n" . implode("\n", $linhas);
    } else {
        $partes[] = "Comunidades que o usuário participa: nenhuma ainda.";
    }

    $stmt = $pdo->prepare("
        SELECT texto, midia_tipo, criado_em
        FROM posts
        WHERE usuario_id = ?
        ORDER BY criado_em DESC
        LIMIT 12
    ");
    $stmt->execute([$uid]);
    $meusPosts = $stmt->fetchAll();
    if ($meusPosts) {
        $linhas = array_map(function ($p) {
            $texto = trim($p['texto'] ?? '') ?: '[post sem texto]';
            $midia = $p['midia_tipo'] ? " mídia={$p['midia_tipo']}" : '';
            return "- {$p['criado_em']}{$midia}: {$texto}";
        }, $meusPosts);
        $partes[] = "Posts recentes do próprio usuário, não usar posts de outras pessoas:\n" . implode("\n", $linhas);
    } else {
        $partes[] = "Posts recentes do próprio usuário: nenhum post ainda.";
    }

    try {
        $desafios = $pdo->query("SELECT titulo, descricao, estilo, pontos FROM desafios ORDER BY criado_em DESC LIMIT 12")->fetchAll();
        if ($desafios) {
            $linhas = array_map(fn($d) => "- {$d['titulo']} ({$d['estilo']}, {$d['pontos']} pts): {$d['descricao']}", $desafios);
            $partes[] = "Desafios ativos:\n" . implode("\n", $linhas);
        }
    } catch (Throwable $e) {
        // Tabela pode não existir em bancos antigos; o coaching continua funcionando.
    }

    return implode("\n\n", $partes);
}

function localCoachFallback(string $pergunta, string $contexto): string {
    $p = mb_strtolower($pergunta);
    if (mb_strpos($p, 'postei') !== false || mb_strpos($p, 'meus post') !== false || mb_strpos($p, 'minhas publica') !== false) {
        if (preg_match('/Posts recentes do próprio usuário:(.*?)(?:\n\n|$)/su', $contexto, $m)) {
            $posts = trim($m[1]);
            if ($posts && mb_strpos($posts, 'nenhum post ainda') === false) {
                return "Sim. Encontrei estes posts seus mais recentes:\n" . $posts;
            }
        }
        return 'Ainda não encontrei posts seus no banco. Quando você publicar no feed, eu consigo usar somente os seus posts como contexto.';
    }
    if (mb_strpos($p, 'comunidade') !== false || mb_strpos($p, 'comunidades') !== false) {
        if (preg_match('/Comunidades disponíveis na Arena\+:(.*?)(?:\n\n|$)/su', $contexto, $m)) {
            return "Estas são algumas comunidades disponíveis na Arena+:\n" . trim($m[1]);
        }
    }
    if (mb_strpos($p, 'desafio') !== false || mb_strpos($p, 'gym rats') !== false) {
        if (preg_match('/Desafios ativos:(.*?)(?:\n\n|$)/su', $contexto, $m)) {
            return "Desafios ativos agora:\n" . trim($m[1]);
        }
    }
    if (mb_strpos($p, 'imagem') !== false || mb_strpos($p, 'foto') !== false) {
        return 'Posso analisar fotos quando a chave da OpenAI estiver configurada. Envie uma imagem de refeição, treino ou exercício e eu retorno observações práticas.';
    }
    if (mb_strpos($p, 'emagrecer') !== false || mb_strpos($p, 'perder peso') !== false) {
        return 'Para emagrecimento, combine déficit calórico moderado, proteína em todas as refeições, treino de força e cardio progressivo. Comece registrando 3 hábitos: água, passos e proteína diária.';
    }
    if (mb_strpos($p, 'hipertrofia') !== false || mb_strpos($p, 'ganhar massa') !== false) {
        return 'Para hipertrofia, foque em progressão de carga, sono, proteína suficiente e carboidratos perto do treino. Um desafio bom: 4 treinos por semana + registro de carga em 3 exercícios principais.';
    }
    return "Modo local do Arena Coaching ativo. Base consultada:\n" . $contexto . "\n\nConfigure OPENAI_API_KEY para respostas personalizadas por IA.";
}

function imageDataUrl(array $file): ?string {
    if (empty($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) return null;
    $mime = mime_content_type($file['tmp_name']) ?: 'image/png';
    if (strpos($mime, 'image/') !== 0) return null;
    return 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($file['tmp_name']));
}

function baixarImagemGerada(string $url): ?string {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 60,
    ]);
    $bytes = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);

    if ($bytes === false || $status < 200 || $status >= 300) return null;
    return $bytes;
}

if ($acao === 'chat' || $acao === 'analisar_imagem') {
    coachEnsureUserColumns($pdo);
    $pergunta = trim($_POST['mensagem'] ?? '');
    if (!$pergunta && $acao === 'chat') {
        echo json_encode(['erro' => 'Digite uma pergunta.']);
        exit;
    }

    $contexto = coachContext($pdo, $pergunta);
    $contextoArena = coachArenaUserContext($pdo, $uid);
    $fallbackLocal = localCoachFallback($pergunta, $contexto . "\n\n" . $contextoArena);

    $pLocal = mb_strtolower($pergunta);
    if ($acao === 'chat' && (
        mb_strpos($pLocal, 'postei') !== false ||
        mb_strpos($pLocal, 'meus post') !== false ||
        mb_strpos($pLocal, 'minhas publica') !== false ||
        mb_strpos($pLocal, 'quais comunidades') !== false ||
        mb_strpos($pLocal, 'desafios') !== false
    )) {
        echo json_encode(['ok' => true, 'modo' => 'rag-local', 'resposta' => $fallbackLocal]);
        exit;
    }

    $perfil = $pdo->prepare('SELECT nome, username, bio, esporte_favorito, objetivo, nivel FROM usuarios WHERE id=? LIMIT 1');
    $perfil->execute([$uid]);
    $usuario = $perfil->fetch() ?: [];

    $conteudo = [
        ['type' => 'input_text', 'text' =>
            "Você é o Arena Coaching, assistente de uma rede social esportiva brasileira.\n" .
            "Use o contexto RAG abaixo para dar dicas curtas, práticas e seguras sobre esporte, alimentação e comunidades.\n" .
            "Para falar de posts, use somente os posts do próprio usuário logado. Não invente posts de outras pessoas.\n" .
            "Não faça diagnóstico médico. Quando houver risco, recomende profissional.\n\n" .
            "Perfil: " . json_encode($usuario, JSON_UNESCAPED_UNICODE) . "\n\n" .
            "Contexto RAG geral:\n{$contexto}\n\nContexto da Arena+ e do usuário:\n{$contextoArena}\n\nPergunta: {$pergunta}"
        ],
    ];

    $img = imageDataUrl($_FILES['imagem'] ?? []);
    if ($img) {
        $conteudo[] = ['type' => 'input_image', 'image_url' => $img];
    }

    $model = getenv('OPENAI_TEXT_MODEL') ?: 'gpt-5';
    $res = arenaOpenAiPost('responses', [
        'model' => $model,
        'input' => [
            ['role' => 'user', 'content' => $conteudo],
        ],
    ]);

    if (!$res['ok']) {
        echo json_encode(['ok' => true, 'modo' => 'local', 'resposta' => $fallbackLocal]);
        exit;
    }

    echo json_encode(['ok' => true, 'modo' => 'openai', 'resposta' => arenaOpenAiText($res['data']) ?: $fallbackLocal]);
    exit;
}

if ($acao === 'gerar_imagem') {
    $prompt = trim($_POST['prompt'] ?? '');
    if (!$prompt) {
        echo json_encode(['erro' => 'Digite o prompt da imagem.']);
        exit;
    }

    $modelPrincipal = getenv('OPENAI_IMAGE_MODEL') ?: 'gpt-image-1.5';
    $modelos = array_values(array_unique([$modelPrincipal, 'gpt-image-1', 'dall-e-3']));
    $res = ['ok' => false, 'erro' => 'Não foi possível gerar imagem.'];
    $modeloUsado = $modelPrincipal;

    foreach ($modelos as $model) {
        $payload = [
            'model' => $model,
            'prompt' => 'Arte esportiva para a rede social Arena+, estilo moderno e motivacional: ' . $prompt,
            'size' => '1024x1024',
            'n' => 1,
        ];
        if (strpos($model, 'gpt-image') === 0) {
            $payload['quality'] = 'medium';
        }

        $res = arenaOpenAiPost('images/generations', $payload);
        $modeloUsado = $model;
        if ($res['ok']) break;
    }

    if (!$res['ok']) {
        echo json_encode(['erro' => $res['erro']]);
        exit;
    }

    if (!is_dir('upload')) mkdir('upload', 0755, true);
    $path = 'upload/arena_ai_' . $uid . '_' . time() . '.png';

    $b64 = $res['data']['data'][0]['b64_json'] ?? null;
    $url = $res['data']['data'][0]['url'] ?? null;

    if ($b64) {
        file_put_contents($path, base64_decode($b64));
    } elseif ($url) {
        $bytes = baixarImagemGerada($url);
        if (!$bytes) {
            echo json_encode(['erro' => 'A API retornou URL, mas não consegui baixar a imagem.']);
            exit;
        }
        file_put_contents($path, $bytes);
    } else {
        echo json_encode(['erro' => 'A API não retornou uma imagem válida.']);
        exit;
    }

    echo json_encode(['ok' => true, 'imagem_url' => $path, 'modelo' => $modeloUsado]);
    exit;
}

echo json_encode(['erro' => 'Ação desconhecida.']);
