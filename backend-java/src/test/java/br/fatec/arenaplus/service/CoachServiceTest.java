package br.fatec.arenaplus.service;

import br.fatec.arenaplus.entity.MensagemCoach;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.ServicoIndisponivelException;
import br.fatec.arenaplus.repository.MensagemCoachRepository;
import br.fatec.arenaplus.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import java.net.http.*;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CoachServiceTest {
 @Test void semChaveDevolveStatusIndisponivelE503AoPerguntar(){var repo=mock(MensagemCoachRepository.class);var users=mock(UsuarioRepository.class);var s=new CoachService(repo,users,"","gpt-test",2,10,1000);assertEquals(false,s.status().get("disponivel"));assertThrows(ServicoIndisponivelException.class,()->s.perguntar(1L,"Como aquecer?"));verifyNoInteractions(repo);}
 @Test void respostaEArmazenadaComHistoricoDoUsuario(){var repo=mock(MensagemCoachRepository.class);var users=mock(UsuarioRepository.class);var http=mock(HttpClient.class);var user=mock(Usuario.class);when(users.findById(7L)).thenReturn(Optional.of(user));when(repo.findTop100ByUsuarioIdOrderByIdDesc(7L)).thenReturn(java.util.List.of());when(repo.save(any(MensagemCoach.class))).thenAnswer(i->i.getArgument(0));var response=mock(HttpResponse.class);when(response.statusCode()).thenReturn(200);when(response.body()).thenReturn("{\"choices\":[{\"message\":{\"content\":\"Faça aquecimento leve e progressivo.\"}}]}");try{doReturn(response).when(http).send(any(HttpRequest.class),any(HttpResponse.BodyHandler.class));}catch(Exception e){fail(e);}
  var s=new CoachService(repo,users,http,"teste-nao-real","gpt-test",2,10,1000);var answer=s.perguntar(7L,"Como aquecer?");assertEquals("RESPOSTA",answer.papel());assertEquals("Faça aquecimento leve e progressivo.",answer.texto());verify(repo,times(2)).save(any(MensagemCoach.class));}
}
