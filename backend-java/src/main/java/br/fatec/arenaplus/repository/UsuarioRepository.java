package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    @Query("""
            select u from Usuario u
            where (:incluirInativos = true or u.ativo = true)
              and (:busca is null
                   or lower(function('TRANSLATE', u.nome, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :busca, '%')
                   or lower(function('TRANSLATE', u.esportePrincipal, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :busca, '%')
                   or lower(function('TRANSLATE', u.cidade, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :busca, '%'))
            """)
    Page<Usuario> buscar(@Param("busca") String busca, @Param("incluirInativos") boolean incluirInativos, Pageable pageable);
}
