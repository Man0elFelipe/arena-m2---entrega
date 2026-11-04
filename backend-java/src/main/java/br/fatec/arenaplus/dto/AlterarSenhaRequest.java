package br.fatec.arenaplus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlterarSenhaRequest(
        @NotBlank(message = "Senha atual é obrigatória") String senhaAtual,
        @NotBlank(message = "Nova senha é obrigatória") @Size(min = 6, max = 72, message = "Nova senha deve ter entre 6 e 72 caracteres") String novaSenha) {
}
