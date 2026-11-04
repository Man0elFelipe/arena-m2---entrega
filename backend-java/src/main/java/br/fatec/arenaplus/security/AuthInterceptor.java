package br.fatec.arenaplus.security;

import br.fatec.arenaplus.exception.NaoAutenticadoException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Protege toda a API em /api/**: exige "Authorization: Bearer &lt;token&gt;" e aplica limites de requisição.
 * Rotas públicas: login e cadastro (com limite mais rígido por IP).
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String ATRIBUTO = "arenaplus.usuarioAutenticado";

    private final TokenService tokens;
    private final LimiteRequisicoes limites;
    private final int limiteGeral;
    private final int limiteAuth;

    public AuthInterceptor(TokenService tokens, LimiteRequisicoes limites,
                           @Value("${arenaplus.rate-limit.geral-por-minuto:600}") int limiteGeral,
                           @Value("${arenaplus.rate-limit.auth-por-minuto:20}") int limiteAuth) {
        this.tokens = tokens;
        this.limites = limites;
        this.limiteGeral = limiteGeral;
        this.limiteAuth = limiteAuth;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if ("OPTIONS".equals(req.getMethod())) return true; // preflight CORS
        String ip = req.getRemoteAddr();
        String path = req.getRequestURI();
        boolean publica = ("POST".equals(req.getMethod()) && (path.equals("/api/auth/login") || path.equals("/api/usuarios")));
        if (publica) {
            limites.registrar("auth:" + ip, limiteAuth, 60);
            return true;
        }
        limites.registrar("geral:" + ip, limiteGeral, 60);
        String cab = req.getHeader("Authorization");
        String token = cab != null && cab.regionMatches(true, 0, "Bearer ", 0, 7) ? cab.substring(7).trim() : null;
        UsuarioAutenticado u = tokens.validar(token).orElseThrow(NaoAutenticadoException::new);
        req.setAttribute(ATRIBUTO, u);
        return true;
    }
}
