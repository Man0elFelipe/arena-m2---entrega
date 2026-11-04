package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.PapelMembro;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record MembroComunidadeRequest(
        @Schema(example = "2") @NotNull(message = "usuarioId é obrigatório") Long usuarioId,
        @Schema(example = "1") @NotNull(message = "comunidadeId é obrigatório") Long comunidadeId,
        @Schema(example = "MEMBRO", description = "Opcional; padrão MEMBRO", nullable = true) PapelMembro papel) {
}
