package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.MembroComunidade;
import br.fatec.arenaplus.entity.PapelMembro;

import java.time.LocalDateTime;

public record MembroComunidadeResponse(
        Long id,
        Long usuarioId,
        UsuarioResumo usuario,
        Long comunidadeId,
        String comunidadeNome,
        PapelMembro papel,
        LocalDateTime dataEntrada) {

    public static MembroComunidadeResponse from(MembroComunidade m) {
        return new MembroComunidadeResponse(m.getId(), m.getUsuario().getId(), UsuarioResumo.from(m.getUsuario()),
                m.getComunidade().getId(), m.getComunidade().getNome(), m.getPapel(), m.getDataEntrada());
    }
}
