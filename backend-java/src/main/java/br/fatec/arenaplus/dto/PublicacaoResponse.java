package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.TipoMidia;

import java.time.LocalDateTime;

/**
 * Publicação com autor e contadores.
 * curtidaPeloUsuario e salvaPeloUsuario refletem o usuário autenticado.
 */
public record PublicacaoResponse(
        Long id,
        Long usuarioId,
        UsuarioResumo autor,
        Long comunidadeId,
        String comunidadeNome,
        String texto,
        String midiaUrl,
        TipoMidia tipoMidia,
        LocalDateTime dataPublicacao,
        LocalDateTime dataEdicao,
        long totalCurtidas,
        long totalComentarios,
        Boolean curtidaPeloUsuario,
        Boolean salvaPeloUsuario) {
}
