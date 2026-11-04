package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.LoginRequest;
import br.fatec.arenaplus.dto.LoginResponse;
import br.fatec.arenaplus.dto.UsuarioResponse;
import br.fatec.arenaplus.exception.ErroResponse;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "0. Autenticação", description = "Login com token Bearer. Use o token em 'Authorize' no Swagger.")
public class AuthController {

    private final UsuarioService service;

    public AuthController(UsuarioService service) {
        this.service = service;
    }

    @PostMapping("/login")
    @SecurityRequirements
    @Operation(summary = "Entrar (email e senha)",
            description = "Valida a senha contra o hash BCrypt e devolve um token opaco de sessão (válido por 7 dias). "
                    + "Envie-o nas demais chamadas em `Authorization: Bearer <token>`.")
    @ApiResponse(responseCode = "200", description = "Credenciais válidas")
    @ApiResponse(responseCode = "401", description = "Email ou senha inválidos",
            content = @Content(schema = @Schema(implementation = ErroResponse.class)))
    @ApiResponse(responseCode = "429", description = "Muitas tentativas")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return service.login(req);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Sair (revoga o token atual)")
    public void logout(UsuarioAutenticado atual) {
        service.sair(atual);
    }

    @GetMapping("/eu")
    @Operation(summary = "Usuário autenticado", description = "Devolve o perfil completo de quem está logado pelo token.")
    public UsuarioResponse eu(UsuarioAutenticado atual) {
        return UsuarioResponse.completo(service.obter(atual.id()));
    }
}
