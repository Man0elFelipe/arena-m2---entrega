package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.Publicacao;
import br.fatec.arenaplus.entity.PublicacaoSalva;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PublicacaoSalvaRepository extends JpaRepository<PublicacaoSalva, Long> {

    boolean existsByUsuarioIdAndPublicacaoId(Long usuarioId, Long publicacaoId);

    Optional<PublicacaoSalva> findByUsuarioIdAndPublicacaoId(Long usuarioId, Long publicacaoId);

    @Query(value = "select s.publicacao from PublicacaoSalva s where s.usuario.id = :usuarioId and s.publicacao.usuario.ativo = true order by s.dataSalva desc",
            countQuery = "select count(s) from PublicacaoSalva s where s.usuario.id = :usuarioId and s.publicacao.usuario.ativo = true")
    Page<Publicacao> publicacoesSalvas(@Param("usuarioId") Long usuarioId, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from PublicacaoSalva s where s.publicacao.id = :publicacaoId")
    int deleteByPublicacaoId(@Param("publicacaoId") Long publicacaoId);
}
