package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.SessaoToken;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SessaoTokenRepository extends JpaRepository<SessaoToken, Long> {

    @EntityGraph(attributePaths = "usuario")
    Optional<SessaoToken> findByTokenHash(String tokenHash);

    /** Revoga todas as sessões do usuário, exceto a informada (null revoga todas). */
    @Modifying
    @Query("update SessaoToken s set s.revogada = true where s.usuario.id = :usuarioId and (:excetoId is null or s.id <> :excetoId)")
    int revogarDoUsuario(@Param("usuarioId") Long usuarioId, @Param("excetoId") Long excetoId);
}
