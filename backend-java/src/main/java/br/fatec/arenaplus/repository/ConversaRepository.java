package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.Conversa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversaRepository extends JpaRepository<Conversa, Long> {

    Optional<Conversa> findByUsuarioAIdAndUsuarioBId(Long usuarioAId, Long usuarioBId);

    @Query("select c from Conversa c where c.usuarioA.id = :u or c.usuarioB.id = :u order by c.ultimaAtividade desc")
    List<Conversa> doUsuario(@Param("u") Long usuarioId);
}
