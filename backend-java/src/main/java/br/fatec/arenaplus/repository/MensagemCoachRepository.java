package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.MensagemCoach;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensagemCoachRepository extends JpaRepository<MensagemCoach, Long> {

    List<MensagemCoach> findTop100ByUsuarioIdOrderByIdDesc(Long usuarioId);

    /** Últimas mensagens enviadas ao modelo como contexto da conversa. */
    List<MensagemCoach> findTop12ByUsuarioIdOrderByIdDesc(Long usuarioId);

    void deleteByUsuarioId(Long usuarioId);
}
