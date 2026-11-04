# ARENA+ — REQUISITOS TÉCNICOS E CRITÉRIOS DE ACEITE

## Missão
Criar **do zero** a API Java, mantendo o frontend já existente e integrando-o gradualmente. O projeto Node/PHP/MySQL no ZIP é legado/referência, não um backend Java pronto. Seguir o documento de sete entidades como contrato de modelagem.

## Stack
Java 21 LTS; Spring Boot compatível com Java 21; Maven Wrapper; Spring Web; Spring Data JPA; H2; Spring Validation; springdoc-openapi compatível com a versão do Spring Boot; Spring Security apenas se necessário e configurado conscientemente. Preferir dependências estáveis, evitar versões inventadas. Aplicação em `backend-java/`, porta 8080 por padrão, frontend/Node em porta distinta (ex.: 3000).

## Configuração H2
Usar H2 em **arquivo**, com diretório local ignorado no Git, por exemplo `jdbc:h2:file:./data/arenaplusdb`; `spring.jpa.hibernate.ddl-auto=update` apenas em desenvolvimento acadêmico. Habilitar console H2 somente no perfil local (`/h2-console`), e explicar JDBC URL/usuário. Não expor console ou Swagger publicamente sem proteção.

## Estrutura sugerida
`backend-java/src/main/java/.../{controller,service,repository,entity,dto,exception,config}`; `src/main/resources/application.properties`; `src/test/java/...`; `README.md`. Usar DTOs de entrada e saída; nunca retornar `senhaHash`; validações com `@NotBlank`, `@Email`, limites de tamanho, referências existentes, `@Enumerated(EnumType.STRING)` quando adequado. Preferir IDs `Long` e datas `LocalDateTime` conforme documento.

## Entidades e campos — contrato obrigatório
### Usuario
`id:Long`, `nome:String`, `email:String`, `senhaHash:String`, `fotoPerfilUrl:String?`, `biografia:String?`, `cidade:String?`, `esportePrincipal:String?`, `tipoPerfil:String` (COMUM/ADMINISTRADOR), `ativo:Boolean`, `dataCadastro:LocalDateTime`.
### Publicacao
`id:Long`, `usuarioId:Long`, `comunidadeId:Long?`, `texto:String`, `midiaUrl:String?`, `tipoMidia:String?` (IMAGEM/VIDEO), `dataPublicacao:LocalDateTime`, `dataEdicao:LocalDateTime?`.
### Comentario
`id:Long`, `usuarioId:Long`, `publicacaoId:Long`, `texto:String`, `dataComentario:LocalDateTime`.
### Curtida
`id:Long`, `usuarioId:Long`, `publicacaoId:Long`, `dataCurtida:LocalDateTime`.
### Seguimento
`id:Long`, `seguidorId:Long`, `seguidoId:Long`, `dataSeguimento:LocalDateTime`.
### Comunidade
`id:Long`, `nome:String`, `descricao:String`, `esporte:String`, `imagemUrl:String?`, `criadorId:Long`, `dataCriacao:LocalDateTime`.
### MembroComunidade
`id:Long`, `usuarioId:Long`, `comunidadeId:Long`, `papel:String` (MEMBRO/MODERADOR), `dataEntrada:LocalDateTime`.

Obs.: `?` indica opcional conforme documento; consultar fonte original para decidir nulidade de outros campos e não modificar a modelagem sem justificar. Modelagem JPA pode usar relacionamentos `@ManyToOne`, mas contratos JSON devem ser simples e sem recursão.

## API REST mínima sugerida
- `/api/usuarios`: POST cadastro; GET lista; GET `/{id}`; PUT/PATCH `/{id}`; desativação controlada se viável.
- `/api/publicacoes`: POST; GET lista/feed; GET `/{id}`; PUT `/{id}`; DELETE `/{id}`.
- `/api/comentarios`: POST; GET por publicação; DELETE `/{id}`.
- `/api/curtidas`: POST; DELETE `/{id}` ou rota de descurtir documentada; GET contagem por publicação.
- `/api/seguimentos`: POST; DELETE; GET seguidores/seguindo por usuário.
- `/api/comunidades`: POST; GET; GET `/{id}`; PUT; DELETE se seguro.
- `/api/membros-comunidade`: POST; DELETE; GET por comunidade.

Manter rotas consistentes; usar `201` na criação, `200` em consultas, `204` em exclusão, `400` validação, `404` inexistente, `409` duplicidade. Respostas de erro padronizadas com mensagem útil. Paginação simples em listas se viável.

## Segurança básica
- Cadastro recebe `senha` e armazena apenas `senhaHash` com BCrypt; jamais expor hash.
- Não colocar credenciais ou chaves reais em repositório. Revisar arquivos legados por segredos antes de enviar a terceiros.
- Sem autenticação robusta, deixar explícito que operações identificadas por `usuarioId` são demonstração acadêmica, **não segurança de produção**. Se implementar autenticação, validar identidade/autorização nos endpoints de alteração.
- CORS limitado à origem local do frontend. Validar tamanho/tipo de mídia e evitar uploads complexos no MVP.

## Integração frontend
Inspecionar HTML/JS existentes; mapear fetches/formulários. Criar camada de cliente API configurável (`API_BASE_URL`); substituir progressivamente chamadas PHP/Node pelas rotas Java para fluxos implementados. Evitar páginas que mostram sucesso sem persistência. Manter recursos Node não migrados isolados e identificados. Não tentar acessar H2 diretamente pelo browser ou Node.

## Swagger — requisito obrigatório
Swagger UI em `http://localhost:8080/swagger-ui/index.html` (ou caminho efetivamente configurado); OpenAPI JSON em `/v3/api-docs`; agrupar endpoints por entidade; documentar exemplos de payload e respostas. Testar manualmente via Try it out: cadastrar dois usuários, criar comunidade, aderir, publicar, comentar, curtir, seguir, listar, editar e excluir; validar persistência após reinício.

## Testes automáticos
Pelo menos testes de serviço ou integração para cadastro, email duplicado, curtida duplicada, auto-seguimento, membro duplicado e referência inexistente. Rodar `./mvnw test` e `./mvnw spring-boot:run` quando ambiente permitir; apresentar logs/resultados reais.

## Critérios de aceite
1. Build Java passa; 2. API sobe sem MAMP/MySQL; 3. H2 persiste entre reinícios; 4. Swagger acessível; 5. sete entidades presentes; 6. regras de unicidade implementadas; 7. nenhum hash vazado; 8. pelo menos cadastro + feed + comunidades integrados ao frontend; 9. README com execução no macOS; 10. checklist honesto de testes executados e pendências.
