package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record SeguimentoRequest(
        @Schema(example = "2", description = "Usuário que começa a seguir") @NotNull(message = "seguidorId é obrigatório") Long seguidorId,
        @Schema(example = "1", description = "Usuário que passa a ser seguido") @NotNull(message = "seguidoId é obrigatório") Long seguidoId) {
}
