package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.PaginaResponse;
import br.fatec.arenaplus.dto.PublicacaoResponse;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.service.SalvosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/salvos")
@Tag(name = "9. Publicações salvas", description = "Coleção privada: cada usuário só acessa os próprios salvos")
public class SalvosController {

    private final SalvosService service;

    public SalvosController(SalvosService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Minhas publicações salvas", description = "Somente os salvos do usuário autenticado, mais recentes primeiro.")
    public PaginaResponse<PublicacaoResponse> listar(@RequestParam(defaultValue = "0") int pagina,
                                                     @RequestParam(defaultValue = "10") int tamanho,
                                                     UsuarioAutenticado atual) {
        return service.listar(atual.id(), PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), Paginas.TAMANHO_MAXIMO)));
    }

    @PostMapping("/{publicacaoId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Salvar publicação")
    @ApiResponse(responseCode = "409", description = "Já salva")
    public PublicacaoResponse salvar(@PathVariable Long publicacaoId, UsuarioAutenticado atual) {
        return service.salvar(atual.id(), publicacaoId);
    }

    @DeleteMapping("/{publicacaoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remover dos salvos")
    public void remover(@PathVariable Long publicacaoId, UsuarioAutenticado atual) {
        service.remover(atual.id(), publicacaoId);
    }
}
