package br.fatec.arenaplus;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.context.TestPropertySource;

import java.util.Arrays;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Testes de integração ponta a ponta: controller -> service -> JPA -> H2 em memória, com autenticação por token. */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "arenaplus.coach.openai-api-key=")
class ArenaPlusApiIntegrationTest {

    private static final AtomicInteger SEQ = new AtomicInteger();

    @Autowired
    MockMvc mvc;

    /** Usuário de teste já cadastrado e autenticado. */
    record U(long id, String token, String email) {
    }

    // ---------- helpers ----------

    private ResultActions run(MockHttpServletRequestBuilder b, String token, String json) throws Exception {
        if (token != null) b.header("Authorization", "Bearer " + token);
        if (json != null) b.contentType(MediaType.APPLICATION_JSON).content(json);
        return mvc.perform(b);
    }

    private ResultActions doGet(String t, String url) throws Exception {
        return run(MockMvcRequestBuilders.get(url), t, null);
    }

    private ResultActions doPost(String t, String url, String json) throws Exception {
        return run(MockMvcRequestBuilders.post(url), t, json);
    }

    private ResultActions doPut(String t, String url, String json) throws Exception {
        return run(MockMvcRequestBuilders.put(url), t, json);
    }

    private ResultActions doPatch(String t, String url, String json) throws Exception {
        return run(MockMvcRequestBuilders.patch(url), t, json);
    }

    private ResultActions doDelete(String t, String url) throws Exception {
        return run(MockMvcRequestBuilders.delete(url), t, null);
    }

