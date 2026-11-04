package br.fatec.arenaplus.config;

import br.fatec.arenaplus.security.UsuarioAutenticado;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    static {
        // o usuário autenticado vem do token, não é parâmetro da requisição
        SpringDocUtils.getConfig().addRequestWrapperToIgnore(UsuarioAutenticado.class);
    }

    @Bean
    public OpenAPI arenaPlusOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Arena+ API")
                        .version("2.2.0")
                        .description("""
                                API REST da Arena+, rede social esportiva (Projeto Interdisciplinar FATEC).

                                **Como testar:** (1) `POST /api/auth/login` com um usuário (ex.: `lucas@arenaplus.dev` / `arena123`);
                                (2) copie o campo `token` da resposta; (3) clique em **Authorize** (cadeado) e cole o token;
                                (4) use qualquer endpoint com **Try it out**. A identidade vem do token: nenhum endpoint
                                aceita `usuarioId` do cliente como identidade. Login e cadastro são públicos.
                                """)
                        .contact(new Contact().name("Equipe Arena+ — FATEC")))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("token opaco")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
