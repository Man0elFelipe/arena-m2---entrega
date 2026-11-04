# Arena+ 2.2 — Arquitetura

## Visão geral

```
┌──────────────────────────┐   fetch JSON (CORS)   ┌───────────────────────────────┐
│ frontend/  (porta 3000)  │ ────────────────────▶ │ backend-java/  (porta 8080)   │
│ HTML + CSS + JS puro     │                       │ Spring Boot 4.0.9 / Java 21   │
│ js/api.js = cliente único│ ◀──────────────────── │ controller → service → repo   │
│ server.js (Node, 0 deps) │                       │ JPA/Hibernate → H2 (arquivo)  │
└──────────────────────────┘                       └───────────────────────────────┘
legacy/ (PHP + Node/Express + MySQL): fica só como referência e não participa da execução.
```

### Por que um frontend novo em vez de adaptar as páginas legadas?

O frontend legado não era estático: o `server.js` lia arquivos `.php` como templates, trocava trechos PHP por dados do MySQL (por regex) e respondia em rotas com sessão (`/feed`, `/profile`). Os scripts (`index.js`, `feed_db.js`, `comunidade_app.js`) chamavam rotas Node com `FormData` e parâmetros `?acao=` incompatíveis com uma API REST.

Ligar essas páginas à API Java exigiria manter o Node + MySQL (MAMP) rodando, o que contraria os requisitos. Por isso, o frontend foi refeito como páginas estáticas que preservam:

- a identidade visual: logo, paleta grafite/azul, fontes Inter e Plus Jakarta Sans;
- as imagens esportivas, renomeadas e otimizadas;
- o conteúdo e a proposta social.

O código legado continua intacto em `legacy/`.

## Backend (`backend-java/`)

Pacote base: `br.fatec.arenaplus`.

| Pacote | Responsabilidade |
|---|---|
| `entity` | 7 entidades acadêmicas + entidades auxiliares de mídia, tokens, salvos, chat, Coach e eventos |
| `repository` | Spring Data JPA, com consultas JPQL de busca e feed |
| `service` | Regras de negócio e transações |
| `controller` | Endpoints REST e anotações OpenAPI |
| `dto` | Records de entrada (com Bean Validation) e de saída (sem `senhaHash`) |
| `exception` | Exceções de domínio + `GlobalExceptionHandler` com o formato `ErroResponse` |
| `config` | BCrypt, CORS, OpenAPI e `DemoDataSeeder` |

### Modelo de dados (H2)

| Tabela | Chaves estrangeiras | Restrições únicas |
|---|---|---|
| `usuario` | — | `uk_usuario_email (email)` |
| `publicacao` | `usuario_id → usuario`, `comunidade_id → comunidade` (opcional) | — |
| `comentario` | `usuario_id`, `publicacao_id` | — |
| `curtida` | `usuario_id`, `publicacao_id` | `uk_curtida_usuario_publicacao` |
| `seguimento` | `seguidor_id`, `seguido_id → usuario` | `uk_seguimento_par` |
| `comunidade` | `criador_id → usuario` | — |
| `membro_comunidade` | `usuario_id`, `comunidade_id` | `uk_membro_usuario_comunidade` |
| `conversa` / `mensagem` | participantes e remetente → `usuario` | par de participantes |
| `mensagem_coach` | `usuario_id → usuario` | — |
| `evento` | organizador → `usuario` | — |
| `participacao_evento` | evento e usuário | `uk_evento_usuario` |

As relações são `@ManyToOne(LAZY)` no JPA. No JSON, elas viram ids simples (`usuarioId`, `comunidadeId`...) mais resumos (`autor`, `seguidor`...), sem recursão.

### Regras de negócio implementadas

