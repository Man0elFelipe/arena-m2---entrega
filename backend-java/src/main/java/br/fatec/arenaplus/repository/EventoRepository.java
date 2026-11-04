package br.fatec.arenaplus.repository;
import br.fatec.arenaplus.entity.Evento;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
public interface EventoRepository extends JpaRepository<Evento,Long> {
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select e from Evento e where e.id=:id") java.util.Optional<Evento> obterComBloqueio(@Param("id") Long id);
 @Query("select e from Evento e where (:modalidade is null or lower(e.modalidade)=lower(:modalidade)) and (:cidade is null or lower(e.cidade)=lower(:cidade)) and (:busca is null or lower(e.titulo) like lower(concat('%',:busca,'%')) or lower(e.descricao) like lower(concat('%',:busca,'%'))) and (:estado is null or e.estado=:estado)") Page<Evento> filtrar(@Param("modalidade") String modalidade,@Param("cidade") String cidade,@Param("busca") String busca,@Param("estado") Evento.Estado estado,Pageable pageable);
}
