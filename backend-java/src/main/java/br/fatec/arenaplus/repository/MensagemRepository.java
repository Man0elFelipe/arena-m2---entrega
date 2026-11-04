package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.Mensagem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    Optional<Mensagem> findFirstByConversaIdOrderByIdDesc(Long conversaId);

    /** Últimas mensagens (mais recentes primeiro) — usado para abrir a conversa. */
    List<Mensagem> findByConversaIdOrderByIdDesc(Long conversaId, Pageable pageable);

    /** Mensagens novas depois de um id (atualização periódica). */
    List<Mensagem> findByConversaIdAndIdGreaterThanOrderByIdAsc(Long conversaId, Long apos, Pageable pageable);

    @Query("select count(m) from Mensagem m where m.conversa.id = :conversaId and m.remetente.id <> :usuarioId and m.lida = false")
    long naoLidasNaConversa(@Param("conversaId") Long conversaId, @Param("usuarioId") Long usuarioId);

    @Query("""
            select count(m) from Mensagem m
            where m.lida = false and m.remetente.id <> :usuarioId
              and (m.conversa.usuarioA.id = :usuarioId or m.conversa.usuarioB.id = :usuarioId)
            """)
    long totalNaoLidas(@Param("usuarioId") Long usuarioId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Mensagem m set m.lida = true where m.conversa.id = :conversaId and m.remetente.id <> :usuarioId and m.lida = false")
    int marcarComoLidas(@Param("conversaId") Long conversaId, @Param("usuarioId") Long usuarioId);
}
