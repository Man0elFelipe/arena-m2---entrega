package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record SeguimentoRequest(
        @Schema(example = "1", description = "Usuário que passa a ser seguido (o seguidor é o usuário autenticado)")
        @NotNull(message = "seguidoId é obrigatório") Long seguidoId) {
}
