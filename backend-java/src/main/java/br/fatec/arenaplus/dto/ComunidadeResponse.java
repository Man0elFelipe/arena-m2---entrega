package br.fatec.arenaplus.dto;

import java.time.LocalDateTime;

public record ComunidadeResponse(
        Long id,
        String nome,
        String descricao,
        String esporte,
        String imagemUrl,
        Long criadorId,
        String criadorNome,
        LocalDateTime dataCriacao,
        long totalMembros,
        long totalPublicacoes) {
}
