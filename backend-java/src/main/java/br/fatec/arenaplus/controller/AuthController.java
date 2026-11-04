package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.LoginRequest;
import br.fatec.arenaplus.dto.UsuarioResponse;
import br.fatec.arenaplus.exception.ErroResponse;
import br.fatec.arenaplus.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "0. Autenticação", description = "Verificação de credenciais (demonstração acadêmica, sem token/sessão)")
public class AuthController {

    private final UsuarioService service;

    public AuthController(UsuarioService service) {
        this.service = service;
    }

    @PostMapping("/login")
    @Operation(summary = "Validar email e senha",
            description = "Compara a senha com o hash BCrypt e devolve o usuário (sem hash). Não emite token: "
                    + "o frontend guarda apenas o id do usuário. Não é autenticação de produção.")
    @ApiResponse(responseCode = "200", description = "Credenciais válidas")
    @ApiResponse(responseCode = "401", description = "Email ou senha inválidos",
            content = @Content(schema = @Schema(implementation = ErroResponse.class)))
    public UsuarioResponse login(@Valid @RequestBody LoginRequest req) {
        return service.autenticar(req);
    }
}
