package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.CoachMensagemResponse;
import br.fatec.arenaplus.exception.ProvedorIndisponivelException;
import br.fatec.arenaplus.exception.RegraNegocioException;
import br.fatec.arenaplus.exception.ServicoIndisponivelException;
import br.fatec.arenaplus.security.LimiteRequisicoes;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** Testes unitários do Arena Coach: provedor e histórico são simulados, sem rede. */
class CoachServiceTest {

    private static final String CHAVE = "chave-de-teste-nao-real";

    private CoachHistoricoService historico;
    private HttpClient http;

    @BeforeEach
    void setUp() {
        historico = mock(CoachHistoricoService.class);
        http = mock(HttpClient.class);
        when(historico.preparar(7L)).thenReturn(new CoachHistoricoService.Preparo("esporte principal: Corrida", List.of()));
    }

    private CoachService servico(String chave) {
        return new CoachService(historico, new LimiteRequisicoes(), http, chave, "http://provedor.local/v1/", "modelo-teste", 2, 100, 100, 1000);
    }

    @SuppressWarnings("unchecked")
    private HttpResponse<String> resposta(int status, String corpo) throws Exception {
        HttpResponse<String> r = mock(HttpResponse.class);
        when(r.statusCode()).thenReturn(status);
        when(r.body()).thenReturn(corpo);
        doReturn(r).when(http).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
        return r;
    }

    @Test
    void semChaveReportaNaoConfiguradoENaoChamaOProvedor() throws Exception {
        CoachService s = servico("  ");
        assertThat(s.status()).containsEntry("disponivel", false);
        assertThat(s.status().get("mensagem").toString()).contains("não configurado");
        assertThatThrownBy(() -> s.perguntar(7L, "Como aquecer?")).isInstanceOf(ServicoIndisponivelException.class)
                .hasMessageContaining("não configurado");
        verifyNoInteractions(http);
        verify(historico, never()).registrar(any(), any(), any());
    }

    @Test
    void mensagemVaziaOuLongaDemaisEhRecusadaAntesDeQualquerChamada() {
        CoachService s = servico(CHAVE);
        assertThatThrownBy(() -> s.perguntar(7L, "   ")).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> s.perguntar(7L, "x".repeat(1001))).isInstanceOf(RegraNegocioException.class);
        verifyNoInteractions(http);
    }

    @Test
    void sucessoEnviaChaveSoNoCabecalhoComContextoERegistraNoHistorico() throws Exception {
        resposta(200, "{\"choices\":[{\"message\":{\"content\":\"  Aqueça devagar.  \"}}]}");
        when(historico.registrar(7L, "Como aquecer?", "Aqueça devagar."))
                .thenReturn(new CoachMensagemResponse(1L, "RESPOSTA", "Aqueça devagar.", LocalDateTime.now()));

        CoachMensagemResponse r = servico(CHAVE).perguntar(7L, " Como aquecer? ");

        assertThat(r.texto()).isEqualTo("Aqueça devagar.");
        ArgumentCaptor<HttpRequest> req = ArgumentCaptor.forClass(HttpRequest.class);
        verify(http).send(req.capture(), any(HttpResponse.BodyHandler.class));
        assertThat(req.getValue().uri().toString()).isEqualTo("http://provedor.local/v1/chat/completions");
        assertThat(req.getValue().headers().firstValue("Authorization")).contains("Bearer " + CHAVE);
    }

    @Test
    void falhaDoProvedorViraBadGatewayEnadaEhGravadoNoHistorico() throws Exception {
        resposta(401, "{\"error\":{\"message\":\"Incorrect API key provided: " + CHAVE + "\"}}");
        assertThatThrownBy(() -> servico(CHAVE).perguntar(7L, "Oi"))
                .isInstanceOf(ProvedorIndisponivelException.class)
                .hasMessageContaining("indisponível")
                .satisfies(e -> assertThat(e.getMessage()).doesNotContain(CHAVE).doesNotContain("Incorrect"));
        verify(historico, never()).registrar(any(), any(), any());
    }

    @Test
    void timeoutTemMensagemPropria() throws Exception {
        doThrow(new HttpTimeoutException("request timed out")).when(http).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
        assertThatThrownBy(() -> servico(CHAVE).perguntar(7L, "Oi")).isInstanceOf(ProvedorIndisponivelException.class)
                .hasMessageContaining("demorou demais");
    }

    @Test
    void respostaSemConteudoOuJsonInvalidoViraBadGateway() throws Exception {
        resposta(200, "{\"choices\":[]}");
        assertThatThrownBy(() -> servico(CHAVE).perguntar(7L, "Oi")).isInstanceOf(ProvedorIndisponivelException.class);
        resposta(200, "isto nao e json");
        assertThatThrownBy(() -> servico(CHAVE).perguntar(7L, "Oi")).isInstanceOf(ProvedorIndisponivelException.class);
    }

    @Test
    void logMascaraAChaveConfiguradaEQualquerPadraoSk() {
        CoachService s = servico(CHAVE);
        String m = s.mascarar("erro com " + CHAVE + " e tambem sk-proj-ABCDEF1234567890 no texto");
        assertThat(m).doesNotContain(CHAVE).doesNotContain("ABCDEF1234567890").contains("****");
    }

    @Test
    void limitePorMinutoRetorna429() throws Exception {
        resposta(200, "{\"choices\":[{\"message\":{\"content\":\"ok\"}}]}");
        when(historico.registrar(eq(7L), any(), any())).thenReturn(new CoachMensagemResponse(1L, "RESPOSTA", "ok", LocalDateTime.now()));
        CoachService s = new CoachService(historico, new LimiteRequisicoes(), http, CHAVE, "http://x/v1", "m", 2, 2, 100, 1000);
        s.perguntar(7L, "um");
        s.perguntar(7L, "dois");
        assertThatThrownBy(() -> s.perguntar(7L, "tres")).isInstanceOf(br.fatec.arenaplus.exception.MuitasRequisicoesException.class);
    }
}
