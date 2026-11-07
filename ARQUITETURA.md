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


## Arena Coach (IA) — configuração, erros e diagnóstico

**Fluxo:** navegador → `POST /api/coach/mensagens` (token Bearer) → `CoachService` → `POST {base-url}/chat/completions` no provedor. A chave só existe no processo da API.

| Peça | Papel |
|---|---|
| `CoachService` | Valida a mensagem, aplica limites (6/min e 30/h por usuário), monta o prompt de sistema + contexto do usuário + últimas 12 falas, chama o provedor e traduz falhas |
| `CoachHistoricoService` | Parte transacional (histórico por usuário e contexto). Separada para a chamada HTTP nunca segurar uma transação |
| `ProvedorIndisponivelException` | `502`: falha do provedor (401/403/404/429/5xx, timeout, rede, resposta vazia ou inválida) |
| `ServicoIndisponivelException` | `503`: servidor sem chave ("Coach não configurado no servidor") |
| `LimiteRequisicoes` | Janela fixa em memória (compartilhada com login e chat) |

**Propriedades** (`application.properties`): `arenaplus.coach.api-key` (`${ARENAPLUS_COACH_API_KEY:${OPENAI_API_KEY:}}`), `base-url`, `model`, `timeout-segundos`, `max-chars-mensagem`, `limite-por-minuto`, `limite-por-hora`. O `iniciar.sh` carrega o `.env` da raiz (não versionado; modelo em `.env.example`).

**Decisões:**
1. O corpo usa `max_completion_tokens` e **não** envia `temperature`: modelos novos recusam `max_tokens` e valores de temperatura diferentes do padrão.
2. **Histórico no H2** (`mensagem_coach`), por usuário autenticado, e não só no navegador. A tabela já existia e é a que torna o histórico privado e persistente. O frontend não reenvia o histórico: o backend lê as últimas 12 falas.
3. Pergunta e resposta são gravadas **juntas, só se o provedor respondeu**; uma falha não deixa pergunta órfã no histórico.
4. Logs: status HTTP e corpo da falha do provedor, passando por `mascarar()`, que troca a chave configurada e qualquer padrão `sk-...` por `****`.

**Causa do "O Arena Coach está temporariamente indisponível"** (código anterior): (a) o `iniciar.sh` não lia `.env` e a propriedade só enxergava `OPENAI_API_KEY` no ambiente do processo Java, então a chave exportada em outro terminal nunca chegava à API e `status.disponivel` ficava `false`; (b) qualquer erro do provedor virava a mesma frase, sem log. Ambos corrigidos.

## Camada visual (Fase 2.2)

Tudo em `frontend/css/app.css` (tokens + "camada premium" no fim do arquivo) e `frontend/js/efeitos.js`. Sem framework nem etapa de build.

- **Profundidade:** vidro fosco (`backdrop-filter` com fallback sólido) no cabeçalho, diálogos, toasts e Coach; sombras em 3 camadas; luz interna; raios de 20–26 px; fundo em gradiente numa camada fixa.
- **3D (só com mouse):** os cards (`comunidade`, `pessoa`, `mini-perfil`, missão) inclinam até 7° seguindo o cursor, com brilho que acompanha o ponteiro e parallax na capa. Ativo apenas em `(hover: hover) and (pointer: fine)`; o JS grava `--rx/--ry/--mx/--my` e o CSS faz o resto.
- **Hero do login:** 4 fotos e a logo em camadas com `perspective`, parallax pelo cursor e flutuação suave (escondido abaixo de 1100 px).
- **Movimento:** entrada escalonada, curtir com anel, pílula deslizante na navegação, "digitando…" no Coach. Só `transform`/`opacity`.
- **Acessibilidade e desempenho:** `prefers-reduced-motion` desliga animações, inclinação e parallax (CSS e JS); foco visível mantido; no celular não há inclinação 3D e a navegação continua sendo a barra inferior (6 atalhos, incluindo Coach).
- **Armadilhas resolvidas:** `animation-fill-mode: both` prendia o `transform` e anulava a inclinação (usa-se `backwards`); `backdrop-filter` no `.topo` prenderia a barra fixa no celular (desligado ≤ 640 px).


## Upload de mídia, capas e eventos (Fase 2.2c)

- **Formatos:** JPEG, PNG, WebP (imagem) e MP4, MOV/QuickTime, WebM (vídeo). `MidiaService.detectar` lê os primeiros bytes: assinaturas de JPEG/PNG/WebP, cabeçalho EBML (WebM) e, na família ISO/QuickTime, a marca do átomo `ftyp` (`qt  ` = MOV, demais = MP4); QuickTime antigo começa direto em `moov`/`mdat`/`wide` e também é reconhecido. O tipo declarado pelo navegador é ignorado (alguns não informam o de `.mov`).
- **Causa do "upload de .MOV falha":** o `MidiaService` rejeitava de propósito a marca `qt  ` (decisão anterior de aceitar só MP4) e o front só aceitava `video/mp4`. O tamanho nunca foi o problema: um MP4 de 4,5 MB passava e o `.mov` de 27 KB era recusado.
- **Limites por ambiente:** `arenaplus.upload.max-imagem-mb` e `max-video-mb` (de `ARENAPLUS_UPLOAD_MAX_*_MB`). `UploadConfig` gera o `MultipartConfigElement` 1 MB acima do maior limite, para a validação por tipo (com mensagem clara) disparar antes do corte genérico do contêiner. `GET /api/midias/limites` entrega limites e formatos ao frontend; o `GlobalExceptionHandler` usa os mesmos valores na mensagem de 413.
- **Capas:** `Comunidade.imagemUrl` e o novo `Evento.imagemUrl` (opcional) passam por `MidiaService.validarCapa`: mídia enviada precisa existir, ser do próprio usuário e ser **imagem**; links precisam ser `http(s)` ou caminho relativo (nunca `javascript:`). Trocar a capa libera o arquivo antigo se ele ficou órfão, e `liberarSeOrfa` agora considera publicações, comunidades **e** eventos (excluir um post não apaga uma imagem que também é capa).
- **Frontend:** `js/upload.js` concentra validação (tipo ou extensão, limite do servidor) e o seletor de imagem (arquivo, arrastar-e-soltar, prévia, link, progresso, erro inline), usado nos modais de comunidade e de evento; o diálogo de publicar usa a mesma validação.
- **Card de evento:** capa (imagem ou degradê por modalidade com ícone), badges de esporte e status, título, descrição em 2 linhas, linhas com ícone (local, data, vagas com barra, organizador) e rodapé de ações. O repouso é reto: o card de evento **não** participa da inclinação 3D (só eleva no hover).
