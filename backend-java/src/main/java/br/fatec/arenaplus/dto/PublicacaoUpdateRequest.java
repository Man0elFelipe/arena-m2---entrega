package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.TipoMidia;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Edição de publicação: atualiza texto e mídia e registra dataEdicao.")
public record PublicacaoUpdateRequest(
        @Schema(example = "Treino de hoje: 10 km em 50 minutos (corrigido)!") @NotBlank(message = "Texto é obrigatório") @Size(max = 2000) String texto,
        @Size(max = 500) String midiaUrl,
        TipoMidia tipoMidia) {
}
