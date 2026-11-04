package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.MembroComunidadeRequest;
import br.fatec.arenaplus.dto.MembroComunidadeResponse;
import br.fatec.arenaplus.dto.PapelRequest;
import br.fatec.arenaplus.service.MembroComunidadeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membros-comunidade")
@Tag(name = "7. Membros de comunidade", description = "Entrar, sair e listar participantes de comunidades")
public class MembroComunidadeController {

    private final MembroComunidadeService service;

    public MembroComunidadeController(MembroComunidadeService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Entrar em uma comunidade (como usuário autenticado, papel MEMBRO)")
    @ApiResponse(responseCode = "409", description = "Usuário já participa da comunidade")
    public MembroComunidadeResponse entrar(@Valid @RequestBody MembroComunidadeRequest req, UsuarioAutenticado atual) {
        return service.entrar(atual.id(), req);
    }

    @GetMapping
    @Operation(summary = "Listar participações", description = "Por comunidade (membros), por usuário (comunidades dele) ou ambos.")
    public List<MembroComunidadeResponse> listar(@RequestParam(required = false) Long comunidadeId,
                                                 @RequestParam(required = false) Long usuarioId) {
        return service.listar(comunidadeId, usuarioId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar participação por id")
    public MembroComunidadeResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PatchMapping("/{id}/papel")
    @Operation(summary = "Alterar papel (MEMBRO/MODERADOR) — somente moderador da comunidade ou admin")
    public MembroComunidadeResponse alterarPapel(@PathVariable Long id, @Valid @RequestBody PapelRequest req, UsuarioAutenticado atual) {
        return service.alterarPapel(id, req.papel(), atual);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remover participação pelo id (o próprio membro, moderador ou admin)")
    public void sair(@PathVariable Long id, UsuarioAutenticado atual) {
        service.sair(id, atual);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Sair de uma comunidade (a minha participação)")
    public void sairDaComunidade(@RequestParam Long comunidadeId, UsuarioAutenticado atual) {
        service.sair(atual.id(), comunidadeId);
    }
}
