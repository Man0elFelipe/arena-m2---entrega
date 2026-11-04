package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComentarioUpdateRequest(
        @Schema(example = "Mandou muito bem!") @NotBlank(message = "Texto é obrigatório") @Size(max = 1000) String texto) {
}
