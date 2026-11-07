package br.fatec.arenaplus;

import com.jayway.jsonpath.JsonPath;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Arena Coach ponta a ponta com o PROVEDOR SIMULADO por um servidor HTTP local (sem rede externa, sem custo):
 * sucesso, chave recusada, limite do provedor, erro 5xx, JSON inválido, timeout e limite por usuário.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CoachIntegrationTest {

    static final String CHAVE = "chave-de-teste-nao-real";
    static final AtomicInteger SEQ = new AtomicInteger();

    interface Comportamento {
        void tratar(HttpExchange ex) throws Exception;
    }

    static final HttpServer PROVEDOR;
    static volatile Comportamento comportamento;
    static volatile String ultimaAutorizacao;
    static volatile String ultimoCorpo;

    static {
        try {
            PROVEDOR = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            PROVEDOR.setExecutor(Executors.newFixedThreadPool(4));
            PROVEDOR.createContext("/v1/chat/completions", ex -> {
                ultimaAutorizacao = ex.getRequestHeaders().getFirst("Authorization");
                ultimoCorpo = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                try {
                    comportamento.tratar(ex);
                } catch (Exception e) {
                    ex.sendResponseHeaders(500, -1);
                } finally {
                    ex.close();
                }
            });
            PROVEDOR.start();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    @DynamicPropertySource
    static void propriedades(DynamicPropertyRegistry r) {
        r.add("arenaplus.coach.api-key", () -> CHAVE);
        r.add("arenaplus.coach.base-url", () -> "http://127.0.0.1:" + PROVEDOR.getAddress().getPort() + "/v1");
        r.add("arenaplus.coach.timeout-segundos", () -> "1");
        r.add("arenaplus.coach.limite-por-minuto", () -> "3");
    }

    @AfterAll
    static void parar() {
        PROVEDOR.stop(0);
    }

    @Autowired
    MockMvc mvc;

    // ---------- provedor simulado ----------

    static void responder(HttpExchange ex, int status, String corpo) throws IOException {
        byte[] b = corpo.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().add("Content-Type", "application/json");
        ex.sendResponseHeaders(status, b.length);
        ex.getResponseBody().write(b);
    }

    static void provedorResponde(int status, String corpo) {
        comportamento = ex -> responder(ex, status, corpo);
    }

    // ---------- helpers ----------

    record U(long id, String token) {
    }

    private U novoUsuario(String nome, String esporte) throws Exception {
        String email = "coach" + SEQ.incrementAndGet() + "@teste.dev";
        long id = ((Number) JsonPath.read(mvc.perform(MockMvcRequestBuilders.post("/api/usuarios").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"%s\",\"email\":\"%s\",\"senha\":\"segredo123\",\"esportePrincipal\":\"%s\"}".formatted(nome, email, esporte)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id")).longValue();
        String token = JsonPath.read(mvc.perform(MockMvcRequestBuilders.post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"senha\":\"segredo123\"}".formatted(email))).andReturn().getResponse().getContentAsString(), "$.token");
        return new U(id, token);
    }

    private ResultActions chamar(MockHttpServletRequestBuilder b, String token, String json) throws Exception {
        if (token != null) b.header("Authorization", "Bearer " + token);
        if (json != null) b.contentType(MediaType.APPLICATION_JSON).content(json);
        return mvc.perform(b);
    }

    private ResultActions perguntar(U u, String texto) throws Exception {
        return chamar(MockMvcRequestBuilders.post("/api/coach/mensagens"), u.token(), "{\"texto\":\"%s\"}".formatted(texto));
    }

    // ---------- testes ----------

    @Test
    void respostaChegaAoUsuarioFicaNoHistoricoPrivadoEAChaveVaiSoParaOProvedor() throws Exception {
        U ana = novoUsuario("Ana Coach", "Futebol");
        U bia = novoUsuario("Bia Coach", "Vôlei");
        provedorResponde(200, "{\"choices\":[{\"message\":{\"content\":\"Faça um aquecimento leve e progressivo.\"}}]}");

        chamar(MockMvcRequestBuilders.get("/api/coach/status"), ana.token(), null).andExpect(jsonPath("$.disponivel").value(true));
        perguntar(ana, "Como aquecer antes do jogo?").andExpect(status().isCreated())
                .andExpect(jsonPath("$.papel").value("RESPOSTA"))
                .andExpect(jsonPath("$.texto").value("Faça um aquecimento leve e progressivo."))
                .andExpect(content().string(not(containsString(CHAVE))));

        // a chave seguiu só no cabeçalho para o provedor; a pergunta e o contexto do perfil foram junto
        org.junit.jupiter.api.Assertions.assertEquals("Bearer " + CHAVE, ultimaAutorizacao);
        org.junit.jupiter.api.Assertions.assertTrue(ultimoCorpo.contains("Como aquecer antes do jogo?"));
        org.junit.jupiter.api.Assertions.assertTrue(ultimoCorpo.contains("Futebol"), "o esporte principal deve ir como contexto");
        org.junit.jupiter.api.Assertions.assertFalse(ultimoCorpo.contains(CHAVE), "a chave não pode ir no corpo da requisição");

        chamar(MockMvcRequestBuilders.get("/api/coach/mensagens"), ana.token(), null)
                .andExpect(jsonPath("$", hasSize(2))).andExpect(jsonPath("$[0].papel").value("PERGUNTA"));
        chamar(MockMvcRequestBuilders.get("/api/coach/mensagens"), bia.token(), null).andExpect(jsonPath("$", hasSize(0)));
        chamar(MockMvcRequestBuilders.delete("/api/coach/mensagens"), ana.token(), null).andExpect(status().isNoContent());
        chamar(MockMvcRequestBuilders.get("/api/coach/mensagens"), ana.token(), null).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void chaveRecusadaPeloProvedorVira502SemVazarDetalhesENaoGravaHistorico() throws Exception {
        U u = novoUsuario("Chave Ruim", "Corrida");
        provedorResponde(401, "{\"error\":{\"message\":\"Incorrect API key provided: " + CHAVE + "\"}}");
        perguntar(u, "Oi").andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.mensagem").value(containsString("indisponível")))
                .andExpect(content().string(not(containsString(CHAVE))))
                .andExpect(content().string(not(containsString("Incorrect"))));
        chamar(MockMvcRequestBuilders.get("/api/coach/mensagens"), u.token(), null).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void limiteDoProvedorErro5xxJsonInvalidoESemConteudoViram502() throws Exception {
        U a = novoUsuario("Falha A", "Corrida");
        provedorResponde(429, "{\"error\":{\"message\":\"You exceeded your current quota\"}}");
        perguntar(a, "q1").andExpect(status().isBadGateway());
        provedorResponde(500, "{\"error\":\"boom\"}");
        perguntar(a, "q2").andExpect(status().isBadGateway());
        provedorResponde(200, "isto nao e json");
        perguntar(a, "q3").andExpect(status().isBadGateway());
        perguntar(a, "q4").andExpect(status().isTooManyRequests()); // 4ª tentativa na janela: limite por usuário (3/min)

        U b = novoUsuario("Falha B", "Corrida");
        provedorResponde(200, "isto nao e json");
        perguntar(b, "q1").andExpect(status().isBadGateway());
        provedorResponde(200, "{\"choices\":[]}");
        perguntar(b, "q2").andExpect(status().isBadGateway());
    }

    @Test
    void timeoutDoProvedorVira502ComMensagemPropria() throws Exception {
        U u = novoUsuario("Lento", "Corrida");
        comportamento = ex -> {
            Thread.sleep(2500); // mais que o timeout de 1 s configurado para este teste
            responder(ex, 200, "{\"choices\":[{\"message\":{\"content\":\"tarde demais\"}}]}");
        };
        perguntar(u, "Responde rápido?").andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.mensagem").value(containsString("demorou demais")));
    }

    @Test
    void limitePorMinutoEPorUsuario() throws Exception {
        U u = novoUsuario("Muitas", "Corrida");
        provedorResponde(200, "{\"choices\":[{\"message\":{\"content\":\"ok\"}}]}");
        for (int i = 0; i < 3; i++) perguntar(u, "pergunta " + i).andExpect(status().isCreated());
        perguntar(u, "pergunta extra").andExpect(status().isTooManyRequests()).andExpect(jsonPath("$.mensagem").value(containsString("Tente novamente")));
        // outro usuário não é afetado
        perguntar(novoUsuario("Calma", "Corrida"), "oi").andExpect(status().isCreated());
    }

    @Test
    void validacaoEAutenticacao() throws Exception {
        U u = novoUsuario("Valida", "Corrida");
        perguntar(u, "   ").andExpect(status().isBadRequest());
        perguntar(u, "x".repeat(1001)).andExpect(status().isBadRequest());
        chamar(MockMvcRequestBuilders.post("/api/coach/mensagens"), null, "{\"texto\":\"oi\"}").andExpect(status().isUnauthorized());
        chamar(MockMvcRequestBuilders.get("/api/coach/mensagens"), null, null).andExpect(status().isUnauthorized());
    }
}
