package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Atualização de perfil. Email, senha e tipo de perfil não são alterados por aqui.")
public record UsuarioUpdateRequest(
        @Schema(example = "Ana Souza") @NotBlank(message = "Nome é obrigatório") @Size(max = 100) String nome,
        @Size(max = 500) String fotoPerfilUrl,
        @Schema(example = "Agora treinando para maratona!") @Size(max = 500) String biografia,
        @Schema(example = "Campinas") @Size(max = 100) String cidade,
        @Schema(example = "Corrida") @Size(max = 60) String esportePrincipal) {
}
