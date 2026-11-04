package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ComentarioRequest(
        @Schema(example = "1") @NotNull(message = "publicacaoId é obrigatório") Long publicacaoId,
        @Schema(example = "Mandou bem! Bora treinar juntos?") @NotBlank(message = "Texto é obrigatório") @Size(max = 1000) String texto) {
}
