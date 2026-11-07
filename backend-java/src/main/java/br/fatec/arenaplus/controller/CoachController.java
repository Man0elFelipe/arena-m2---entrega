package br.fatec.arenaplus.controller;

import br.fatec.arenaplus.dto.CoachMensagemRequest;
import br.fatec.arenaplus.dto.CoachMensagemResponse;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.service.CoachService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coach")
@Tag(name = "11. Arena Coach", description = "Assistente esportivo por IA. A chave do provedor fica só no servidor; o histórico é privado de cada usuário.")
public class CoachController {

    private final CoachService service;

    public CoachController(CoachService service) {
        this.service = service;
    }

    @GetMapping("/status")
    @Operation(summary = "O Coach está configurado?", description = "`disponivel=false` quando o servidor não tem chave de IA configurada.")
    public Map<String, Object> status() {
        return service.status();
    }

    @GetMapping("/mensagens")
    @Operation(summary = "Meu histórico com o Coach", description = "Somente as mensagens do usuário autenticado.")
    public List<CoachMensagemResponse> historico(UsuarioAutenticado atual) {
        return service.historico(atual.id());
    }

    @PostMapping("/mensagens")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Perguntar ao Coach", description = "Envia a pergunta ao provedor de IA (no backend) e grava pergunta e resposta no histórico.")
    @ApiResponse(responseCode = "201", description = "Resposta do Coach")
    @ApiResponse(responseCode = "400", description = "Mensagem vazia ou longa demais")
    @ApiResponse(responseCode = "429", description = "Limite de perguntas por minuto/hora excedido")
    @ApiResponse(responseCode = "502", description = "O provedor de IA falhou, recusou a chamada ou demorou demais")
    @ApiResponse(responseCode = "503", description = "Coach não configurado no servidor (sem chave)")
    public CoachMensagemResponse perguntar(@Valid @RequestBody CoachMensagemRequest req, UsuarioAutenticado atual) {
        return service.perguntar(atual.id(), req.texto());
    }

    @DeleteMapping("/mensagens")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Apagar meu histórico com o Coach")
    public void limpar(UsuarioAutenticado atual) {
        service.limpar(atual.id());
    }
}
