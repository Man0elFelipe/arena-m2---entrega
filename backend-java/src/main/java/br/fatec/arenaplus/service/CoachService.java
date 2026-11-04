package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.*;
import br.fatec.arenaplus.entity.MensagemCoach;
import br.fatec.arenaplus.exception.MuitasRequisicoesException;
import br.fatec.arenaplus.exception.ServicoIndisponivelException;
import br.fatec.arenaplus.repository.MensagemCoachRepository;
import br.fatec.arenaplus.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CoachService {
 private static final String SYSTEM="Você é o Arena Coach. Responda em português, com orientações gerais e prudentes sobre esporte e treino. Você não substitui médico, nutricionista nem treinador. Não diagnostique, não prescreva tratamento, dieta ou cargas individuais. Incentive descanso, aquecimento, progressão gradual e segurança. Para dor, lesão, doença ou sintomas, recomende procurar profissional de saúde. Não incentive excesso.";
 private final MensagemCoachRepository repo; private final UsuarioRepository usuarios; private final HttpClient http; private final ObjectMapper json=new ObjectMapper();
 private final String key,modelo; private final int timeout,limite,maxChars; private final Map<Long,Deque<LocalDateTime>> uso=new ConcurrentHashMap<>();
 @Autowired public CoachService(MensagemCoachRepository repo, UsuarioRepository usuarios,
   @Value("${arenaplus.coach.openai-api-key:}") String key,@Value("${arenaplus.coach.modelo:gpt-4o-mini}") String modelo,
   @Value("${arenaplus.coach.timeout-segundos:30}") int timeout,@Value("${arenaplus.coach.limite-por-hora:30}") int limite,
   @Value("${arenaplus.coach.max-chars-mensagem:1000}") int maxChars){this(repo,usuarios,HttpClient.newHttpClient(),key,modelo,timeout,limite,maxChars);}
 public CoachService(MensagemCoachRepository repo, UsuarioRepository usuarios,HttpClient http,String key,String modelo,int timeout,int limite,int maxChars){this.repo=repo;this.usuarios=usuarios;this.http=http;this.key=key;this.modelo=modelo;this.timeout=timeout;this.limite=limite;this.maxChars=maxChars;}
 public Map<String,Object> status(){return Map.of("disponivel",!key.isBlank(),"mensagem",key.isBlank()?"O Arena Coach está temporariamente indisponível.":"Arena Coach disponível.");}
 @Transactional(readOnly=true) public List<CoachMensagemResponse> historico(Long id){var l=new ArrayList<>(repo.findTop100ByUsuarioIdOrderByIdDesc(id));Collections.reverse(l);return l.stream().map(CoachMensagemResponse::from).toList();}
 @Transactional public void limpar(Long id){repo.deleteByUsuarioId(id);}
 @Transactional public CoachMensagemResponse perguntar(Long id,String texto){
  String pergunta=texto==null?"":texto.trim(); if(pergunta.isEmpty()||pergunta.length()>maxChars) throw new br.fatec.arenaplus.exception.RegraNegocioException("A mensagem deve ter entre 1 e "+maxChars+" caracteres.");
  if(key.isBlank()) throw new ServicoIndisponivelException("O Arena Coach está temporariamente indisponível. Tente novamente mais tarde.");
  var fila=uso.computeIfAbsent(id,k->new ArrayDeque<>()); synchronized(fila){var limiteTempo=LocalDateTime.now().minusHours(1);while(!fila.isEmpty()&&fila.peekFirst().isBefore(limiteTempo))fila.removeFirst();if(fila.size()>=limite)throw new MuitasRequisicoesException("Limite de perguntas ao Arena Coach atingido. Tente novamente mais tarde.");fila.addLast(LocalDateTime.now());}
  var user=usuarios.findById(id).orElseThrow();
  try {
   var msgs=new ArrayList<Map<String,String>>(); msgs.add(Map.of("role","system","content",SYSTEM));
   var hist=repo.findTop100ByUsuarioIdOrderByIdDesc(id); Collections.reverse(hist);
   for(var m:hist) msgs.add(Map.of("role",m.getPapel()==MensagemCoach.Papel.PERGUNTA?"user":"assistant","content",m.getTexto()));
   msgs.add(Map.of("role","user","content",pergunta));
   String body=json.writeValueAsString(Map.of("model",modelo,"messages",msgs,"temperature",0.5,"max_tokens",500));
   var req=HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/chat/completions")).timeout(Duration.ofSeconds(timeout)).header("Authorization","Bearer "+key).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
   var resp=http.send(req,HttpResponse.BodyHandlers.ofString());
   if(resp.statusCode()==429)throw new MuitasRequisicoesException("O serviço está recebendo muitas solicitações. Aguarde um pouco e tente novamente.");
   if(resp.statusCode()<200||resp.statusCode()>=300)throw new ServicoIndisponivelException("O Arena Coach não conseguiu responder agora. Tente novamente mais tarde.");
   JsonNode root=json.readTree(resp.body());String resposta=root.path("choices").path(0).path("message").path("content").asText("").trim();if(resposta.isBlank())throw new ServicoIndisponivelException("O Arena Coach não conseguiu responder agora.");if(resposta.length()>2000)resposta=resposta.substring(0,2000);
   repo.save(new MensagemCoach(user,MensagemCoach.Papel.PERGUNTA,pergunta));return CoachMensagemResponse.from(repo.save(new MensagemCoach(user,MensagemCoach.Papel.RESPOSTA,resposta)));
  }catch(MuitasRequisicoesException|ServicoIndisponivelException e){throw e;}catch(Exception e){throw new ServicoIndisponivelException("O Arena Coach está temporariamente indisponível. Tente novamente mais tarde.");}
 }
}
