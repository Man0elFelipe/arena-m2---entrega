package br.fatec.arenaplus.repository;
import br.fatec.arenaplus.entity.ParticipacaoEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ParticipacaoEventoRepository extends JpaRepository<ParticipacaoEvento,Long>{boolean existsByEventoIdAndUsuarioId(Long eventoId,Long usuarioId);long countByEventoId(Long eventoId);List<ParticipacaoEvento> findByEventoIdOrderByDataInscricaoAsc(Long eventoId);void deleteByEventoIdAndUsuarioId(Long eventoId,Long usuarioId);}
