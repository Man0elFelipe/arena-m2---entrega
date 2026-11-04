package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para cadastro de usuário. A senha é convertida em hash BCrypt e nunca é devolvida.")
public record UsuarioCreateRequest(
        @Schema(example = "Ana Souza") @NotBlank(message = "Nome é obrigatório") @Size(max = 100) String nome,
        @Schema(example = "ana@arenaplus.dev") @NotBlank(message = "Email é obrigatório") @Email(message = "Email inválido") @Size(max = 150) String email,
        @Schema(example = "senha123") @NotBlank(message = "Senha é obrigatória") @Size(min = 6, max = 72, message = "Senha deve ter entre 6 e 72 caracteres") String senha,
        @Schema(example = "img/avatar-padrao.jpeg") @Size(max = 500) String fotoPerfilUrl,
        @Schema(example = "Corredora amadora, treino para minha primeira meia maratona.") @Size(max = 500) String biografia,
        @Schema(example = "São Paulo") @Size(max = 100) String cidade,
        @Schema(example = "Corrida") @Size(max = 60) String esportePrincipal) {
}
