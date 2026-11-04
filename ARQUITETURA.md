# Arena+ 2.0 — Arquitetura

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
| `entity` | 7 entidades JPA + enums `TipoPerfil`, `TipoMidia` e `PapelMembro` (`@Enumerated(STRING)`) |
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
| Publicações | `POST /api/publicacoes` · `GET /api/publicacoes?usuarioId=&comunidadeId=&viewerId=` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}` |
| Comentários | `POST /api/comentarios` · `GET /api/comentarios?publicacaoId=` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}` |
| Curtidas | `POST /api/curtidas` · `GET /api/curtidas?publicacaoId=` · `GET /contagem?publicacaoId=` · `DELETE /{id}` · `DELETE ?usuarioId=&publicacaoId=` |
| Seguimentos | `POST /api/seguimentos` · `GET /seguidores/{id}` · `GET /seguindo/{id}` · `GET /verificar` · `GET /{id}` · `DELETE /{id}` · `DELETE ?seguidorId=&seguidoId=` |
| Comunidades | `POST /api/comunidades` · `GET /api/comunidades?busca=&esporte=` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}` |
| Membros | `POST /api/membros-comunidade` · `GET ?comunidadeId=&usuarioId=` · `GET /{id}` · `PATCH /{id}/papel` · `DELETE /{id}` · `DELETE ?usuarioId=&comunidadeId=` |

Listas paginadas devolvem `{conteudo, pagina, tamanho, totalElementos, totalPaginas, ultima}`, com tamanho máximo de 50 itens.

Erros seguem sempre o formato `{timestamp, status, erro, mensagem, caminho, campos}`.

## Frontend (`frontend/`)

| Arquivo | Papel |
|---|---|
| `js/config.js` | `API_BASE_URL` (único lugar com a URL da API) |
| `js/api.js` | Cliente HTTP centralizado; converte erros em `ApiError(status, mensagem, campos)` |
| `js/session.js` | Guarda `{id, nome, ...}` do usuário logado no `localStorage` (demonstração; não há token) |
| `js/ui.js` | Escape de HTML, URLs seguras, plural, toasts, diálogos, loading em botões, *skeleton*, estados de lista e header |
| `js/components.js` | Card de publicação (curtir otimista, comentários, editar e excluir) e card de comunidade |
| `js/pages/*.js` | Um script por página |
| `server.js` | Servidor estático com proteção contra *path traversal* |

### Matriz de telas: legado → Java

| Tela | Ação | Endpoint legado (Node/PHP) | Endpoint Java | Status |
|---|---|---|---|---|
| `index.html` | Login | `POST /login` (sessão) | `POST /api/auth/login` | Testado no navegador |
| `index.html` | Cadastro | `POST /login` (`acao=cadastro`) | `POST /api/usuarios` | Testado (sucesso, 409, validação) |
| `feed.html` | Feed "Seguindo" | `GET /api/posts?acao=feed` | `GET /api/usuarios/{id}/feed` | Testado |
| `feed.html` | Feed "Explorar" | — | `GET /api/publicacoes?viewerId=` | Implementado |
| `feed.html` | Publicar (geral ou comunidade) | `POST /api/posts` (FormData + upload) | `POST /api/publicacoes` (URL de mídia) | Testado e persistido |
| `feed.html` | Curtir / descurtir | `POST /api/posts acao=curtir` | `POST`/`DELETE /api/curtidas` | Testado e persistido |
| `feed.html` | Comentar | `POST /api/posts acao=comentar` | `POST /api/comentarios` | Testado e persistido |
| `feed.html` | Editar / excluir post | — | `PUT`/`DELETE /api/publicacoes/{id}` | Testado no navegador |
| `feed.html` | Sugestões para seguir | `GET /api/follow?acao=sugestoes` | `GET /api/usuarios` + `GET /seguindo/{id}` | Implementado |
| `perfil.html` | Perfil + estatísticas | `GET /api/usuario` | `GET /api/usuarios/{id}/perfil` | Testado (visual) |
| `perfil.html` | Seguir / deixar de seguir | `POST /api/follow` | `POST`/`DELETE /api/seguimentos` | Testado no navegador |
| `perfil.html` | Editar perfil / desativar conta | `POST /api/usuario` | `PUT`/`DELETE /api/usuarios/{id}` | Testado no navegador |
| `comunidades.html` | Listar / buscar / filtrar | `GET /api/communities?acao=listar` | `GET /api/comunidades` | Testado (visual) |
| `comunidades.html` | Criar comunidade | `POST /api/communities` | `POST /api/comunidades` | Testado no navegador |
| `comunidades.html` | Entrar / sair | `POST /api/communities` | `POST`/`DELETE /api/membros-comunidade` | Testado no navegador |
| `comunidade.html` | Detalhe, membros e posts | `/communities/:id` | `GET /api/comunidades/{id}` + membros + publicações | Testado (visual) |
| `comunidade.html` | Editar / excluir (moderador) | `/communities/:id/admin` | `PUT`/`DELETE /api/comunidades/{id}` | Editar testado no navegador; excluir testado na API |
| `pessoas.html` | Buscar pessoas | `GET /api/search` | `GET /api/usuarios?busca=` | Testado (visual, mobile) |
| `busca.html` | Busca global (pessoas + comunidades, sem acento) | `GET /api/search` | `GET /api/usuarios?busca=` + `GET /api/comunidades?busca=` | Testado no navegador |
| `perfil.html` | Alterar senha | `config.php` | `PATCH /api/usuarios/{id}/senha` | Testado no navegador |
| `comunidade.html` | Promover/rebaixar moderador | `comunidade_admin.php` | `PATCH /api/membros-comunidade/{id}/papel` | Testado no navegador |
| — | Arena Coach (IA), chat, notificações, admin, upload de arquivos | Node/PHP + OpenAI | — | **Fora do escopo P0/P1** (ainda só no legado) |

## Decisões técnicas

1. **Spring Boot 4.0.9** (e não 3.x): é a linha mais estável disponível no Spring Initializr em 11/2026. O springdoc-openapi 3.0.3 é a versão compatível com o Boot 4.
2. **`spring-security-crypto` em vez de Spring Security completo**: o projeto só precisa do BCrypt; não há filtros nem login HTTP. Isso evita configurar segurança pela metade.
3. **Perfil `local` como padrão**: liga o console H2 e o seeder. Os testes usam H2 em memória (`src/test/resources/application.properties`).
4. **`ddl-auto=update`**: adequado ao uso acadêmico. Para produção, usar Flyway (P2).
5. **Mídia como URL** (sem upload): atende à regra de "até uma mídia" sem a complexidade de multipart e armazenamento. O upload fica para depois.
6. **Busca sem acento:** o termo é normalizado em Java (`Busca.normalizar`) e as colunas com `TRANSLATE` no SQL. As tabelas de acentos chegam à consulta por SpEL, sem mudar a assinatura dos repositórios. `TRANSLATE` existe no H2 e no PostgreSQL.
7. **Diálogos sem depender do evento `close`:** a confirmação resolve no clique ou no Esc. O evento `close` é assíncrono e pode ser adiado em abas em segundo plano.
8. **Contadores calculados por publicação** (consultas `count`): simples e corretos para o volume acadêmico. Com volume maior, otimizar com *projections* (N+1 conhecido).
