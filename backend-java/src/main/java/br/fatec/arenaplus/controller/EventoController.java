package br.fatec.arenaplus.controller;
import br.fatec.arenaplus.dto.*;import br.fatec.arenaplus.entity.Evento;import br.fatec.arenaplus.security.UsuarioAutenticado;import br.fatec.arenaplus.service.EventoService;import jakarta.validation.Valid;import org.springframework.http.HttpStatus;import org.springframework.web.bind.annotation.*;import java.util.List;
@RestController @RequestMapping("/api/eventos") public class EventoController {
 private final EventoService service;public EventoController(EventoService s){service=s;}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public EventoResponse criar(@Valid @RequestBody EventoRequest req,UsuarioAutenticado eu){return service.criar(req,eu.id());}
 @GetMapping public PaginaResponse<EventoResponse> listar(@RequestParam(required=false)String modalidade,@RequestParam(required=false)String cidade,@RequestParam(required=false)String busca,@RequestParam(required=false)String estado,@RequestParam(defaultValue="0")int pagina,@RequestParam(defaultValue="10")int tamanho,UsuarioAutenticado eu){return service.listar(modalidade,cidade,busca,estado,pagina,tamanho,eu.id());}
 @GetMapping("/{id}") public EventoResponse buscar(@PathVariable Long id,UsuarioAutenticado eu){return service.buscar(id,eu.id());}
 @PostMapping("/{id}/participar") public EventoResponse participar(@PathVariable Long id,UsuarioAutenticado eu){return service.participar(id,eu.id());}
 @DeleteMapping("/{id}/participar") @ResponseStatus(HttpStatus.NO_CONTENT) public void cancelarParticipacao(@PathVariable Long id,UsuarioAutenticado eu){service.cancelarParticipacao(id,eu.id());}
 @GetMapping("/{id}/participantes") public List<UsuarioResumo> participantes(@PathVariable Long id){return service.participantes(id);}
 @PatchMapping("/{id}/cancelar") public EventoResponse cancelar(@PathVariable Long id,UsuarioAutenticado eu){return service.estado(id,eu.id(),eu.admin(),Evento.Estado.CANCELADO);}
 @PatchMapping("/{id}/encerrar") public EventoResponse encerrar(@PathVariable Long id,UsuarioAutenticado eu){return service.estado(id,eu.id(),eu.admin(),Evento.Estado.ENCERRADO);}
}
