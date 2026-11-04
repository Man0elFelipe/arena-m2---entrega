package br.fatec.arenaplus.security;

import br.fatec.arenaplus.entity.SessaoToken;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.repository.SessaoTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/** Emite, valida e revoga tokens opacos de sessão. Só o hash SHA-256 do token é persistido. */
@Service
public class TokenService {

    public record TokenEmitido(String token, LocalDateTime expiraEm) {
    }

    private final SessaoTokenRepository sessoes;
    private final long validadeDias;
    private final SecureRandom random = new SecureRandom();

    public TokenService(SessaoTokenRepository sessoes, @Value("${arenaplus.auth.token-dias:7}") long validadeDias) {
        this.sessoes = sessoes;
        this.validadeDias = validadeDias;
    }

    @Transactional
    public TokenEmitido emitir(Usuario usuario) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        SessaoToken s = new SessaoToken();
        s.setTokenHash(hash(token));
        s.setUsuario(usuario);
        s.setExpiraEm(LocalDateTime.now().plusDays(validadeDias));
        sessoes.save(s);
        return new TokenEmitido(token, s.getExpiraEm());
    }

    @Transactional(readOnly = true)
    public Optional<UsuarioAutenticado> validar(String token) {
        if (token == null || token.isBlank() || token.length() > 100) return Optional.empty();
        return sessoes.findByTokenHash(hash(token))
                .filter(s -> !Boolean.TRUE.equals(s.getRevogada()))
                .filter(s -> s.getExpiraEm().isAfter(LocalDateTime.now()))
                .filter(s -> Boolean.TRUE.equals(s.getUsuario().getAtivo()))
                .map(s -> new UsuarioAutenticado(s.getUsuario().getId(), s.getUsuario().getNome(),
                        s.getUsuario().getTipoPerfil(), s.getId()));
    }

    @Transactional
    public void revogar(Long sessaoId) {
        sessoes.findById(sessaoId).ifPresent(s -> s.setRevogada(true));
    }

    @Transactional
    public void revogarOutras(Long usuarioId, Long sessaoAtualId) {
        sessoes.revogarDoUsuario(usuarioId, sessaoAtualId);
    }

    static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
