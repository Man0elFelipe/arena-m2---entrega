package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Nova comunidade. O criador é o usuário autenticado e entra automaticamente como MODERADOR.")
public record ComunidadeRequest(
        @Schema(example = "Corredores de Rua SP") @NotBlank(message = "Nome é obrigatório") @Size(max = 100) String nome,
        @Schema(example = "Grupo para combinar treinos e provas de corrida em São Paulo.") @NotBlank(message = "Descrição é obrigatória") @Size(max = 1000) String descricao,
        @Schema(example = "Corrida") @NotBlank(message = "Esporte é obrigatório") @Size(max = 60) String esporte,
        @Schema(example = "img/corrida.jpeg", nullable = true) @Size(max = 500) String imagemUrl) {
}
