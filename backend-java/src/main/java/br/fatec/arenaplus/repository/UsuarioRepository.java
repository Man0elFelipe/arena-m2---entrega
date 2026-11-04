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
                   or lower(function('TRANSLATE', u.cidade, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :busca, '%'))
              and (:esporte is null
                   or lower(function('TRANSLATE', u.esportePrincipal, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :esporte, '%')
                   or lower(function('TRANSLATE', coalesce(u.modalidadesFavoritas, ''), :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :esporte, '%'))
              and (:cidade is null or lower(function('TRANSLATE', u.cidade, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :cidade, '%'))
            """)
    Page<Usuario> buscar(@Param("busca") String busca, @Param("esporte") String esporte, @Param("cidade") String cidade,
                         @Param("incluirInativos") boolean incluirInativos, Pageable pageable);

    /** Parceiros esportivos: apenas contas ativas que consentiram em aparecer. */
    @Query("""
            select u from Usuario u
            where u.ativo = true and u.procuraParceiros = true and u.id <> :eu
              and (:modalidade is null
                   or lower(function('TRANSLATE', u.esportePrincipal, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :modalidade, '%')
                   or lower(function('TRANSLATE', coalesce(u.modalidadesFavoritas, ''), :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :modalidade, '%'))
              and (:cidade is null or lower(function('TRANSLATE', u.cidade, :#{T(br.fatec.arenaplus.repository.Busca).COM_ACENTO}, :#{T(br.fatec.arenaplus.repository.Busca).SEM_ACENTO})) like concat('%', :cidade, '%'))
              and (:nivel is null or u.nivelExperiencia = :nivel)
            """)
    Page<Usuario> buscarParceiros(@Param("modalidade") String modalidade, @Param("cidade") String cidade,
                                  @Param("nivel") br.fatec.arenaplus.entity.NivelExperiencia nivel,
                                  @Param("eu") Long eu, Pageable pageable);
}
