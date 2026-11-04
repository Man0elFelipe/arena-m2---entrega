package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.Seguimento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeguimentoRepository extends JpaRepository<Seguimento, Long> {

    boolean existsBySeguidorIdAndSeguidoId(Long seguidorId, Long seguidoId);

    Optional<Seguimento> findBySeguidorIdAndSeguidoId(Long seguidorId, Long seguidoId);

    /** Quem segue o usuário informado. */
    List<Seguimento> findBySeguidoIdOrderByDataSeguimentoDesc(Long seguidoId);

    /** Quem o usuário informado segue. */
    List<Seguimento> findBySeguidorIdOrderByDataSeguimentoDesc(Long seguidorId);

    long countBySeguidoId(Long seguidoId);

    long countBySeguidorId(Long seguidorId);
}
