package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.MembroComunidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MembroComunidadeRepository extends JpaRepository<MembroComunidade, Long> {

    boolean existsByUsuarioIdAndComunidadeId(Long usuarioId, Long comunidadeId);

    Optional<MembroComunidade> findByUsuarioIdAndComunidadeId(Long usuarioId, Long comunidadeId);

    List<MembroComunidade> findByComunidadeIdOrderByDataEntradaAsc(Long comunidadeId);

    List<MembroComunidade> findByUsuarioIdOrderByDataEntradaDesc(Long usuarioId);

    long countByComunidadeId(Long comunidadeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from MembroComunidade m where m.comunidade.id = :comunidadeId")
    int deleteByComunidadeId(@Param("comunidadeId") Long comunidadeId);
}