| Regra | Onde | HTTP |
|---|---|---|
| Email único (sem diferenciar maiúsculas; normalizado para minúsculas) | `UsuarioService.cadastrar` + restrição única | 409 |
| Senha guardada só como hash BCrypt | `UsuarioService` + `PasswordEncoder` | — |
| Curtida única por usuário/publicação | `CurtidaService.curtir` + restrição única | 409 |
| Não seguir a si mesmo | `SeguimentoService.seguir` | 400 |
| Seguimento sem duplicidade | `SeguimentoService.seguir` + restrição única | 409 |
| Um vínculo por usuário/comunidade | `MembroComunidadeService.entrar` + restrição única | 409 |
| Referência inexistente | `obter(id)` em cada service | 404 |
| Criador da comunidade entra como MODERADOR | `ComunidadeService.criar` | — |
| Só membros publicam na comunidade | `PublicacaoService.criar` | 400 |
| No máximo uma mídia; `tipoMidia` sem `midiaUrl` é inválido; tipo inferido pela extensão | `PublicacaoService.aplicarMidia` | 400 |
| Usuário desativado não cria conteúdo nem relações | `UsuarioService.obterAtivo` | 400 |
| Excluir publicação apaga também comentários e curtidas | `PublicacaoService.excluir` | 204 |
| Excluir comunidade remove os membros e desvincula (sem apagar) as publicações | `ComunidadeService.excluir` | 204 |
| Excluir usuário é lógico (`ativo=false`) | `UsuarioService.desativar` | 204 |
| Corrida entre requisições iguais (proteção final) | `DataIntegrityViolationException` → handler | 409 |

### Endpoints

