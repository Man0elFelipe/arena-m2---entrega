package br.fatec.arenaplus.dto;

import java.time.LocalDateTime;

/** Conversa vista por um dos participantes: o "outro" é sempre o interlocutor. */
public record ConversaResponse(Long id, UsuarioResumo outro, MensagemResponse ultimaMensagem, long naoLidas, LocalDateTime ultimaAtividade) {
}
