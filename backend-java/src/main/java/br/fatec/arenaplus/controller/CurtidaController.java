package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.ContagemResponse;
import br.fatec.arenaplus.dto.CurtidaRequest;
import br.fatec.arenaplus.dto.CurtidaResponse;
import br.fatec.arenaplus.service.CurtidaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/curtidas")
@Tag(name = "4. Curtidas", description = "Curtir e descurtir publicações (uma curtida por usuário/publicação)")
public class CurtidaController {

    private final CurtidaService service;

    public CurtidaController(CurtidaService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Curtir publicação")
    @ApiResponse(responseCode = "409", description = "Usuário já curtiu esta publicação")
    public CurtidaResponse curtir(@Valid @RequestBody CurtidaRequest req) {
        return service.curtir(req);
    }

    @GetMapping
    @Operation(summary = "Listar curtidas de uma publicação")
    public List<CurtidaResponse> listar(@RequestParam Long publicacaoId) {
        return service.listarPorPublicacao(publicacaoId);
    }

    @GetMapping("/contagem")
    @Operation(summary = "Contar curtidas de uma publicação")
    public ContagemResponse contar(@RequestParam Long publicacaoId) {
        return service.contar(publicacaoId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remover curtida pelo id")
    public void remover(@PathVariable Long id) {
        service.remover(id);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Descurtir pelo par usuário/publicação")
    public void descurtir(@RequestParam Long usuarioId, @RequestParam Long publicacaoId) {
        service.descurtir(usuarioId, publicacaoId);
    }
}
