package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.PaginaResponse;
import br.fatec.arenaplus.dto.PublicacaoRequest;
import br.fatec.arenaplus.dto.PublicacaoResponse;
import br.fatec.arenaplus.dto.PublicacaoUpdateRequest;
import br.fatec.arenaplus.service.PublicacaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/publicacoes")
@Tag(name = "2. Publicações", description = "Feed geral, publicações por usuário/comunidade, edição e exclusão")
public class PublicacaoController {

    private final PublicacaoService service;

    public PublicacaoController(PublicacaoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar publicação",
            description = "comunidadeId opcional (o autor precisa ser membro). Uma mídia opcional; tipoMidia é inferido pela extensão se omitido.")
    @ApiResponse(responseCode = "201", description = "Publicação criada")
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou autor não é membro da comunidade")
    @ApiResponse(responseCode = "404", description = "Usuário ou comunidade inexistente")
    public PublicacaoResponse criar(@Valid @RequestBody PublicacaoRequest req) {
        return service.criar(req);
    }

    @GetMapping
    @Operation(summary = "Listar publicações (feed geral)",
            description = "Filtros opcionais por autor e comunidade. viewerId preenche curtidaPeloUsuario.")
    public PaginaResponse<PublicacaoResponse> listar(
            @Parameter(description = "Filtrar por autor") @RequestParam(required = false) Long usuarioId,
            @Parameter(description = "Filtrar por comunidade") @RequestParam(required = false) Long comunidadeId,
            @Parameter(description = "Usuário que está visualizando") @RequestParam(required = false) Long viewerId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanho) {
        return service.listar(usuarioId, comunidadeId, viewerId,
                Paginas.of(pagina, tamanho, Sort.by(Sort.Direction.DESC, "dataPublicacao", "id")));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar publicação por id")
    @ApiResponse(responseCode = "404", description = "Publicação não encontrada")
    public PublicacaoResponse buscar(@PathVariable Long id, @RequestParam(required = false) Long viewerId) {
        return service.buscar(id, viewerId);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar publicação", description = "Atualiza texto/mídia e registra dataEdicao.")
    public PublicacaoResponse atualizar(@PathVariable Long id, @Valid @RequestBody PublicacaoUpdateRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir publicação", description = "Remove também os comentários e curtidas da publicação.")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