    private long id(ResultActions r) throws Exception {
        return ((Number) JsonPath.read(r.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
    }

    private String str(ResultActions r, String path) throws Exception {
        return JsonPath.read(r.andReturn().getResponse().getContentAsString(), path);
    }

    private U novoUsuario(String nome) throws Exception {
        String email = nome.toLowerCase().replace(' ', '.') + SEQ.incrementAndGet() + "@teste.dev";
        long id = id(doPost(null, "/api/usuarios", """
                {"nome":"%s","email":"%s","senha":"segredo123","esportePrincipal":"Futebol"}
                """.formatted(nome, email)).andExpect(status().isCreated()));
        String token = str(doPost(null, "/api/auth/login", """
                {"email":"%s","senha":"segredo123"}
                """.formatted(email)).andExpect(status().isOk()), "$.token");
        return new U(id, token, email);
    }

    private long novaComunidade(U criador) throws Exception {
        return id(doPost(criador.token(), "/api/comunidades", """
                {"nome":"Corrida SP","descricao":"Treinos de corrida","esporte":"Corrida"}
                """).andExpect(status().isCreated()));
    }

    private long novaPublicacao(U autor) throws Exception {
        return id(doPost(autor.token(), "/api/publicacoes", """
                {"texto":"Treino concluído!"}
                """).andExpect(status().isCreated()));
    }

    private static byte[] jpeg(int tamanho) {
        byte[] b = new byte[tamanho];
        Arrays.fill(b, (byte) 7);
        b[0] = (byte) 0xFF; b[1] = (byte) 0xD8; b[2] = (byte) 0xFF; b[3] = (byte) 0xE0;
        return b;
    }

    private static byte[] png() {
        byte[] b = new byte[64];
        byte[] sig = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
        System.arraycopy(sig, 0, b, 0, sig.length);
        return b;
    }

    private static byte[] webp() {
        byte[] b = new byte[64];
        System.arraycopy("RIFF".getBytes(), 0, b, 0, 4);
        System.arraycopy("WEBP".getBytes(), 0, b, 8, 4);
        return b;
    }

    private static byte[] mp4(String marca) {
        byte[] b = new byte[2048];
        b[3] = 0x18;
        System.arraycopy("ftyp".getBytes(), 0, b, 4, 4);
        System.arraycopy(marca.getBytes(), 0, b, 8, 4);
        return b;
    }

    @Test
    void eventosRespeitamInscricaoVagasEPermissoes() throws Exception {
        U organizador = novoUsuario("Organizador Evento");
        U atleta = novoUsuario("Atleta Evento");
        U terceiro = novoUsuario("Terceiro Evento");
        U quarto = novoUsuario("Quarto Evento");
        String quando = java.time.LocalDateTime.now().plusDays(2).withNano(0).toString();
        long evento = id(doPost(organizador.token(), "/api/eventos", """
                {"modalidade":"Corrida","titulo":"Treino no parque","descricao":"Rodagem leve","cidade":"Sao Paulo","local":"Parque Central","dataHora":"%s","vagasMaximas":2}
                """.formatted(quando)).andExpect(status().isCreated()));
        doPost(atleta.token(), "/api/eventos/" + evento + "/participar", null).andExpect(status().isOk());
        doPost(atleta.token(), "/api/eventos/" + evento + "/participar", null).andExpect(status().isConflict());
        doPost(terceiro.token(), "/api/eventos/" + evento + "/participar", null).andExpect(status().isOk());
        doPost(quarto.token(), "/api/eventos/" + evento + "/participar", null).andExpect(status().isConflict());
        doPatch(terceiro.token(), "/api/eventos/" + evento + "/cancelar", "{}").andExpect(status().isForbidden());
        doGet(atleta.token(), "/api/eventos/" + evento).andExpect(status().isOk()).andExpect(jsonPath("$.participantes", is(2)));
        doGet(atleta.token(), "/api/eventos/" + evento + "/participantes").andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void coachSemChaveRetorna503Amigavel() throws Exception {
        U atleta = novoUsuario("Coach sem chave");
        doGet(atleta.token(), "/api/coach/status").andExpect(status().isOk()).andExpect(jsonPath("$.disponivel", is(false)));
        doPost(atleta.token(), "/api/coach/mensagens", "{\"texto\":\"Como aquecer?\"}")
                .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.mensagem", containsString("temporariamente indisponível")));
    }

    private ResultActions upload(String token, String nome, String contentType, byte[] conteudo) throws Exception {
        MockMultipartFile f = new MockMultipartFile("arquivo", nome, contentType, conteudo);
        var b = MockMvcRequestBuilders.multipart("/api/midias").file(f);
        if (token != null) b.header("Authorization", "Bearer " + token);
        return mvc.perform(b);
    }

    // ---------- Autenticação ----------

    @Test
    void cadastroDevolve201SemExporSenhaOuHash() throws Exception {
        doPost(null, "/api/usuarios", """
                {"nome":"Ana","email":"Ana.Cadastro@Teste.dev","senha":"segredo123"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.email").value("ana.cadastro@teste.dev"))
                .andExpect(jsonPath("$.tipoPerfil").value("COMUM"))
                .andExpect(jsonPath("$.ativo").value(true))
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.senhaHash").doesNotExist())
                .andExpect(content().string(not(containsString("$2a$"))));
    }

    @Test
    void cadastroNaoPermiteEscolherTipoPerfilAdministrador() throws Exception {
        doPost(null, "/api/usuarios", """
                {"nome":"Esperto","email":"esperto@teste.dev","senha":"segredo123","tipoPerfil":"ADMINISTRADOR"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipoPerfil").value("COMUM"));
    }

    @Test
    void emailDuplicadoDevolve409() throws Exception {
        String body = """
                {"nome":"Duplicado","email":"duplicado@teste.dev","senha":"segredo123"}
                """;
        doPost(null, "/api/usuarios", body).andExpect(status().isCreated());
        doPost(null, "/api/usuarios", body.replace("duplicado@", "DUPLICADO@"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value(containsString("email")));
    }

    @Test
    void cadastroInvalidoDevolve400ComCampos() throws Exception {
        doPost(null, "/api/usuarios", """
                {"nome":"","email":"nao-e-email","senha":"123"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.email").exists())
                .andExpect(jsonPath("$.campos.senha").exists());
    }

    @Test
    void loginEmiteTokenELogoutRevoga() throws Exception {
        U u = novoUsuario("Login");
        doPost(null, "/api/auth/login", """
                {"email":"%s","senha":"errada999"}
                """.formatted(u.email())).andExpect(status().isUnauthorized());
        doGet(u.token(), "/api/auth/eu")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(u.id()))
                .andExpect(jsonPath("$.senhaHash").doesNotExist());
        doPost(u.token(), "/api/auth/logout", null).andExpect(status().isNoContent());
        doGet(u.token(), "/api/auth/eu").andExpect(status().isUnauthorized());
    }

    @Test
    void apiExigeTokenValido() throws Exception {
        doGet(null, "/api/usuarios").andExpect(status().isUnauthorized());
        doGet("token-inventado", "/api/publicacoes").andExpect(status().isUnauthorized());
        doGet(null, "/api/feed").andExpect(status().isUnauthorized());
        doPost(null, "/api/publicacoes", "{\"texto\":\"x\"}").andExpect(status().isUnauthorized());
        // login e cadastro continuam públicos; documentação e mídia não passam pela API autenticada
        mvc.perform(MockMvcRequestBuilders.get("/v3/api-docs")).andExpect(status().isOk());
    }

    @Test
    void tokenNaoPermiteFingirOutraIdentidade() throws Exception {
        U a = novoUsuario("Alice");
        U b = novoUsuario("Bruno");
        // usuarioId no corpo é ignorado: o autor é sempre o dono do token
        long pub = id(doPost(a.token(), "/api/publicacoes", """
                {"usuarioId":%d,"texto":"Sou a Alice"}
                """.formatted(b.id())).andExpect(status().isCreated()));
        doGet(a.token(), "/api/publicacoes/" + pub).andExpect(jsonPath("$.usuarioId").value(a.id()));
    }

    // ---------- Usuário / privacidade / perfil esportivo ----------

    @Test
    void usuarioInexistenteDevolve404() throws Exception {
        U u = novoUsuario("Qualquer");
        doGet(u.token(), "/api/usuarios/999999")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensagem").value(containsString("999999")));
    }

    @Test
    void emailSoApareceParaODono() throws Exception {
        U a = novoUsuario("Dono Email");
        U b = novoUsuario("Curioso");
        doGet(a.token(), "/api/usuarios/" + a.id()).andExpect(jsonPath("$.email").value(a.email()));
        doGet(b.token(), "/api/usuarios/" + a.id())
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.procuraParceiros").doesNotExist());
    }

    @Test
    void perfilEsportivoEOpcionalEEditavelSomentePeloDono() throws Exception {
        U a = novoUsuario("Atleta");
        U b = novoUsuario("Outro");
        // cadastro sem nenhum campo esportivo já funcionou (novoUsuario); agora o perfil esportivo
        doPut(a.token(), "/api/usuarios/" + a.id(), """
                {"nome":"Atleta","cidade":"Campinas","esportePrincipal":"Corrida","modalidadesFavoritas":"Corrida, Natação",
                 "nivelExperiencia":"AVANCADO","objetivos":"Meia maratona","disponibilidade":"Sábados de manhã",
                 "conquistas":"3º lugar","procuraParceiros":true,"mostrarDisponibilidade":false}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.nivelExperiencia").value("AVANCADO"))
                .andExpect(jsonPath("$.modalidadesFavoritas").value("Corrida, Natação"))
                .andExpect(jsonPath("$.disponibilidade").value("Sábados de manhã"));
        // outro usuário vê o perfil, mas não a disponibilidade (sem consentimento)
        doGet(b.token(), "/api/usuarios/" + a.id())
                .andExpect(jsonPath("$.nivelExperiencia").value("AVANCADO"))
                .andExpect(jsonPath("$.objetivos").value("Meia maratona"))
                .andExpect(jsonPath("$.disponibilidade").doesNotExist());
        doPut(a.token(), "/api/usuarios/" + a.id(), """
                {"nome":"Atleta","disponibilidade":"Sábados de manhã","mostrarDisponibilidade":true}
                """).andExpect(status().isOk());
        doGet(b.token(), "/api/usuarios/" + a.id()).andExpect(jsonPath("$.disponibilidade").value("Sábados de manhã"));
        // terceiro não edita o perfil alheio
        doPut(b.token(), "/api/usuarios/" + a.id(), "{\"nome\":\"Hackeado\"}").andExpect(status().isForbidden());
        doPut(a.token(), "/api/usuarios/" + a.id(), "{\"nome\":\"Atleta\",\"nivelExperiencia\":\"LENDARIO\"}").andExpect(status().isBadRequest());
    }

    @Test
    void desativarContaRevogaSessoesEExigeSerODono() throws Exception {
        U a = novoUsuario("Sai");
        U b = novoUsuario("Intruso");
        doDelete(b.token(), "/api/usuarios/" + a.id()).andExpect(status().isForbidden());
        doDelete(a.token(), "/api/usuarios/" + a.id()).andExpect(status().isNoContent());
        doGet(a.token(), "/api/auth/eu").andExpect(status().isUnauthorized());
        doPost(null, "/api/auth/login", """
                {"email":"%s","senha":"segredo123"}
                """.formatted(a.email())).andExpect(status().isUnauthorized());
        doPatch(b.token(), "/api/usuarios/" + a.id() + "/reativar", null).andExpect(status().isForbidden());
    }

    @Test
    void alterarSenhaSoDoProprioUsuario() throws Exception {
        U a = novoUsuario("Senha");
        U b = novoUsuario("Invasor");
        String corpo = "{\"senhaAtual\":\"segredo123\",\"novaSenha\":\"novasenha456\"}";
        doPatch(b.token(), "/api/usuarios/" + a.id() + "/senha", corpo).andExpect(status().isForbidden());
        doPatch(a.token(), "/api/usuarios/" + a.id() + "/senha", "{\"senhaAtual\":\"errada\",\"novaSenha\":\"novasenha456\"}")
                .andExpect(status().isBadRequest());
        doPatch(a.token(), "/api/usuarios/" + a.id() + "/senha", corpo).andExpect(status().isNoContent());
        doPost(null, "/api/auth/login", "{\"email\":\"%s\",\"senha\":\"novasenha456\"}".formatted(a.email())).andExpect(status().isOk());
        doPost(null, "/api/auth/login", "{\"email\":\"%s\",\"senha\":\"segredo123\"}".formatted(a.email())).andExpect(status().isUnauthorized());
    }

    // ---------- Seguimento ----------

    @Test
    void naoPermiteSeguirASiMesmo() throws Exception {
        U u = novoUsuario("Narciso");
        doPost(u.token(), "/api/seguimentos", "{\"seguidoId\":%d}".formatted(u.id()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(containsString("si mesmo")));
    }

    @Test
    void seguimentoDuplicadoDevolve409EDeixarDeSeguirFunciona() throws Exception {
        U a = novoUsuario("Seguidor");
        U b = novoUsuario("Seguido");
        String body = "{\"seguidoId\":%d}".formatted(b.id());
        long seg = id(doPost(a.token(), "/api/seguimentos", body).andExpect(status().isCreated()));
        doPost(a.token(), "/api/seguimentos", body).andExpect(status().isConflict());
        doGet(a.token(), "/api/seguimentos/seguidores/" + b.id())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].seguidor.id").value(a.id()));
        doGet(a.token(), "/api/usuarios/" + b.id() + "/perfil").andExpect(jsonPath("$.totalSeguidores").value(1));
        doGet(a.token(), "/api/seguimentos/verificar?seguidoId=" + b.id()).andExpect(jsonPath("$.segue").value(true));
        // um terceiro não desfaz o seguimento alheio
        U c = novoUsuario("Terceiro");
        doDelete(c.token(), "/api/seguimentos/" + seg).andExpect(status().isForbidden());
        doDelete(a.token(), "/api/seguimentos?seguidoId=" + b.id()).andExpect(status().isNoContent());
        doGet(a.token(), "/api/seguimentos/seguidores/" + b.id()).andExpect(jsonPath("$", hasSize(0)));
    }

    // ---------- Comunidade / MembroComunidade ----------

    @Test
    void criadorViraModeradorEMembroDuplicadoDevolve409() throws Exception {
        U criador = novoUsuario("Criador");
        U outro = novoUsuario("Membro");
        long comunidade = novaComunidade(criador);

        doGet(criador.token(), "/api/membros-comunidade?comunidadeId=" + comunidade)
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].papel").value("MODERADOR"));

        // mesmo enviando papel MODERADOR, quem entra é sempre MEMBRO
        String body = "{\"comunidadeId\":%d,\"papel\":\"MODERADOR\"}".formatted(comunidade);
        doPost(outro.token(), "/api/membros-comunidade", body).andExpect(status().isCreated()).andExpect(jsonPath("$.papel").value("MEMBRO"));
        doPost(outro.token(), "/api/membros-comunidade", body).andExpect(status().isConflict());
        doGet(outro.token(), "/api/comunidades/" + comunidade).andExpect(jsonPath("$.totalMembros").value(2));

        doDelete(outro.token(), "/api/membros-comunidade?comunidadeId=" + comunidade).andExpect(status().isNoContent());
        doGet(outro.token(), "/api/comunidades/" + comunidade).andExpect(jsonPath("$.totalMembros").value(1));
    }

    @Test
    void soModeradorGerenciaComunidadeEPapeis() throws Exception {
        U mod = novoUsuario("Moderador");
        U membro = novoUsuario("Membro");
        long com = novaComunidade(mod);
        long idMembro = id(doPost(membro.token(), "/api/membros-comunidade", "{\"comunidadeId\":%d}".formatted(com)).andExpect(status().isCreated()));
        long idMod = ((Number) JsonPath.read(doGet(mod.token(), "/api/membros-comunidade?comunidadeId=" + com)
                .andReturn().getResponse().getContentAsString(), "$[0].id")).longValue(); // o criador entrou primeiro

        String edicao = "{\"nome\":\"Novo nome\",\"descricao\":\"d\",\"esporte\":\"Corrida\"}";
        doPut(membro.token(), "/api/comunidades/" + com, edicao).andExpect(status().isForbidden());
        doDelete(membro.token(), "/api/comunidades/" + com).andExpect(status().isForbidden());
        doPatch(membro.token(), "/api/membros-comunidade/" + idMembro + "/papel", "{\"papel\":\"MODERADOR\"}").andExpect(status().isForbidden());

        doPut(mod.token(), "/api/comunidades/" + com, edicao).andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Novo nome"));
        doPatch(mod.token(), "/api/membros-comunidade/" + idMembro + "/papel", "{\"papel\":\"MODERADOR\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.papel").value("MODERADOR"));
        // o criador nunca perde a moderação
        doPatch(membro.token(), "/api/membros-comunidade/" + idMod + "/papel", "{\"papel\":\"MEMBRO\"}").andExpect(status().isBadRequest());
    }

    @Test
    void referenciaInexistenteDevolve404() throws Exception {
        U u = novoUsuario("Solto");
        doPost(u.token(), "/api/membros-comunidade", "{\"comunidadeId\":987654}").andExpect(status().isNotFound());
        doPost(u.token(), "/api/curtidas", "{\"publicacaoId\":987654}").andExpect(status().isNotFound());
        doPost(u.token(), "/api/salvos/987654", null).andExpect(status().isNotFound());
    }

    @Test
    void publicarEmComunidadeExigeSerMembro() throws Exception {
        U criador = novoUsuario("Dono");
        U intruso = novoUsuario("Intruso");
        long comunidade = novaComunidade(criador);
        doPost(intruso.token(), "/api/publicacoes", "{\"comunidadeId\":%d,\"texto\":\"Posso?\"}".formatted(comunidade))
                .andExpect(status().isBadRequest());
        doPost(criador.token(), "/api/publicacoes", """
                {"comunidadeId":%d,"texto":"Bem-vindos!","midiaUrl":"img/treino.mp4"}
                """.formatted(comunidade))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.comunidadeNome").value("Corrida SP"))
                .andExpect(jsonPath("$.tipoMidia").value("VIDEO"));
        doGet(criador.token(), "/api/publicacoes?comunidadeId=" + comunidade).andExpect(jsonPath("$.totalElementos").value(1));
    }

    @Test
    void excluirComunidadePreservaPublicacoes() throws Exception {
        U criador = novoUsuario("Fundador");
        long comunidade = novaComunidade(criador);
        long pub = id(doPost(criador.token(), "/api/publicacoes", "{\"comunidadeId\":%d,\"texto\":\"Post na comunidade\"}".formatted(comunidade))
                .andExpect(status().isCreated()));
        doDelete(criador.token(), "/api/comunidades/" + comunidade).andExpect(status().isNoContent());
        doGet(criador.token(), "/api/comunidades/" + comunidade).andExpect(status().isNotFound());
        doGet(criador.token(), "/api/publicacoes/" + pub).andExpect(status().isOk()).andExpect(jsonPath("$.comunidadeId").doesNotExist());
    }

    // ---------- Publicacao / Curtida / Comentario ----------

    @Test
    void curtidaDuplicadaDevolve409EDescurtirFunciona() throws Exception {
        U autor = novoUsuario("Autor");
        U fa = novoUsuario("Fa");
        long pub = novaPublicacao(autor);
        String body = "{\"publicacaoId\":%d}".formatted(pub);
        doPost(fa.token(), "/api/curtidas", body).andExpect(status().isCreated());
        doPost(fa.token(), "/api/curtidas", body).andExpect(status().isConflict());
        doGet(fa.token(), "/api/curtidas/contagem?publicacaoId=" + pub).andExpect(jsonPath("$.total").value(1));
        doGet(fa.token(), "/api/publicacoes/" + pub)
                .andExpect(jsonPath("$.curtidaPeloUsuario").value(true))
                .andExpect(jsonPath("$.totalCurtidas").value(1));
        doGet(autor.token(), "/api/publicacoes/" + pub).andExpect(jsonPath("$.curtidaPeloUsuario").value(false));
        doDelete(fa.token(), "/api/curtidas?publicacaoId=" + pub).andExpect(status().isNoContent());
        doGet(fa.token(), "/api/curtidas/contagem?publicacaoId=" + pub).andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void fluxoCompletoPublicacaoComentarioEdicaoExclusao() throws Exception {
        U autor = novoUsuario("Atleta");
        U amigo = novoUsuario("Amigo");
        long pub = novaPublicacao(autor);

        long com = id(doPost(amigo.token(), "/api/comentarios", "{\"publicacaoId\":%d,\"texto\":\"Boa!\"}".formatted(pub)).andExpect(status().isCreated()));
        doPut(amigo.token(), "/api/comentarios/" + com, "{\"texto\":\"Muito boa!\"}").andExpect(status().isOk()).andExpect(jsonPath("$.texto").value("Muito boa!"));
        doPut(autor.token(), "/api/comentarios/" + com, "{\"texto\":\"Editando o do outro\"}").andExpect(status().isForbidden());
        doPost(amigo.token(), "/api/curtidas", "{\"publicacaoId\":%d}".formatted(pub)).andExpect(status().isCreated());

        doGet(amigo.token(), "/api/comentarios?publicacaoId=" + pub)
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].autor.nome").value("Amigo"));

        // terceiros não editam nem excluem a publicação alheia
        doPut(amigo.token(), "/api/publicacoes/" + pub, "{\"texto\":\"roubada\"}").andExpect(status().isForbidden());
        doDelete(amigo.token(), "/api/publicacoes/" + pub).andExpect(status().isForbidden());

        doPut(autor.token(), "/api/publicacoes/" + pub, "{\"texto\":\"Treino concluído (editado)\",\"midiaUrl\":\"img/foto.jpeg\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataEdicao").exists())
                .andExpect(jsonPath("$.tipoMidia").value("IMAGEM"))
                .andExpect(jsonPath("$.totalComentarios").value(1));
        doPut(autor.token(), "/api/publicacoes/" + pub, "{\"texto\":\"x\",\"tipoMidia\":\"VIDEO\"}").andExpect(status().isBadRequest());

        doDelete(autor.token(), "/api/publicacoes/" + pub).andExpect(status().isNoContent());
        doGet(autor.token(), "/api/publicacoes/" + pub).andExpect(status().isNotFound());
        doGet(autor.token(), "/api/comentarios/" + com).andExpect(status().isNotFound());
    }

    @Test
    void donoDaPublicacaoPodeExcluirComentarioDeTerceiro() throws Exception {
        U autor = novoUsuario("Dono Post");
        U chato = novoUsuario("Chato");
        U outro = novoUsuario("Outro");
        long pub = novaPublicacao(autor);
        long com = id(doPost(chato.token(), "/api/comentarios", "{\"publicacaoId\":%d,\"texto\":\"spam\"}".formatted(pub)).andExpect(status().isCreated()));
        doDelete(outro.token(), "/api/comentarios/" + com).andExpect(status().isForbidden());
        doDelete(autor.token(), "/api/comentarios/" + com).andExpect(status().isNoContent());
    }

    @Test
    void feedMostraPublicacoesDeQuemSegue() throws Exception {
        U leitor = novoUsuario("Leitor");
        U seguido = novoUsuario("Famoso");
        U estranho = novoUsuario("Estranho");
        novaPublicacao(seguido);
        novaPublicacao(estranho);
        doPost(leitor.token(), "/api/seguimentos", "{\"seguidoId\":%d}".formatted(seguido.id())).andExpect(status().isCreated());
        doGet(leitor.token(), "/api/feed")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1))
                .andExpect(jsonPath("$.conteudo[0].autor.id").value(seguido.id()));
    }

    @Test
    void enumInvalidoDevolve400() throws Exception {
        U u = novoUsuario("Enum");
        doPost(u.token(), "/api/publicacoes", "{\"texto\":\"x\",\"midiaUrl\":\"a.png\",\"tipoMidia\":\"GIF\"}").andExpect(status().isBadRequest());
    }

    @Test
    void swaggerEOpenApiDisponiveisComEsquemaBearer() throws Exception {
        mvc.perform(MockMvcRequestBuilders.get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Arena+ API"))
                .andExpect(jsonPath("$.paths['/api/usuarios']").exists())
                .andExpect(jsonPath("$.paths['/api/midias']").exists())
                .andExpect(jsonPath("$.paths['/api/salvos/{publicacaoId}']").exists())
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme").value("bearer"));
    }

    // ---------- Busca e filtros ----------

    @Test
    void buscaIgnoraAcentosMaiusculasEFiltraPorEsporteECidade() throws Exception {
        U logado = novoUsuario("Quem Busca");
        long joana = id(doPost(null, "/api/usuarios", """
                {"nome":"Joana Conceição","email":"joana.acento@teste.dev","senha":"segredo123","cidade":"São José dos Campos","esportePrincipal":"Vôlei"}
                """).andExpect(status().isCreated()));
        U criador = novoUsuario("Criador Busca");
        doPost(criador.token(), "/api/comunidades", """
                {"nome":"Ginástica Rítmica Única","descricao":"Treinos","esporte":"Ginástica"}
                """).andExpect(status().isCreated());

        doGet(logado.token(), "/api/usuarios?busca=CONCEICAO").andExpect(jsonPath("$.conteudo[*].id", hasItem((int) joana)));
        doGet(logado.token(), "/api/usuarios?busca=sao jose").andExpect(jsonPath("$.conteudo[*].id", hasItem((int) joana)));
        doGet(logado.token(), "/api/usuarios?esporte=volei&cidade=sao jose").andExpect(jsonPath("$.conteudo[*].id", hasItem((int) joana)));
        doGet(logado.token(), "/api/usuarios?esporte=basquete&cidade=sao jose").andExpect(jsonPath("$.conteudo[*].id", not(hasItem((int) joana))));
        doGet(logado.token(), "/api/comunidades?busca=ritmica unica").andExpect(jsonPath("$.totalElementos").value(1));
        doGet(logado.token(), "/api/comunidades?esporte=ginastica").andExpect(jsonPath("$.conteudo[*].nome", hasItem("Ginástica Rítmica Única")));
    }

    // ---------- Encontrar parceiros ----------

    @Test
    void parceirosSoListaQuemConsentiuEFiltraPorNivelECidade() throws Exception {
        U buscador = novoUsuario("Buscador");
        U aberto = novoUsuario("Aberto");
        U fechado = novoUsuario("Fechado");
        doPut(aberto.token(), "/api/usuarios/" + aberto.id(), """
                {"nome":"Aberto","cidade":"Recife","esportePrincipal":"Surfe","modalidadesFavoritas":"Surfe, Skate",
                 "nivelExperiencia":"INICIANTE","disponibilidade":"Fins de semana","procuraParceiros":true,"mostrarDisponibilidade":false}
                """).andExpect(status().isOk());
        doPut(fechado.token(), "/api/usuarios/" + fechado.id(), """
                {"nome":"Fechado","cidade":"Recife","esportePrincipal":"Surfe","nivelExperiencia":"INICIANTE"}
                """).andExpect(status().isOk());

        doGet(buscador.token(), "/api/usuarios/parceiros?modalidade=skate&cidade=recife&nivel=INICIANTE")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conteudo[*].id", hasItem((int) aberto.id())))
                .andExpect(jsonPath("$.conteudo[*].id", not(hasItem((int) fechado.id()))))
                .andExpect(jsonPath("$.conteudo[0].disponibilidade").doesNotExist());
        doGet(buscador.token(), "/api/usuarios/parceiros?nivel=PROFISSIONAL").andExpect(jsonPath("$.conteudo[*].id", not(hasItem((int) aberto.id()))));
        doGet(aberto.token(), "/api/usuarios/parceiros?modalidade=surfe").andExpect(jsonPath("$.conteudo[*].id", not(hasItem((int) aberto.id()))));
    }

    // ---------- Upload de mídia ----------

    @Test
    void uploadDeImagemJpegPngWebpEVideoMp4EServidoPeloBackend() throws Exception {
        U u = novoUsuario("Midia");
        String[][] casos = {{"foto.jpg", "image/jpeg", "IMAGEM", ".jpg"}, {"foto.png", "image/png", "IMAGEM", ".png"},
                {"foto.webp", "image/webp", "IMAGEM", ".webp"}, {"video.mp4", "video/mp4", "VIDEO", ".mp4"}};
        byte[][] dados = {jpeg(5000), png(), webp(), mp4("isom")};
        for (int i = 0; i < casos.length; i++) {
            ResultActions r = upload(u.token(), casos[i][0], casos[i][1], dados[i])
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.tipoMidia").value(casos[i][2]))
                    .andExpect(jsonPath("$.url").value(endsWith(casos[i][3])));
            String url = str(r, "$.url");
            // o arquivo é servido publicamente (necessário para <img>/<video>) com o conteúdo enviado
            byte[] baixado = mvc.perform(MockMvcRequestBuilders.get(url)).andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
            org.junit.jupiter.api.Assertions.assertArrayEquals(dados[i], baixado);
        }
    }

    @Test
    void uploadValidaConteudoNaoApenasExtensao() throws Exception {
        U u = novoUsuario("Validador");
        upload(u.token(), "malicioso.jpg", "image/jpeg", "<script>alert(1)</script>".getBytes()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(containsString("Formato não suportado")));
        upload(u.token(), "documento.pdf", "application/pdf", "%PDF-1.4 conteudo".getBytes()).andExpect(status().isBadRequest());
        upload(u.token(), "filme.mov", "video/quicktime", mp4("qt  ")).andExpect(status().isBadRequest());
        upload(u.token(), "vazio.jpg", "image/jpeg", new byte[0]).andExpect(status().isBadRequest());
        upload(u.token(), "grande.jpg", "image/jpeg", jpeg(11 * 1024 * 1024)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(containsString("10 MB")));
        upload(null, "foto.jpg", "image/jpeg", jpeg(100)).andExpect(status().isUnauthorized());
    }

    @Test
    void publicarComMidiaEnviadaEExcluirRemoveOArquivo() throws Exception {
        U u = novoUsuario("Publicador");
        U outro = novoUsuario("Ladrao");
        String url = str(upload(u.token(), "treino.jpg", "image/jpeg", jpeg(3000)).andExpect(status().isCreated()), "$.url");

        // a mídia de um usuário não pode ser usada por outro
        doPost(outro.token(), "/api/publicacoes", "{\"texto\":\"minha?\",\"midiaUrl\":\"%s\"}".formatted(url)).andExpect(status().isBadRequest());
        doPost(u.token(), "/api/publicacoes", "{\"texto\":\"x\",\"midiaUrl\":\"/media/inexistente.jpg\"}").andExpect(status().isBadRequest());

        long pub = id(doPost(u.token(), "/api/publicacoes", "{\"texto\":\"Treino com foto\",\"midiaUrl\":\"%s\"}".formatted(url))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.tipoMidia").value("IMAGEM")).andExpect(jsonPath("$.midiaUrl").value(url)));
        doGet(u.token(), "/api/publicacoes?usuarioId=" + u.id()).andExpect(jsonPath("$.conteudo[0].midiaUrl").value(url));
        mvc.perform(MockMvcRequestBuilders.get(url)).andExpect(status().isOk());

        doDelete(u.token(), "/api/publicacoes/" + pub).andExpect(status().isNoContent());
        mvc.perform(MockMvcRequestBuilders.get(url)).andExpect(status().isNotFound());
    }

    // ---------- Salvar publicações ----------

    @Test
    void salvosSaoPrivadosPersistemEImpedemDuplicidade() throws Exception {
        U autor = novoUsuario("Autor Salvo");
        U leitor = novoUsuario("Leitor Salvo");
        U espiao = novoUsuario("Espiao");
        long pub = novaPublicacao(autor);

        doPost(leitor.token(), "/api/salvos/" + pub, null).andExpect(status().isCreated()).andExpect(jsonPath("$.salvaPeloUsuario").value(true));
        doPost(leitor.token(), "/api/salvos/" + pub, null).andExpect(status().isConflict());
        doGet(leitor.token(), "/api/salvos").andExpect(jsonPath("$.totalElementos").value(1)).andExpect(jsonPath("$.conteudo[0].id").value(pub));
        doGet(leitor.token(), "/api/publicacoes/" + pub).andExpect(jsonPath("$.salvaPeloUsuario").value(true));
        // coleção privada: outro usuário vê a própria coleção, nunca a alheia
        doGet(espiao.token(), "/api/salvos").andExpect(jsonPath("$.totalElementos").value(0));
        doGet(autor.token(), "/api/publicacoes/" + pub).andExpect(jsonPath("$.salvaPeloUsuario").value(false));
        doDelete(espiao.token(), "/api/salvos/" + pub).andExpect(status().isNotFound());

        doDelete(leitor.token(), "/api/salvos/" + pub).andExpect(status().isNoContent());
        doGet(leitor.token(), "/api/salvos").andExpect(jsonPath("$.totalElementos").value(0));
        // excluir a publicação limpa os salvos
        doPost(leitor.token(), "/api/salvos/" + pub, null).andExpect(status().isCreated());
        doDelete(autor.token(), "/api/publicacoes/" + pub).andExpect(status().isNoContent());
        doGet(leitor.token(), "/api/salvos").andExpect(jsonPath("$.totalElementos").value(0));
    }

    // ---------- Chat privado ----------

    @Test
    void chatEntreDoisUsuariosPersisteEContaNaoLidasEImpedeTerceiros() throws Exception {
        U ana = novoUsuario("Ana Chat");
        U bia = novoUsuario("Bia Chat");
        U intruso = novoUsuario("Intruso Chat");

        long conversa = id(doPost(ana.token(), "/api/conversas", "{\"usuarioId\":%d}".formatted(bia.id())).andExpect(status().isOk())
                .andExpect(jsonPath("$.outro.id").value(bia.id())));
        // idempotente: a Bia chega na MESMA conversa
        doPost(bia.token(), "/api/conversas", "{\"usuarioId\":%d}".formatted(ana.id())).andExpect(jsonPath("$.id").value(conversa));
        doPost(ana.token(), "/api/conversas", "{\"usuarioId\":%d}".formatted(ana.id())).andExpect(status().isBadRequest());

        doPost(ana.token(), "/api/conversas/" + conversa + "/mensagens", "{\"texto\":\"Bora treinar sábado?\"}")
                .andExpect(status().isCreated()).andExpect(jsonPath("$.remetenteId").value(ana.id())).andExpect(jsonPath("$.lida").value(false))
                .andExpect(jsonPath("$.enviadaEm").exists());
        long ultima = id(doPost(ana.token(), "/api/conversas/" + conversa + "/mensagens", "{\"texto\":\"Às 8h no parque\"}").andExpect(status().isCreated()));

        // indicador de não lidas: só o destinatário tem
        doGet(bia.token(), "/api/conversas/nao-lidas").andExpect(jsonPath("$.total").value(2));
        doGet(ana.token(), "/api/conversas/nao-lidas").andExpect(jsonPath("$.total").value(0));
        doGet(bia.token(), "/api/conversas").andExpect(jsonPath("$[0].naoLidas").value(2))
                .andExpect(jsonPath("$[0].ultimaMensagem.texto").value("Às 8h no parque")).andExpect(jsonPath("$[0].outro.id").value(ana.id()));

        // um terceiro não lê, não escreve e não conta mensagens alheias
        doGet(intruso.token(), "/api/conversas/" + conversa + "/mensagens").andExpect(status().isForbidden());
        doPost(intruso.token(), "/api/conversas/" + conversa + "/mensagens", "{\"texto\":\"oi\"}").andExpect(status().isForbidden());
        doGet(intruso.token(), "/api/conversas").andExpect(jsonPath("$", hasSize(0)));
        doGet(intruso.token(), "/api/conversas/nao-lidas").andExpect(jsonPath("$.total").value(0));
        doGet(null, "/api/conversas/" + conversa + "/mensagens").andExpect(status().isUnauthorized());

        // abrir a conversa marca como lida
        doGet(bia.token(), "/api/conversas/" + conversa + "/mensagens").andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].texto").value("Bora treinar sábado?"));
        doGet(bia.token(), "/api/conversas/nao-lidas").andExpect(jsonPath("$.total").value(0));
        doPost(bia.token(), "/api/conversas/" + conversa + "/mensagens", "{\"texto\":\"Fechado!\"}").andExpect(status().isCreated());
        // atualização periódica: só o que chegou depois
        doGet(ana.token(), "/api/conversas/" + conversa + "/mensagens?apos=" + ultima).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].texto").value("Fechado!"));
        doPost(ana.token(), "/api/conversas/" + conversa + "/mensagens", "{\"texto\":\"   \"}").andExpect(status().isBadRequest());
        doGet(ana.token(), "/api/conversas/987654/mensagens").andExpect(status().isNotFound());
    }
}
