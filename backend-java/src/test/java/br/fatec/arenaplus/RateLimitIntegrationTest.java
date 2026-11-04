package br.fatec.arenaplus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest @AutoConfigureMockMvc
@TestPropertySource(properties={"arenaplus.rate-limit.auth-por-minuto=1"})
class RateLimitIntegrationTest {
 @Autowired MockMvc mvc;
 @Test void limiteDeAutenticacaoDevolve429() throws Exception {
  var req=post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"nao@existe.dev\",\"senha\":\"incorreta\"}");
  mvc.perform(req).andExpect(status().isUnauthorized());
  mvc.perform(req).andExpect(status().isTooManyRequests());
 }
}
