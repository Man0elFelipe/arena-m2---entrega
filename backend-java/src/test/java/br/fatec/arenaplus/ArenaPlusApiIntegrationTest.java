package br.fatec.arenaplus;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Testes de integração ponta a ponta: controller -> service -> JPA -> H2 em memória. */
@SpringBootTest
@AutoConfigureMockMvc
class ArenaPlusApiIntegrationTest {

    private static final AtomicInteger SEQ = new AtomicInteger();

    @Autowired
    MockMvc mvc;

    // ---------- helpers ----------

    private ResultActions post(String url, String json) throws Exception {
        return mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(url)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private ResultActions put(String url, String json) throws Exception {
        return mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(url)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private long id(ResultActions r) throws Exception {
        return ((Number) JsonPath.read(r.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
    }

    private long novoUsuario(String nome) throws Exception {
        String email = nome.toLowerCase().replace(' ', '.') + SEQ.incrementAndGet() + "@teste.dev";
        return id(post("/api/usuarios", """
                {"nome":"%s","email":"%s","senha":"segredo123","esportePrincipal":"Futebol"}
                """.formatted(nome, email)).andExpect(status().isCreated()));
    }

    private long novaComunidade(long criadorId) throws Exception {
        return id(post("/api/comunidades", """
                {"nome":"Corrida SP","descricao":"Treinos de corrida","esporte":"Corrida","criadorId":%d}
                """.formatted(criadorId)).andExpect(status().isCreated()));
    }

    private long novaPublicacao(long usuarioId) throws Exception {
        return id(post("/api/publicacoes", """
                {"usuarioId":%d,"texto":"Treino concluído!"}
                """.formatted(usuarioId)).andExpect(status().isCreated()));
    }

    // ---------- Usuario ----------

    @Test
    void cadastroDevolve201SemExporSenhaOuHash() throws Exception {
        post("/api/usuarios", """
                {"nome":"Ana","email":"Ana.Cadastro@Teste.dev","senha":"segredo123"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.email").value("ana.cadastro@teste.dev"))
                .andExpect(jsonPath("$.tipoPerfil").value("COMUM"))
                .andExpect(jsonPath("$.ativo").value(true))
                .andExpect(jsonPath("$.dataCadastro").exists())
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.senhaHash").doesNotExist())
                .andExpect(content().string(not(containsString("$2a$"))));
    }

    @Test
    void emailDuplicadoDevolve409() throws Exception {
        String body = """
                {"nome":"Duplicado","email":"duplicado@teste.dev","senha":"segredo123"}
                """;
        post("/api/usuarios", body).andExpect(status().isCreated());
        post("/api/usuarios", body.replace("duplicado@", "DUPLICADO@"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.mensagem").value(containsString("email")));
    }

    @Test
    void cadastroInvalidoDevolve400ComCampos() throws Exception {
        post("/api/usuarios", """
                {"nome":"","email":"nao-e-email","senha":"123"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.email").exists())
                .andExpect(jsonPath("$.campos.senha").exists());
    }

    @Test
    void loginValidaSenhaComBcrypt() throws Exception {
        post("/api/usuarios", """
                {"nome":"Login","email":"login@teste.dev","senha":"segredo123"}
                """).andExpect(status().isCreated());
        post("/api/auth/login", """
                {"email":"login@teste.dev","senha":"segredo123"}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Login"))
                .andExpect(jsonPath("$.senhaHash").doesNotExist());
        post("/api/auth/login", """
                {"email":"login@teste.dev","senha":"errada999"}
                """).andExpect(status().isUnauthorized());
    }

    @Test
    void usuarioInexistenteDevolve404() throws Exception {
        mvc.perform(get("/api/usuarios/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensagem").value(containsString("999999")));
    }

    @Test
    void atualizarEDesativarUsuario() throws Exception {
        long id = novoUsuario("Edita");
        put("/api/usuarios/" + id, """
                {"nome":"Editado","cidade":"Campinas","esportePrincipal":"Tênis"}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Editado"))
                .andExpect(jsonPath("$.cidade").value("Campinas"));
        mvc.perform(delete("/api/usuarios/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/usuarios/" + id)).andExpect(jsonPath("$.ativo").value(false));
        // usuário desativado não pode publicar
        post("/api/publicacoes", """
                {"usuarioId":%d,"texto":"oi"}
                """.formatted(id)).andExpect(status().isBadRequest());
    }

    // ---------- Seguimento ----------

    @Test
    void naoPermiteSeguirASiMesmo() throws Exception {
        long id = novoUsuario("Narciso");
        post("/api/seguimentos", """
                {"seguidorId":%d,"seguidoId":%d}
                """.formatted(id, id))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(containsString("si mesmo")));
    }

    @Test
    void seguimentoDuplicadoDevolve409EDeixarDeSeguirFunciona() throws Exception {
        long a = novoUsuario("Seguidor");
        long b = novoUsuario("Seguido");
        String body = """
                {"seguidorId":%d,"seguidoId":%d}
                """.formatted(a, b);
        post("/api/seguimentos", body).andExpect(status().isCreated());
        post("/api/seguimentos", body).andExpect(status().isConflict());
        mvc.perform(get("/api/seguimentos/seguidores/" + b))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].seguidor.id").value(a));
        mvc.perform(get("/api/usuarios/" + b + "/perfil")).andExpect(jsonPath("$.totalSeguidores").value(1));
        mvc.perform(delete("/api/seguimentos").param("seguidorId", "" + a).param("seguidoId", "" + b))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/seguimentos/seguidores/" + b)).andExpect(jsonPath("$", hasSize(0)));
    }

    // ---------- Comunidade / MembroComunidade ----------

    @Test
    void criadorViraModeradorEMembroDuplicadoDevolve409() throws Exception {
        long criador = novoUsuario("Criador");
        long outro = novoUsuario("Membro");
        long comunidade = novaComunidade(criador);

        mvc.perform(get("/api/membros-comunidade").param("comunidadeId", "" + comunidade))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].papel").value("MODERADOR"));

        String body = """
                {"usuarioId":%d,"comunidadeId":%d}
                """.formatted(outro, comunidade);
        post("/api/membros-comunidade", body).andExpect(status().isCreated()).andExpect(jsonPath("$.papel").value("MEMBRO"));
        post("/api/membros-comunidade", body).andExpect(status().isConflict());
        mvc.perform(get("/api/comunidades/" + comunidade)).andExpect(jsonPath("$.totalMembros").value(2));

        mvc.perform(delete("/api/membros-comunidade").param("usuarioId", "" + outro).param("comunidadeId", "" + comunidade))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/comunidades/" + comunidade)).andExpect(jsonPath("$.totalMembros").value(1));
    }

    @Test
    void referenciaInexistenteDevolve404() throws Exception {
        long u = novoUsuario("Solto");
        post("/api/membros-comunidade", """
                {"usuarioId":%d,"comunidadeId":987654}
                """.formatted(u)).andExpect(status().isNotFound());
        post("/api/comunidades", """
                {"nome":"X","descricao":"Y","esporte":"Z","criadorId":987654}
                """).andExpect(status().isNotFound());
        post("/api/curtidas", """
                {"usuarioId":%d,"publicacaoId":987654}
                """.formatted(u)).andExpect(status().isNotFound());
    }

    @Test
    void publicarEmComunidadeExigeSerMembro() throws Exception {
        long criador = novoUsuario("Dono");
        long intruso = novoUsuario("Intruso");
        long comunidade = novaComunidade(criador);
        post("/api/publicacoes", """
                {"usuarioId":%d,"comunidadeId":%d,"texto":"Posso?"}
                """.formatted(intruso, comunidade)).andExpect(status().isBadRequest());
        post("/api/publicacoes", """
                {"usuarioId":%d,"comunidadeId":%d,"texto":"Bem-vindos!","midiaUrl":"img/treino.mp4"}
                """.formatted(criador, comunidade))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.comunidadeNome").value("Corrida SP"))
                .andExpect(jsonPath("$.tipoMidia").value("VIDEO"));
        mvc.perform(get("/api/publicacoes").param("comunidadeId", "" + comunidade))
                .andExpect(jsonPath("$.totalElementos").value(1));
    }

    @Test
    void excluirComunidadePreservaPublicacoes() throws Exception {
        long criador = novoUsuario("Fundador");
        long comunidade = novaComunidade(criador);
        long pub = id(post("/api/publicacoes", """
                {"usuarioId":%d,"comunidadeId":%d,"texto":"Post na comunidade"}
                """.formatted(criador, comunidade)).andExpect(status().isCreated()));
        mvc.perform(delete("/api/comunidades/" + comunidade)).andExpect(status().isNoContent());
        mvc.perform(get("/api/comunidades/" + comunidade)).andExpect(status().isNotFound());
        mvc.perform(get("/api/publicacoes/" + pub))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comunidadeId").doesNotExist());
    }

    // ---------- Publicacao / Curtida / Comentario ----------

    @Test
    void curtidaDuplicadaDevolve409EDescurtirFunciona() throws Exception {
        long autor = novoUsuario("Autor");
        long fa = novoUsuario("Fa");
        long pub = novaPublicacao(autor);
        String body = """
                {"usuarioId":%d,"publicacaoId":%d}
                """.formatted(fa, pub);
        post("/api/curtidas", body).andExpect(status().isCreated());
        post("/api/curtidas", body).andExpect(status().isConflict());
        mvc.perform(get("/api/curtidas/contagem").param("publicacaoId", "" + pub)).andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/publicacoes/" + pub).param("viewerId", "" + fa))
                .andExpect(jsonPath("$.curtidaPeloUsuario").value(true))
                .andExpect(jsonPath("$.totalCurtidas").value(1));
        mvc.perform(delete("/api/curtidas").param("usuarioId", "" + fa).param("publicacaoId", "" + pub))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/curtidas/contagem").param("publicacaoId", "" + pub)).andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void fluxoCompletoPublicacaoComentarioEdicaoExclusao() throws Exception {
        long autor = novoUsuario("Atleta");
        long amigo = novoUsuario("Amigo");
        long pub = novaPublicacao(autor);

        long com = id(post("/api/comentarios", """
                {"usuarioId":%d,"publicacaoId":%d,"texto":"Boa!"}
                """.formatted(amigo, pub)).andExpect(status().isCreated()));
        put("/api/comentarios/" + com, """
                {"texto":"Muito boa!"}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.texto").value("Muito boa!"));
        post("/api/curtidas", """
                {"usuarioId":%d,"publicacaoId":%d}
                """.formatted(amigo, pub)).andExpect(status().isCreated());

        mvc.perform(get("/api/comentarios").param("publicacaoId", "" + pub))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].autor.nome").value("Amigo"));

        put("/api/publicacoes/" + pub, """
                {"texto":"Treino concluído (editado)","midiaUrl":"img/foto.jpeg"}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.dataEdicao").exists())
                .andExpect(jsonPath("$.tipoMidia").value("IMAGEM"))
                .andExpect(jsonPath("$.totalComentarios").value(1));

        // tipoMidia sem midiaUrl é inválido
        put("/api/publicacoes/" + pub, """
                {"texto":"x","tipoMidia":"VIDEO"}
                """).andExpect(status().isBadRequest());

        // excluir publicação remove comentários e curtidas em cascata
        mvc.perform(delete("/api/publicacoes/" + pub)).andExpect(status().isNoContent());
        mvc.perform(get("/api/publicacoes/" + pub)).andExpect(status().isNotFound());
        mvc.perform(get("/api/comentarios/" + com)).andExpect(status().isNotFound());
    }

    @Test
    void feedMostraPublicacoesDeQuemSegue() throws Exception {
        long leitor = novoUsuario("Leitor");
        long seguido = novoUsuario("Famoso");
        long estranho = novoUsuario("Estranho");
        novaPublicacao(seguido);
        novaPublicacao(estranho);
        post("/api/seguimentos", """
                {"seguidorId":%d,"seguidoId":%d}
                """.formatted(leitor, seguido)).andExpect(status().isCreated());
        mvc.perform(get("/api/usuarios/" + leitor + "/feed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1))
                .andExpect(jsonPath("$.conteudo[0].autor.id").value(seguido));
    }

    @Test
    void buscaIgnoraAcentosEMaiusculas() throws Exception {
        post("/api/usuarios", """
                {"nome":"Joana Conceição","email":"joana.acento@teste.dev","senha":"segredo123","cidade":"São José dos Campos","esportePrincipal":"Vôlei"}
                """).andExpect(status().isCreated());
        long criador = novoUsuario("Criador Busca");
        post("/api/comunidades", """
                {"nome":"Ginástica Rítmica Única","descricao":"Treinos","esporte":"Ginástica","criadorId":%d}
                """.formatted(criador)).andExpect(status().isCreated());

        mvc.perform(get("/api/usuarios").param("busca", "CONCEICAO"))
                .andExpect(jsonPath("$.conteudo[*].nome", hasItem("Joana Conceição")));
        mvc.perform(get("/api/usuarios").param("busca", "sao jose"))
                .andExpect(jsonPath("$.conteudo[*].nome", hasItem("Joana Conceição")));
        mvc.perform(get("/api/comunidades").param("busca", "ritmica unica"))
                .andExpect(jsonPath("$.totalElementos").value(1));
        mvc.perform(get("/api/comunidades").param("esporte", "ginastica"))
                .andExpect(jsonPath("$.conteudo[*].nome", hasItem("Ginástica Rítmica Única")));
    }

    @Test
    void enumInvalidoDevolve400() throws Exception {
        long autor = novoUsuario("Enum");
        post("/api/publicacoes", """
                {"usuarioId":%d,"texto":"x","midiaUrl":"a.png","tipoMidia":"GIF"}
                """.formatted(autor)).andExpect(status().isBadRequest());
    }

    @Test
    void swaggerEOpenApiDisponiveis() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Arena+ API"))
                .andExpect(jsonPath("$.paths['/api/usuarios']").exists())
                .andExpect(jsonPath("$.paths['/api/membros-comunidade']").exists());
    }
}
