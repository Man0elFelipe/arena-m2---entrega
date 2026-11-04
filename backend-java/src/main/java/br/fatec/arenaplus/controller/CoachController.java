package br.fatec.arenaplus.controller;
import br.fatec.arenaplus.dto.CoachMensagemRequest;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.service.CoachService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/coach")
public class CoachController {
 private final CoachService service; public CoachController(CoachService s){service=s;}
 @GetMapping("/status") public Map<String,Object> status(){return service.status();}
 @GetMapping("/mensagens") public List<?> historico(UsuarioAutenticado eu){return service.historico(eu.id());}
 @PostMapping("/mensagens") @ResponseStatus(HttpStatus.CREATED) public Object perguntar(@Valid @RequestBody CoachMensagemRequest req,UsuarioAutenticado eu){return service.perguntar(eu.id(),req.texto());}
 @DeleteMapping("/mensagens") @ResponseStatus(HttpStatus.NO_CONTENT) public void limpar(UsuarioAutenticado eu){service.limpar(eu.id());}
}
