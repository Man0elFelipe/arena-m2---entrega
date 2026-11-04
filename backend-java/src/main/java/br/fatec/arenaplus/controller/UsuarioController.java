package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.*;
import br.fatec.arenaplus.service.PublicacaoService;
import br.fatec.arenaplus.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
@Tag(name = "1. Usuários", description = "Cadastro, consulta, edição e desativação de usuários")
public class UsuarioController {

    private final UsuarioService service;
    private final PublicacaoService publicacaoService;

    public UsuarioController(UsuarioService service, PublicacaoService publicacaoService) {
        this.service = service;
        this.publicacaoService = publicacaoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastrar usuário", description = "Armazena apenas o hash BCrypt da senha. Email deve ser único.")
    @ApiResponse(responseCode = "201", description = "Usuário criado")
    @ApiResponse(responseCode = "400", description = "Dados inválidos")
    @ApiResponse(responseCode = "409", description = "Email já cadastrado")
    public UsuarioResponse cadastrar(@Valid @RequestBody UsuarioCreateRequest req) {
        return service.cadastrar(req);
    }

    @GetMapping
    @Operation(summary = "Listar usuários", description = "Busca opcional por nome, cidade ou esporte. Paginado.")
    public PaginaResponse<UsuarioResponse> listar(
            @Parameter(description = "Texto de busca") @RequestParam(required = false) String busca,
            @RequestParam(defaultValue = "false") boolean incluirInativos,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return service.listar(busca, incluirInativos, Paginas.of(pagina, tamanho, Sort.by("nome")));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar usuário por id")
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    public UsuarioResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @GetMapping("/{id}/perfil")
    @Operation(summary = "Perfil com estatísticas", description = "Usuário + total de publicações, seguidores, seguindo e comunidades.")
    public PerfilResponse perfil(@PathVariable Long id) {
        return service.perfil(id);
    }

    @GetMapping("/{id}/feed")
    @Operation(summary = "Feed do usuário", description = "Publicações do próprio usuário e de quem ele segue, mais recentes primeiro.")
    public PaginaResponse<PublicacaoResponse> feed(@PathVariable Long id,
                                                   @RequestParam(defaultValue = "0") int pagina,
                                                   @RequestParam(defaultValue = "10") int tamanho) {
        return publicacaoService.feed(id, Paginas.of(pagina, tamanho, Sort.by(Sort.Direction.DESC, "dataPublicacao")));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar perfil", description = "Atualiza nome, foto, biografia, cidade e esporte principal.")
    public UsuarioResponse atualizar(@PathVariable Long id, @Valid @RequestBody UsuarioUpdateRequest req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Alterar senha", description = "Exige a senha atual. Retorna 204.")
    public void alterarSenha(@PathVariable Long id, @Valid @RequestBody AlterarSenhaRequest req) {
        service.alterarSenha(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Desativar usuário (exclusão lógica)",
            description = "Marca ativo=false. Publicações e relações são preservadas; o usuário some de listagens e feed.")
    public void desativar(@PathVariable Long id) {
        service.desativar(id);
    }

    @PatchMapping("/{id}/reativar")
    @Operation(summary = "Reativar usuário desativado")
    public UsuarioResponse reativar(@PathVariable Long id) {
        return service.reativar(id);
    }
}
