package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.ComunidadeRequest;
import br.fatec.arenaplus.dto.ComunidadeResponse;
import br.fatec.arenaplus.dto.ComunidadeUpdateRequest;
import br.fatec.arenaplus.dto.PaginaResponse;
import br.fatec.arenaplus.service.ComunidadeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comunidades")
@Tag(name = "6. Comunidades", description = "Comunidades esportivas")
public class ComunidadeController {

    private final ComunidadeService service;

    public ComunidadeController(ComunidadeService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar comunidade", description = "O criador entra automaticamente como MODERADOR.")
    public ComunidadeResponse criar(@Valid @RequestBody ComunidadeRequest req, UsuarioAutenticado atual) {
        return service.criar(atual.id(), req);
    }

    @GetMapping
    @Operation(summary = "Listar comunidades", description = "Busca opcional por nome/descrição e filtro por esporte.")
    public PaginaResponse<ComunidadeResponse> listar(@RequestParam(required = false) String busca,
                                                     @RequestParam(required = false) String esporte,
                                                     @RequestParam(defaultValue = "0") int pagina,
                                                     @RequestParam(defaultValue = "20") int tamanho) {
        return service.listar(busca, esporte, Paginas.of(pagina, tamanho, Sort.by("nome")));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar comunidade por id")
    public ComunidadeResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar comunidade (moderador ou admin)")
    public ComunidadeResponse atualizar(@PathVariable Long id, @Valid @RequestBody ComunidadeUpdateRequest req, UsuarioAutenticado atual) {
        return service.atualizar(id, req, atual);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir comunidade (moderador ou admin)",
            description = "Remove os vínculos de membros. Publicações são preservadas e desvinculadas (comunidadeId = null).")
    public void excluir(@PathVariable Long id, UsuarioAutenticado atual) {
        service.excluir(id, atual);
    }
}
