package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.*;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.service.ConversaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversas")
@Tag(name = "10. Mensagens privadas", description = "Chat entre dois usuários. Apenas os participantes leem a conversa (terceiros recebem 403).")
public class ConversaController {

    private final ConversaService service;

    public ConversaController(ConversaService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Minhas conversas", description = "Mais recentes primeiro, com a última mensagem e o número de não lidas.")
    public List<ConversaResponse> listar(UsuarioAutenticado atual) {
        return service.listar(atual.id());
    }

    @PostMapping
    @Operation(summary = "Iniciar conversa com um usuário", description = "Idempotente: devolve a conversa existente se já houver uma com esse usuário.")
    @ApiResponse(responseCode = "400", description = "Conversa consigo mesmo ou usuário desativado")
    public ConversaResponse iniciar(@Valid @RequestBody ConversaRequest req, UsuarioAutenticado atual) {
        return service.iniciar(atual.id(), req.usuarioId());
    }

    @GetMapping("/nao-lidas")
    @Operation(summary = "Total de mensagens não lidas", description = "Usado pelo indicador do cabeçalho.")
    public Map<String, Long> naoLidas(UsuarioAutenticado atual) {
        return Map.of("total", service.totalNaoLidas(atual.id()));
    }

    @GetMapping("/{id}/mensagens")
    @Operation(summary = "Mensagens de uma conversa", description = "Sem `apos`: últimas mensagens. Com `apos`: só as mais novas que o id informado (atualização periódica). "
            + "Marca como lidas as mensagens recebidas.")
    @ApiResponse(responseCode = "403", description = "Você não participa desta conversa")
    public List<MensagemResponse> mensagens(@PathVariable Long id,
                                            @Parameter(description = "Último id de mensagem já recebido") @RequestParam(required = false) Long apos,
                                            UsuarioAutenticado atual) {
        return service.mensagens(id, apos, atual.id());
    }

    @PostMapping("/{id}/mensagens")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Enviar mensagem", description = "Limite de 60 mensagens por minuto por usuário.")
    @ApiResponse(responseCode = "403", description = "Você não participa desta conversa")
    @ApiResponse(responseCode = "429", description = "Limite de envio excedido")
    public MensagemResponse enviar(@PathVariable Long id, @Valid @RequestBody MensagemRequest req, UsuarioAutenticado atual) {
        return service.enviar(id, req, atual.id());
    }
}