| Recurso | Endpoints |
|---|---|
| Auth | `POST /api/auth/login` |
| Usuários | `POST /api/usuarios` · `GET /api/usuarios?busca=&pagina=&tamanho=` · `GET /{id}` · `GET /{id}/perfil` · `GET /{id}/feed` · `PUT /{id}` · `PATCH /{id}/senha` · `DELETE /{id}` · `PATCH /{id}/reativar` |
| Publicações | `POST /api/publicacoes` · `GET /api/publicacoes?usuarioId=&comunidadeId=` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}` |
| Comentários | `POST /api/comentarios` · `GET /api/comentarios?publicacaoId=` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}` |
| Curtidas | `POST /api/curtidas` · `GET /api/curtidas?publicacaoId=` · `GET /contagem?publicacaoId=` · `DELETE /{id}` · `DELETE ?publicacaoId=` |
| Seguimentos | `POST /api/seguimentos` · `GET /seguidores/{id}` · `GET /seguindo/{id}` · `GET /verificar?seguidoId=` · `GET /{id}` · `DELETE /{id}` · `DELETE ?seguidoId=` |
| Comunidades | `POST /api/comunidades` · `GET /api/comunidades?busca=&esporte=` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}` |
| Membros | `POST /api/membros-comunidade` · `GET ?comunidadeId=` · `GET /{id}` · `PATCH /{id}/papel` · `DELETE /{id}` · `DELETE ?comunidadeId=` |
| Chat | `GET|POST /api/conversas` · `GET|POST /{id}/mensagens` · `GET /nao-lidas` |
| Coach | `GET /api/coach/status` · `GET|POST|DELETE /api/coach/mensagens` |
| Eventos | `POST /api/eventos` · `GET /api/eventos` · `GET /{id}` · `POST|DELETE /{id}/participar` · `GET /{id}/participantes` · `PATCH /{id}/cancelar|encerrar` |

Listas paginadas devolvem `{conteudo, pagina, tamanho, totalElementos, totalPaginas, ultima}`, com tamanho máximo de 50 itens.

Erros seguem sempre o formato `{timestamp, status, erro, mensagem, caminho, campos}`.

## Autenticação, Coach e Eventos (Fase 2.2)

`POST /api/auth/login` emite um token opaco. O `AuthInterceptor` valida o Bearer e injeta `UsuarioAutenticado`; nos endpoints protegidos, esse principal é a única fonte de identidade. IDs enviados nos corpos indicam recursos relacionados (por exemplo, publicação ou comunidade), nunca o usuário que está agindo. Proprietários, moderadores e administradores são validados nos services.

O chat privado verifica os dois participantes em cada leitura e escrita, inclusive para administradores. Contador e polling usam HTTP periódico, sem WebSockets. Coach grava perguntas e respostas ligadas ao usuário autenticado; a chamada OpenAI usa `java.net.http.HttpClient`, respeita timeout e limites configurados, e lê a chave exclusivamente de `OPENAI_API_KEY`. Sem chave, o status sinaliza indisponibilidade e POST de pergunta retorna 503.

Eventos guardam organizador, estado e capacidade; as participações têm restrição única por evento/usuário. A inscrição usa bloqueio pessimista no evento e devolve 409 para duplicidade ou lotação. Apenas organizador ou administrador pode cancelar/encerrar.

## Frontend (`frontend/`)

| Arquivo | Papel |
|---|---|
| `js/config.js` | `API_BASE_URL` (único lugar com a URL da API) |
| `js/api.js` | Cliente HTTP centralizado; converte erros em `ApiError(status, mensagem, campos)` |
| `js/session.js` | Guarda o usuário público da sessão e o token Bearer no `localStorage` |
| `js/ui.js` | Escape de HTML, URLs seguras, plural, toasts, diálogos, loading em botões, *skeleton*, estados de lista e header |
| `js/components.js` | Card de publicação (curtir otimista, comentários, editar e excluir) e card de comunidade |
| `js/pages/*.js` | Um script por página |
| `server.js` | Servidor estático com proteção contra *path traversal* |

### Mapa atual de telas e endpoints

| Tela | Ações principais | Integração | Verificação nesta etapa |
|---|---|---|---|
| `index.html` | Login e cadastro | `/api/auth/login`, `/api/usuarios` | Login real no navegador; validações cobertas por integração |
| `feed.html` | Feed, publicar, curtir, comentar | `/api/feed`, `/api/publicacoes`, `/api/curtidas`, `/api/comentarios` | Feed renderizado; operações cobertas por suíte/smoke |
| `explorar.html` | Posts, pessoas, comunidades, parceiros e eventos | `/api/publicacoes`, `/api/usuarios`, `/api/comunidades`, `/api/usuarios/parceiros`, `/api/eventos` | Abas/filtro e criação/inscrição de evento verificadas; carregar mais pendente |
| `salvos.html` | Ver e remover salvos | `/api/salvos` | Adicionar, listar e remover verificados no navegador |
| `publicacao.html` | Detalhe, comentários e compartilhar link | `/api/publicacoes/{id}`, `/api/comentarios` | `?id=` verificado; share sem retorno visual conclusivo |
| `mensagens.html` | Conversas, não lidas e atualização periódica | `/api/conversas` | Duas contas e `?com=ID` verificados; polling simultâneo pendente |
| `comunidades.html`, `comunidade.html` | Busca, entrar/sair, publicar e gerenciar | `/api/comunidades`, `/api/membros-comunidade`, `/api/publicacoes` | Filtro, adesão e diálogo de publicação vistos; moderação e CRUD manual pendentes |
| Todas as páginas autenticadas | Painel Arena Coach | `/api/coach/status`, `/api/coach/mensagens` | Estado sem chave confirmado; API HTTP mockada nos testes; sem chamada real à OpenAI |

## Decisões técnicas

1. **Spring Boot 4.0.9** (e não 3.x): é a linha mais estável disponível no Spring Initializr em 11/2026. O springdoc-openapi 3.0.3 é a versão compatível com o Boot 4.
2. **Interceptor Bearer com principal próprio**: o token é validado pelo `AuthInterceptor`; `UsuarioAutenticado` injeta a identidade nos controllers. `spring-security-crypto` fornece BCrypt.
3. **Perfil `local` como padrão**: liga o console H2 e o seeder. Os testes usam H2 em memória (`src/test/resources/application.properties`).
4. **`ddl-auto=update`**: adequado ao uso acadêmico. Para produção, usar Flyway (P2).
5. **Mídia por upload validado**: imagens e vídeos passam por validação de conteúdo e limites; arquivos ficam no diretório configurado e são servidos em `/media/**`. A publicação referencia a URL da mídia.
6. **Busca sem acento:** o termo é normalizado em Java (`Busca.normalizar`) e as colunas com `TRANSLATE` no SQL. As tabelas de acentos chegam à consulta por SpEL, sem mudar a assinatura dos repositórios. `TRANSLATE` existe no H2 e no PostgreSQL.
7. **Diálogos sem depender do evento `close`:** a confirmação resolve no clique ou no Esc. O evento `close` é assíncrono e pode ser adiado em abas em segundo plano.
8. **Contadores calculados por publicação** (consultas `count`): simples e corretos para o volume acadêmico. Com volume maior, otimizar com *projections* (N+1 conhecido).
