package br.fatec.arenaplus.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI arenaPlusOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Arena+ API")
                .version("2.0.0")
                .description("""
                        API REST da Arena+, rede social esportiva (Projeto Interdisciplinar FATEC).
                        Entidades: Usuario, Publicacao, Comentario, Curtida, Seguimento, Comunidade e MembroComunidade.

                        **Aviso:** demonstração acadêmica. As operações identificam o usuário por id no corpo/parâmetros
                        e não há autenticação por token; não é segurança de produção.
                        """)
                .contact(new Contact().name("Equipe Arena+ — FATEC")));
    }
}
