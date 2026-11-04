package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.Comentario;

import java.time.LocalDateTime;

public record ComentarioResponse(
        Long id,
        Long usuarioId,
        UsuarioResumo autor,
        Long publicacaoId,
        String texto,
        LocalDateTime dataComentario) {

    public static ComentarioResponse from(Comentario c) {
        return new ComentarioResponse(c.getId(), c.getUsuario().getId(), UsuarioResumo.from(c.getUsuario()),
                c.getPublicacao().getId(), c.getTexto(), c.getDataComentario());
    }
}
