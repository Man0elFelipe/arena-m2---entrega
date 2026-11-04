package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.SeguimentoRequest;
import br.fatec.arenaplus.dto.SeguimentoResponse;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.service.SeguimentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seguimentos")
@Tag(name = "5. Seguimentos", description = "Seguir e deixar de seguir usuários")
public class SeguimentoController {

    private final SeguimentoService service;

    public SeguimentoController(SeguimentoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Seguir usuário (o seguidor é o usuário autenticado)")
    @ApiResponse(responseCode = "400", description = "Tentativa de seguir a si mesmo")
    @ApiResponse(responseCode = "409", description = "Seguimento já existe")
    public SeguimentoResponse seguir(@Valid @RequestBody SeguimentoRequest req, UsuarioAutenticado atual) {
        return service.seguir(atual.id(), req);
    }

    @GetMapping("/seguidores/{usuarioId}")
    @Operation(summary = "Listar seguidores de um usuário")
    public List<SeguimentoResponse> seguidores(@PathVariable Long usuarioId) {
        return service.seguidores(usuarioId);
    }

    @GetMapping("/seguindo/{usuarioId}")
    @Operation(summary = "Listar quem o usuário segue")
    public List<SeguimentoResponse> seguindo(@PathVariable Long usuarioId) {
        return service.seguindo(usuarioId);
    }

    @GetMapping("/verificar")
    @Operation(summary = "Verificar se eu sigo o usuário informado")
    public Map<String, Boolean> verificar(@RequestParam Long seguidoId, UsuarioAutenticado atual) {
        return Map.of("segue", service.segue(atual.id(), seguidoId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar seguimento por id")
    public SeguimentoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remover seguimento pelo id (seguidor ou admin)")
    public void remover(@PathVariable Long id, UsuarioAutenticado atual) {
        service.remover(id, atual);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Deixar de seguir um usuário")
    public void deixarDeSeguir(@RequestParam Long seguidoId, UsuarioAutenticado atual) {
        service.deixarDeSeguir(atual.id(), seguidoId);
    }
}
