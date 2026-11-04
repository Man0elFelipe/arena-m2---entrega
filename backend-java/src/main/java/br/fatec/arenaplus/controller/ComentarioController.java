package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.ComentarioRequest;
import br.fatec.arenaplus.dto.ComentarioResponse;
import br.fatec.arenaplus.dto.ComentarioUpdateRequest;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.service.ComentarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comentarios")
@Tag(name = "3. Comentários", description = "Comentários em publicações")
public class ComentarioController {

    private final ComentarioService service;

    public ComentarioController(ComentarioService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Comentar em uma publicação (como usuário autenticado)")
    public ComentarioResponse comentar(@Valid @RequestBody ComentarioRequest req, UsuarioAutenticado atual) {
        return service.comentar(atual.id(), req);
    }

    @GetMapping
    @Operation(summary = "Listar comentários de uma publicação", description = "Ordem cronológica.")
    public List<ComentarioResponse> listar(@RequestParam Long publicacaoId) {
        return service.listarPorPublicacao(publicacaoId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar comentário por id")
    public ComentarioResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar comentário (somente o autor)")
    public ComentarioResponse atualizar(@PathVariable Long id, @Valid @RequestBody ComentarioUpdateRequest req, UsuarioAutenticado atual) {
        return service.atualizar(id, req, atual);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir comentário (autor, dono da publicação ou admin)")
    public void excluir(@PathVariable Long id, UsuarioAutenticado atual) {
        service.excluir(id, atual);
    }
}
