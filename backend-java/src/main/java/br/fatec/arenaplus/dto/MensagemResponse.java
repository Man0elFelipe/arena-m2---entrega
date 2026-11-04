package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.Mensagem;

import java.time.LocalDateTime;

public record MensagemResponse(Long id, Long conversaId, Long remetenteId, String texto, LocalDateTime enviadaEm, boolean lida) {

    public static MensagemResponse from(Mensagem m) {
        return new MensagemResponse(m.getId(), m.getConversa().getId(), m.getRemetente().getId(), m.getTexto(),
                m.getEnviadaEm(), Boolean.TRUE.equals(m.getLida()));
    }
}
