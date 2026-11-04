package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MensagemRequest(@Schema(example = "Bora treinar sábado?") @NotBlank(message = "Mensagem não pode ficar vazia") @Size(max = 2000, message = "Mensagem muito longa (máx. 2000 caracteres)") String texto) {
}
