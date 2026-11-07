package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @Schema(description = "Email cadastrado") @NotBlank(message = "Email é obrigatório") @Email(message = "Email inválido") String email,
        @Schema(description = "Senha da conta") @NotBlank(message = "Senha é obrigatória") String senha) {
}
