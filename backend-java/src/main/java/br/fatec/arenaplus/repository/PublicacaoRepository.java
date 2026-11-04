package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.Publicacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PublicacaoRepository extends JpaRepository<Publicacao, Long> {

    @Query("""
            select p from Publicacao p
            where p.usuario.ativo = true
              and (:usuarioId is null or p.usuario.id = :usuarioId)
              and (:comunidadeId is null or p.comunidade.id = :comunidadeId)
            """)
    Page<Publicacao> buscar(@Param("usuarioId") Long usuarioId, @Param("comunidadeId") Long comunidadeId, Pageable pageable);

    /** Feed personalizado: publicações do próprio usuário e de quem ele segue. */
    @Query("""
            select p from Publicacao p
            where p.usuario.ativo = true
              and (p.usuario.id = :usuarioId
                   or p.usuario.id in (select s.seguido.id from Seguimento s where s.seguidor.id = :usuarioId))
            """)
    Page<Publicacao> feedDoUsuario(@Param("usuarioId") Long usuarioId, Pageable pageable);

    long countByUsuarioId(Long usuarioId);

    boolean existsByMidiaUrl(String midiaUrl);

    long countByComunidadeId(Long comunidadeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Publicacao p set p.comunidade = null where p.comunidade.id = :comunidadeId")
    int desvincularDaComunidade(@Param("comunidadeId") Long comunidadeId);
}
