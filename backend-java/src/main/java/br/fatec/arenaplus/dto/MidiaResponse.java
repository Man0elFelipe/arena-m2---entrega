package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.TipoMidia;

public record MidiaResponse(Long id, String url, TipoMidia tipoMidia, String contentType, long tamanhoBytes) {
}
