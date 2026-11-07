package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.MidiaLimitesResponse;
import br.fatec.arenaplus.dto.MidiaResponse;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.service.MidiaService;
import br.fatec.arenaplus.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/midias")
@Tag(name = "8. Mídias", description = "Upload de imagens (JPEG, PNG, WebP) e vídeos (MP4, MOV, WebM). Os limites de tamanho são configuráveis (ARENAPLUS_UPLOAD_MAX_*_MB).")
public class MidiaController {

    private final MidiaService service;
    private final UsuarioService usuarioService;

    public MidiaController(MidiaService service, UsuarioService usuarioService) {
        this.service = service;
        this.usuarioService = usuarioService;
    }

    @GetMapping("/limites")
    @Operation(summary = "Limites e formatos aceitos no upload", description = "Tamanhos máximos (MB) e tipos aceitos, vindos da configuração do servidor.")
    public MidiaLimitesResponse limites() {
        return service.limites();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Enviar imagem ou vídeo (multipart/form-data)",
            description = "O formato é validado pelo conteúdo do arquivo (assinatura), não pela extensão. O arquivo fica em disco e os "
                    + "metadados no H2. Use a `url` devolvida em `midiaUrl` ao criar a publicação. Os arquivos são servidos em GET /media/{arquivo}.")
    @ApiResponse(responseCode = "201", description = "Arquivo armazenado")
    @ApiResponse(responseCode = "400", description = "Formato inválido, arquivo vazio ou maior que o limite")
    @ApiResponse(responseCode = "413", description = "Requisição maior que o limite do servidor")
    public MidiaResponse enviar(@Parameter(description = "Arquivo de imagem ou vídeo") @RequestPart("arquivo") MultipartFile arquivo,
                                UsuarioAutenticado atual) {
        return service.armazenar(arquivo, usuarioService.obterAtivo(atual.id()));
    }
}
