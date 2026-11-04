package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.Curtida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CurtidaRepository extends JpaRepository<Curtida, Long> {

    boolean existsByUsuarioIdAndPublicacaoId(Long usuarioId, Long publicacaoId);

    Optional<Curtida> findByUsuarioIdAndPublicacaoId(Long usuarioId, Long publicacaoId);

    List<Curtida> findByPublicacaoIdOrderByDataCurtidaDesc(Long publicacaoId);

    long countByPublicacaoId(Long publicacaoId);

    @Modifying
    @Query("delete from Curtida c where c.publicacao.id = :publicacaoId")
    int deleteByPublicacaoId(@Param("publicacaoId") Long publicacaoId);
}
