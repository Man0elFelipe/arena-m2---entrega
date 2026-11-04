package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Entrar em uma comunidade. O usuário é o autenticado e o papel inicial é sempre MEMBRO.")
public record MembroComunidadeRequest(
        @Schema(example = "1") @NotNull(message = "comunidadeId é obrigatório") Long comunidadeId) {
}
