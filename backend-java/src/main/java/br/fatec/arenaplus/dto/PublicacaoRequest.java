package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.TipoMidia;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Nova publicação. O autor é o usuário autenticado. comunidadeId, midiaUrl e tipoMidia são opcionais (no máximo uma mídia). "
        + "Para enviar um arquivo, use POST /api/midias e informe aqui a 'url' devolvida.")
public record PublicacaoRequest(
        @Schema(example = "1", nullable = true) Long comunidadeId,
        @Schema(example = "Treino de hoje: 10 km em 52 minutos!") @NotBlank(message = "Texto é obrigatório") @Size(max = 2000) String texto,
        @Schema(example = "/media/3f2c...jpg", nullable = true) @Size(max = 500) String midiaUrl,
        @Schema(example = "IMAGEM", nullable = true) TipoMidia tipoMidia) {
}
