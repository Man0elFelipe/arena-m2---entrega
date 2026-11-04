package br.fatec.arenaplus.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Inicia (ou recupera) a conversa privada entre o usuário autenticado e o usuário informado.")
public record ConversaRequest(@Schema(example = "2") @NotNull(message = "usuarioId é obrigatório") Long usuarioId) {
}
