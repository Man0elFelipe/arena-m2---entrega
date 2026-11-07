package br.fatec.arenaplus.service;
import br.fatec.arenaplus.dto.*;
import br.fatec.arenaplus.entity.*;
import br.fatec.arenaplus.exception.*;
import br.fatec.arenaplus.repository.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
@Service @Transactional
public class EventoService {
 private final EventoRepository eventos;private final ParticipacaoEventoRepository participacoes;private final UsuarioRepository usuarios;private final MidiaService midiaService;
 public EventoService(EventoRepository e,ParticipacaoEventoRepository p,UsuarioRepository u,MidiaService m){eventos=e;participacoes=p;usuarios=u;midiaService=m;}
 public EventoResponse criar(EventoRequest r,Long id){if(!r.dataHora().isAfter(LocalDateTime.now()))throw new RegraNegocioException("A data do evento deve ser futura.");Usuario u=usuarios.findById(id).orElseThrow(()->new RecursoNaoEncontradoException("Usuário",id));if(!Boolean.TRUE.equals(u.getAtivo()))throw new RegraNegocioException("Conta desativada.");Evento novo=new Evento(r.modalidade().trim(),r.titulo().trim(),r.descricao().trim(),r.cidade().trim(),r.local().trim(),r.dataHora(),r.vagasMaximas(),u);novo.setImagemUrl(midiaService.validarCapa(r.imagemUrl(),id));Evento e=eventos.save(novo);return resposta(e,id);}
 @Transactional(readOnly=true) public PaginaResponse<EventoResponse> listar(String modalidade,String cidade,String busca,String estado,int pagina,int tamanho,Long eu){int tam=Math.max(1,Math.min(tamanho,50));Evento.Estado est=null;if(estado!=null&&!estado.isBlank())try{est=Evento.Estado.valueOf(estado.toUpperCase());}catch(IllegalArgumentException ex){throw new RegraNegocioException("Estado de evento inválido.");}var page=eventos.filtrar(limpar(modalidade),limpar(cidade),limpar(busca),est,PageRequest.of(Math.max(0,pagina),tam,Sort.by(Sort.Direction.ASC,"dataHora")));return PaginaResponse.of(page,e->resposta(e,eu));}
 @Transactional(readOnly=true) public EventoResponse buscar(Long id,Long eu){return resposta(obter(id),eu);}
 public EventoResponse participar(Long id,Long eu){Evento e=eventos.obterComBloqueio(id).orElseThrow(()->new RecursoNaoEncontradoException("Evento",id));if(e.getEstado()!=Evento.Estado.ABERTO)throw new RegraNegocioException("Este evento não está aberto para inscrições.");if(participacoes.existsByEventoIdAndUsuarioId(id,eu))throw new ConflitoException("Você já está inscrito neste evento.");if(participacoes.countByEventoId(id)>=e.getVagasMaximas())throw new ConflitoException("As vagas deste evento já foram preenchidas.");Usuario u=usuarios.findById(eu).orElseThrow(()->new RecursoNaoEncontradoException("Usuário",eu));participacoes.save(new ParticipacaoEvento(e,u));return resposta(e,eu);}
 public void cancelarParticipacao(Long id,Long eu){obter(id);participacoes.deleteByEventoIdAndUsuarioId(id,eu);}
 @Transactional(readOnly=true) public List<UsuarioResumo> participantes(Long id){obter(id);return participacoes.findByEventoIdOrderByDataInscricaoAsc(id).stream().map(p->UsuarioResumo.from(p.getUsuario())).toList();}
 public EventoResponse estado(Long id,Long eu,boolean admin,Evento.Estado estado){Evento e=eventos.findById(id).orElseThrow(()->new RecursoNaoEncontradoException("Evento",id));if(!admin&&!e.getOrganizador().getId().equals(eu))throw new AcessoNegadoException("Somente o organizador ou administrador pode alterar o evento.");if(e.getEstado()!=Evento.Estado.ABERTO)throw new RegraNegocioException("Este evento já foi encerrado ou cancelado.");e.setEstado(estado);return resposta(e,eu);}
 private Evento obter(Long id){return eventos.findById(id).orElseThrow(()->new RecursoNaoEncontradoException("Evento",id));}
 private EventoResponse resposta(Evento e,Long eu){return EventoResponse.from(e,participacoes.countByEventoId(e.getId()),eu,eu!=null&&participacoes.existsByEventoIdAndUsuarioId(e.getId(),eu));}
 private String limpar(String s){return s==null||s.isBlank()?null:s.trim();}
}
