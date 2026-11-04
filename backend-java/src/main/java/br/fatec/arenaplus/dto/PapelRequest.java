package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.PapelMembro;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record PapelRequest(@Schema(example = "MODERADOR") @NotNull(message = "papel é obrigatório") PapelMembro papel) {
}
