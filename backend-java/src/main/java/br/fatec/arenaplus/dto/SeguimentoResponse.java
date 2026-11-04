package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.Seguimento;

import java.time.LocalDateTime;

public record SeguimentoResponse(
        Long id,
        Long seguidorId,
        UsuarioResumo seguidor,
        Long seguidoId,
        UsuarioResumo seguido,
        LocalDateTime dataSeguimento) {

    public static SeguimentoResponse from(Seguimento s) {
        return new SeguimentoResponse(s.getId(), s.getSeguidor().getId(), UsuarioResumo.from(s.getSeguidor()),
                s.getSeguido().getId(), UsuarioResumo.from(s.getSeguido()), s.getDataSeguimento());
    }
}
