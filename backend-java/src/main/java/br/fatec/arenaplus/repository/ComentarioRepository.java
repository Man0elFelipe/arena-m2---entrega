package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.Comentario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ComentarioRepository extends JpaRepository<Comentario, Long> {

    List<Comentario> findByPublicacaoIdOrderByDataComentarioAsc(Long publicacaoId);

    long countByPublicacaoId(Long publicacaoId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Comentario c where c.publicacao.id = :publicacaoId")
    int deleteByPublicacaoId(@Param("publicacaoId") Long publicacaoId);
}
