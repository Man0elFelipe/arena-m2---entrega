package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.Comunidade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComunidadeRepository extends JpaRepository<Comunidade, Long> {

    @Query("""
            select c from Comunidade c
            where (:esporte is null or lower(function('TRANSLATE', c.esporte, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) = :esporte)
              and (:busca is null
                   or lower(function('TRANSLATE', c.nome, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :busca, '%')
                   or lower(function('TRANSLATE', c.descricao, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :busca, '%'))
            """)
    Page<Comunidade> buscar(@Param("busca") String busca, @Param("esporte") String esporte, Pageable pageable);
}
