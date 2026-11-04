package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.Curtida;

import java.time.LocalDateTime;

public record CurtidaResponse(Long id, Long usuarioId, String usuarioNome, Long publicacaoId, LocalDateTime dataCurtida) {

    public static CurtidaResponse from(Curtida c) {
        return new CurtidaResponse(c.getId(), c.getUsuario().getId(), c.getUsuario().getNome(),
                c.getPublicacao().getId(), c.getDataCurtida());
    }
}
