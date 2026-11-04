package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record CurtidaRequest(
        @Schema(example = "1") @NotNull(message = "publicacaoId é obrigatório") Long publicacaoId) {
}
