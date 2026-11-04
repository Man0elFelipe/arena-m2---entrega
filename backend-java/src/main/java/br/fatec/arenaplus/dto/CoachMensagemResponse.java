package br.fatec.arenaplus.dto;
import br.fatec.arenaplus.entity.MensagemCoach;
import java.time.LocalDateTime;
public record CoachMensagemResponse(Long id, String papel, String texto, LocalDateTime data) {
 public static CoachMensagemResponse from(MensagemCoach m){return new CoachMensagemResponse(m.getId(),m.getPapel().name(),m.getTexto(),m.getData());}
}
