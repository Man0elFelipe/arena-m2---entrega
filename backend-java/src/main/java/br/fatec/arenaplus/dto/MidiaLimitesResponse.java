package br.fatec.arenaplus.dto;

import java.util.List;

/** Limites e formatos aceitos no upload (configuráveis por variável de ambiente). O frontend valida com estes valores. */
public record MidiaLimitesResponse(
        long imagemMaxMb,
        long videoMaxMb,
        List<String> tiposImagem,
        List<String> tiposVideo,
        List<String> extensoesImagem,
        List<String> extensoesVideo) {
}
