<?php
// ============================================================
// Arena+ | Cliente simples da OpenAI para uso no backend PHP
// Mantem a chave fora do navegador. Configure OPENAI_API_KEY.
// ============================================================
require_once __DIR__ . '/env_loader.php';

arenaLoadEnv();

function arenaOpenAiKey(): string {
    $key = getenv('OPENAI_API_KEY');
    if (!$key && defined('OPENAI_API_KEY')) {
        $key = OPENAI_API_KEY;
    }
    return trim((string) $key);
}

function arenaOpenAiPost(string $endpoint, array $payload): array {
    $key = arenaOpenAiKey();
    if (!$key) {
        return ['ok' => false, 'erro' => 'OPENAI_API_KEY não configurada.'];
    }

    $ch = curl_init('https://api.openai.com/v1/' . ltrim($endpoint, '/'));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 60,
    ]);

    $raw = @curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);

    if ($raw === false) {
        return ['ok' => false, 'erro' => $err ?: 'Falha ao conectar com a OpenAI.'];
    }

    $data = json_decode($raw, true);
    if ($status < 200 || $status >= 300) {
        $msg = $data['error']['message'] ?? 'Erro na API OpenAI.';
        return ['ok' => false, 'erro' => $msg, 'status' => $status];
    }

    return ['ok' => true, 'data' => $data];
}

function arenaOpenAiText(array $response): string {
    if (!empty($response['output_text'])) {
        return trim($response['output_text']);
    }
    foreach (($response['output'] ?? []) as $item) {
        foreach (($item['content'] ?? []) as $content) {
            if (($content['type'] ?? '') === 'output_text' && isset($content['text'])) {
                return trim($content['text']);
            }
        }
    }
    return '';
}
