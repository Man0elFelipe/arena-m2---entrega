package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.*;
import br.fatec.arenaplus.entity.NivelExperiencia;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
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

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @PostMapping
    @SecurityRequirements
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastrar usuário (público)", description = "Armazena apenas o hash BCrypt da senha. Email deve ser único. Campos de perfil são opcionais.")
    @ApiResponse(responseCode = "201", description = "Usuário criado")
    @ApiResponse(responseCode = "400", description = "Dados inválidos")
    @ApiResponse(responseCode = "409", description = "Email já cadastrado")
    public UsuarioResponse cadastrar(@Valid @RequestBody UsuarioCreateRequest req) {
        return service.cadastrar(req);
    }

    @GetMapping
    @Operation(summary = "Buscar usuários", description = "Busca por nome/cidade (sem acento), filtro por esporte e por cidade. Paginado. Email só aparece para o próprio usuário.")
    public PaginaResponse<UsuarioResponse> listar(
            @Parameter(description = "Texto de busca (nome ou cidade)") @RequestParam(required = false) String busca,
            @Parameter(description = "Filtrar por esporte principal ou modalidade favorita") @RequestParam(required = false) String esporte,
            @Parameter(description = "Filtrar por cidade") @RequestParam(required = false) String cidade,
            @RequestParam(defaultValue = "false") boolean incluirInativos,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho,
            UsuarioAutenticado atual) {
        return service.listar(busca, esporte, cidade, incluirInativos, atual, Paginas.of(pagina, tamanho, Sort.by("nome")));
    }

    @GetMapping("/parceiros")
    @Operation(summary = "Encontrar parceiros esportivos",
            description = "Lista apenas usuários que optaram por aparecer (procuraParceiros=true). Filtros: modalidade, cidade e nível. "
                    + "A disponibilidade só é exibida de quem autorizou.")
    public PaginaResponse<UsuarioResponse> parceiros(@RequestParam(required = false) String modalidade,
                                                     @RequestParam(required = false) String cidade,
                                                     @RequestParam(required = false) NivelExperiencia nivel,
                                                     @RequestParam(defaultValue = "0") int pagina,
                                                     @RequestParam(defaultValue = "20") int tamanho,
                                                     UsuarioAutenticado atual) {
        return service.parceiros(modalidade, cidade, nivel, atual, Paginas.of(pagina, tamanho, Sort.by("nome")));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar usuário por id")
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    public UsuarioResponse buscar(@PathVariable Long id, UsuarioAutenticado atual) {
        return service.buscar(id, atual);
    }

    @GetMapping("/{id}/perfil")
    @Operation(summary = "Perfil com estatísticas", description = "Usuário + total de publicações, seguidores, seguindo e comunidades.")
    public PerfilResponse perfil(@PathVariable Long id, UsuarioAutenticado atual) {
        return service.perfil(id, atual);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar perfil (próprio ou admin)", description = "Atualiza dados pessoais e do perfil esportivo, incluindo as opções de privacidade.")
    @ApiResponse(responseCode = "403", description = "Só o próprio usuário (ou admin) edita")
    public UsuarioResponse atualizar(@PathVariable Long id, @Valid @RequestBody UsuarioUpdateRequest req, UsuarioAutenticado atual) {
        return service.atualizar(id, req, atual);
    }

    @PatchMapping("/{id}/senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Alterar a própria senha", description = "Exige a senha atual e revoga as demais sessões. Retorna 204.")
    public void alterarSenha(@PathVariable Long id, @Valid @RequestBody AlterarSenhaRequest req, UsuarioAutenticado atual) {
        service.alterarSenha(id, req, atual);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Desativar conta (própria ou admin) — exclusão lógica",
            description = "Marca ativo=false e revoga as sessões. Publicações e relações são preservadas.")
    public void desativar(@PathVariable Long id, UsuarioAutenticado atual) {
        service.desativar(id, atual);
    }

    @PatchMapping("/{id}/reativar")
    @Operation(summary = "Reativar usuário desativado (somente admin)")
    public UsuarioResponse reativar(@PathVariable Long id, UsuarioAutenticado atual) {
        return service.reativar(id, atual);
    }
}
