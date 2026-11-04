package br.fatec.arenaplus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComunidadeUpdateRequest(
        @NotBlank(message = "Nome é obrigatório") @Size(max = 100) String nome,
        @NotBlank(message = "Descrição é obrigatória") @Size(max = 1000) String descricao,
        @NotBlank(message = "Esporte é obrigatório") @Size(max = 60) String esporte,
        @Size(max = 500) String imagemUrl) {
}
