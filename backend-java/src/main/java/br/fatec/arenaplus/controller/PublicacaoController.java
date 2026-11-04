package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.PaginaResponse;
import br.fatec.arenaplus.dto.PublicacaoRequest;
import br.fatec.arenaplus.dto.PublicacaoResponse;
import br.fatec.arenaplus.dto.PublicacaoUpdateRequest;
import br.fatec.arenaplus.security.UsuarioAutenticado;
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
@RequestMapping("/api")
@Tag(name = "2. Publicações", description = "Feed geral e pessoal, publicações por usuário/comunidade, edição e exclusão")
public class PublicacaoController {

    private final PublicacaoService service;

    public PublicacaoController(PublicacaoService service) {
        this.service = service;
    }

    @PostMapping("/publicacoes")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar publicação",
            description = "O autor é o usuário autenticado. comunidadeId opcional (precisa ser membro). Uma mídia opcional: "
                    + "use a `url` devolvida por POST /api/midias, ou uma URL externa/relativa. tipoMidia é inferido se omitido.")
    @ApiResponse(responseCode = "201", description = "Publicação criada")
    @ApiResponse(responseCode = "400", description = "Dados inválidos, mídia de outro usuário ou autor não é membro da comunidade")
    @ApiResponse(responseCode = "404", description = "Comunidade inexistente")
    public PublicacaoResponse criar(@Valid @RequestBody PublicacaoRequest req, UsuarioAutenticado atual) {
        return service.criar(atual.id(), req);
    }

    @GetMapping("/publicacoes")
    @Operation(summary = "Listar publicações (explorar)", description = "Filtros opcionais por autor e comunidade. Os campos curtidaPeloUsuario e salvaPeloUsuario refletem o usuário autenticado.")
    public PaginaResponse<PublicacaoResponse> listar(
            @Parameter(description = "Filtrar por autor") @RequestParam(required = false) Long usuarioId,
            @Parameter(description = "Filtrar por comunidade") @RequestParam(required = false) Long comunidadeId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanho,
            UsuarioAutenticado atual) {
        return service.listar(usuarioId, comunidadeId, atual.id(),
                Paginas.of(pagina, tamanho, Sort.by(Sort.Direction.DESC, "dataPublicacao", "id")));
    }

    @GetMapping("/feed")
    @Operation(summary = "Meu feed", description = "Publicações do usuário autenticado e de quem ele segue, mais recentes primeiro.")
    public PaginaResponse<PublicacaoResponse> feed(@RequestParam(defaultValue = "0") int pagina,
                                                   @RequestParam(defaultValue = "10") int tamanho,
                                                   UsuarioAutenticado atual) {
        return service.feed(atual.id(), Paginas.of(pagina, tamanho, Sort.by(Sort.Direction.DESC, "dataPublicacao", "id")));
    }

    @GetMapping("/publicacoes/{id}")
    @Operation(summary = "Buscar publicação por id (usado pelo link de compartilhamento)")
    @ApiResponse(responseCode = "404", description = "Publicação não encontrada")
    public PublicacaoResponse buscar(@PathVariable Long id, UsuarioAutenticado atual) {
        return service.buscar(id, atual.id());
    }

    @PutMapping("/publicacoes/{id}")
    @Operation(summary = "Editar publicação (autor ou admin)", description = "Atualiza texto/mídia e registra dataEdicao.")
    @ApiResponse(responseCode = "403", description = "Só o autor (ou admin) edita")
    public PublicacaoResponse atualizar(@PathVariable Long id, @Valid @RequestBody PublicacaoUpdateRequest req, UsuarioAutenticado atual) {
        return service.atualizar(id, req, atual);
    }

    @DeleteMapping("/publicacoes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir publicação (autor ou admin)",
            description = "Remove também comentários, curtidas, salvos e o arquivo de mídia enviado (se órfão).")
    public void excluir(@PathVariable Long id, UsuarioAutenticado atual) {
        service.excluir(id, atual);
    }
}
