package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.TipoMidia;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Nova publicação. comunidadeId, midiaUrl e tipoMidia são opcionais (no máximo uma mídia).")
public record PublicacaoRequest(
        @Schema(example = "1") @NotNull(message = "usuarioId é obrigatório") Long usuarioId,
        @Schema(example = "1", nullable = true) Long comunidadeId,
        @Schema(example = "Treino de hoje: 10 km em 52 minutos!") @NotBlank(message = "Texto é obrigatório") @Size(max = 2000) String texto,
        @Schema(example = "img/corrida.jpeg", nullable = true) @Size(max = 500) String midiaUrl,
        @Schema(example = "IMAGEM", nullable = true) TipoMidia tipoMidia) {
}
