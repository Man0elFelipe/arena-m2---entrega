# STATUS — Arena+ 2.0

> **Última atualização:** 03/11/2026, Fase B concluída (P0 + P1 verificados).
> **Entrega:** segunda-feira, 09/11/2026.
> **Próximo passo:** Fase C (auditoria final do Opus) e ensaio da apresentação. Leia este arquivo inteiro antes de mexer no código.

## 1. Resumo do estado

| Prioridade | Situação |
|---|---|
| **P0:** API Java, H2, 7 entidades, REST, Swagger, testes, frontend integrado | ✅ **Concluído e verificado** |
| **P1:** UI moderna, responsiva, navegação, estados de carregamento e erro | ✅ **Concluído e verificado** no navegador (desktop 1280 px + mobile 375 px) |
| **P2:** Neo4j, PostgreSQL, deploy, IA avançada | ⛔ Não iniciado (de propósito) |

## 2. Arquitetura e decisões técnicas

O detalhamento completo está em [ARQUITETURA.md](ARQUITETURA.md). Em resumo:

- **Backend:** `backend-java/` com Java 21 (OpenJDK Homebrew 21.0.13), Spring Boot **4.0.9**, Spring Web MVC, Data JPA, Validation, **H2 em arquivo** (`./data/arenaplusdb`), springdoc-openapi **3.0.3**, `spring-security-crypto` (só o BCrypt) e Maven Wrapper. Pacote `br.fatec.arenaplus`.
- **Frontend:** `frontend/`, com HTML/CSS/JS puro. O cliente único fica em `js/api.js` e a URL da API em `js/config.js`. É servido por `server.js` (Node, sem dependências, porta 3000).
- **Legado:** `legacy/` é uma cópia intacta do ZIP (sem `node_modules`). Ele **não** é executado. O Node/PHP dependia de MySQL/MAMP e renderizava `.php` como template, então não dava para ligá-lo à API Java sem manter o MySQL. Por isso, o frontend foi refeito reaproveitando a identidade visual e as imagens.
- **Sem integração Node↔Java:** o frontend fala direto com a API Java via CORS. As origens permitidas ficam em `arenaplus.cors.allowed-origins`.
- **Autenticação:** `POST /api/auth/login` valida o BCrypt e devolve o usuário. O frontend guarda só `{id, nome...}` no `localStorage`. **Não há token**: é uma demonstração acadêmica, avisada no Swagger e no README.
- **Exclusões:**
  - usuário: exclusão lógica (`ativo=false`);
  - publicação: apaga em cascata os comentários e as curtidas;
  - comunidade: remove os membros e desvincula as publicações.
- **Perfil `local`** (padrão): console H2 + seeder de demonstração (5 usuários, 4 comunidades, 4 posts; senha `arena123`). O seeder só roda com o banco vazio.

## 3. Funcionalidades concluídas (executadas e testadas)

### Backend: todas as 7 entidades

Usuario, Publicacao, Comentario, Curtida, Seguimento, Comunidade e MembroComunidade, com os atributos idênticos ao documento de entidades. O tipo `String` dos enums do documento foi implementado como enum Java persistido como STRING (mesmo valor no banco e no JSON).

- CRUD e consultas de todos os recursos (lista de endpoints em [ARQUITETURA.md](ARQUITETURA.md)).
- Regras:
  - email único;
  - BCrypt;
  - curtida única;
  - não seguir a si mesmo;
  - seguimento único;
  - membro único;
  - 404 para referência inexistente;
  - criador vira MODERADOR;
  - só membros publicam na comunidade;
  - uma mídia por publicação;
  - usuário desativado não interage.
- Erros padronizados: 400 (validação, com `campos`), 401, 404, 409 e 500 (sem stacktrace).
- Swagger agrupado por entidade (tags 0 a 7), com exemplos de payload.
- CORS restrito: uma origem estranha recebe 403.

### Frontend (testado no navegador integrado)

| Página | Funcionalidades |
|---|---|
| `index.html` | Login e cadastro, com validação no cliente, erros por campo vindos da API (400/409) e loading |
| `feed.html` | Compor publicação (feed geral ou comunidade, URL de mídia com preview), abas Seguindo/Explorar, "carregar mais", curtir (otimista com rollback), comentários, editar/excluir os próprios posts, sugestões para seguir, comunidades em alta e mini-perfil |
| `perfil.html` | Cabeçalho com estatísticas, seguir/deixar de seguir, abas Publicações/Seguidores/Seguindo, editar perfil e desativar conta |
| `comunidades.html` | Busca com *debounce*, filtro por esporte, criar comunidade, entrar/sair |
| `comunidade.html` | Banner, membros, posts da comunidade, publicar (só membros), gerenciar (editar/excluir) para moderadores |
| `pessoas.html` | Busca de usuários e seguir/deixar de seguir |
| `busca.html` | Busca global (pessoas + comunidades), com *debounce* e URL compartilhável (`?q=`); lupa no header do celular |

**Adicionado na Fase B:**

- **Busca sem diferenciar acentos** (`volei` encontra `Vôlei`, `sao paulo` encontra `São Paulo`): o termo é normalizado em Java (`repository/Busca.java`) e as colunas com `TRANSLATE` no SQL.
- **Moderação de membros:** o moderador promove ou rebaixa membros (`PATCH /membros-comunidade/{id}/papel`), com confirmação.
- **Alterar senha** pela interface (perfil → Editar perfil → Alterar senha), com confirmação da nova senha.
- **Paginação** com "carregar mais" nos posts da comunidade (10 por página).
- **Skeleton loading** (placeholders no formato dos cards) nas listas de posts do feed, do perfil e da comunidade.
- **Plurais corretos** em toda a interface ("1 membro", "1 publicação", "1 seguidor").
- **Card "Esporte que transforma"** no feed, reforçando a proposta social.
- **Inicializador único** (`iniciar.sh` + `Iniciar Arena+.command` para duplo clique):
  - detecta o Java 21;
  - sobe API e frontend juntos e espera a API ficar pronta;
  - reaproveita serviços já rodando;
  - `--limpo` recria o banco;
  - Ctrl+C encerra tudo, inclusive a JVM filha do Maven.
- **Correções:**
  - os diálogos de confirmação dependiam do evento `close`, que o navegador pode adiar em segundo plano; agora resolvem direto no clique e no Esc;
  - os campos de busca das páginas Comunidades e Pessoas ficavam ocultos no celular;
  - no mobile, o banner da comunidade e o compositor de posts tinham layout quebrado.

Recursos gerais da interface:

- **Responsivo:** em ≤ 640 px, a navegação vira barra inferior.
- **Acessibilidade:** foco visível, labels, `aria-live`, `aria-pressed` e `prefers-reduced-motion`.
- **Feedback:** toasts no lugar de `alert()`, `<dialog>` de confirmação para exclusões, botões bloqueados durante envio (sem duplo envio).
- **Estados:** vazio, erro com "Tentar novamente" e carregando.

## 4. Testes executados e resultados reais

| Teste | Comando | Resultado (03/11/2026, Fase B) |
|---|---|---|
| Compilação | `./mvnw compile` | BUILD SUCCESS |
| Suíte completa | `./mvnw test` | **30 testes, 0 falhas**: integração (18) + `contextLoads` (1) + `PublicacaoServiceTest` (8, Mockito) + `SeguimentoServiceTest` (3, Mockito) |
| Busca sem acento | Teste `buscaIgnoraAcentosEMaiusculas` + `curl ?busca=volei` na API rodando | ✅ |
| Inicializador `iniciar.sh` | Subida do zero (cópia nas portas 8099/3099, sem `JAVA_HOME`) + SIGTERM; reaproveitamento com a API já rodando | ✅ Sobe tudo; encerra sem processos órfãos; não mexe em serviços que já estavam rodando |
| Roteiro do DEMO_SWAGGER em banco limpo | Sequência via `curl` | ✅ Ids 6/7/5/5 conferem com o documento |
| Smoke HTTP real (API rodando) | `scripts/smoke-test-api.sh` | **32 ok, 0 falhas** |
| Persistência H2 | Criar usuário → matar a API → subir de novo → `GET /api/usuarios/8` | ✅ Dado presente; seeder não rodou de novo |
| CORS | `OPTIONS` com `Origin: http://localhost:3000` / `http://evil.com` | ✅ Permitido / 403 |
| Swagger UI / OpenAPI / console H2 | `GET /swagger-ui/index.html`, `/v3/api-docs`, `/h2-console/` | ✅ 200; UI renderizada com as 8 tags |
| Frontend: login | Navegador → `lucas@arenaplus.dev` | ✅ Redireciona ao feed |
| Frontend: publicar na comunidade + curtir + comentar | Navegador, conferido via `curl` na API | ✅ Persistido (1 curtida, 1 comentário, `comunidadeNome` correto) |
| Frontend: cadastro | Email duplicado → 409 no campo; validação local; cadastro válido → feed vazio | ✅ |
| Frontend: páginas comunidades, comunidade, perfil, pessoas | Navegador (desktop + mobile 375 px) | ✅ Renderizam; console sem erros |

O que os testes automáticos cobrem:

- cadastro;
- ausência de hash na resposta;
- email duplicado;
- validação de campos;
- login BCrypt;
- 404;
- atualização e desativação;
- auto-seguimento;
- seguimento duplicado e deixar de seguir;
- moderador automático e membro duplicado;
- referências inexistentes;
- publicar exigindo ser membro;
- exclusão de comunidade preservando posts;
- curtida duplicada e descurtir;
- fluxo de comentário, edição e exclusão em cascata;
- feed de quem se segue;
- enum inválido;
- disponibilidade do OpenAPI.

**Fluxos testados no navegador na Fase B** (cada um conferido também na API):

| Fluxo | Resultado |
|---|---|
| Editar post (diálogo) | ✅ Texto atualizado, marca "editado" |
| Excluir post (confirmação) | ✅ Removido da tela; API devolve 404 |
| Criar comunidade | ✅ Redireciona; criador vira moderador |
| Publicar na comunidade | ✅ |
| Gerenciar → editar descrição | ✅ |
| Entrar/sair pela lista de comunidades | ✅ Vínculo criado e removido na API |
| Editar perfil | ✅ Bio e cidade persistidas |
| Alterar senha | ✅ Senha errada → erro; nova senha → login 200; antiga → 401 |
| Desativar conta | ✅ `ativo=false`; login passa a dar 401 |
| Seguir/deixar de seguir no perfil | ✅ Contador e API atualizados |
| Carregar mais (feed Explorar, 17 posts) | ✅ 10 + 7, sem duplicados |
| Carregar mais (comunidade, 12 posts) | ✅ 10 + 2 |
| Promover membro a moderador | ✅ Papel MODERADOR na API |
| Busca global (`vôlei`, `campinas`) | ✅ |
| Sessão com usuário inexistente (banco recriado) | ✅ Volta ao login sozinha |
| 9 páginas, incluindo ids inexistentes | ✅ Sem erros de JavaScript; ids inexistentes mostram estado amigável |

## 5. Pendências e próxima tarefa

### Próxima tarefa exata (Fase C — Opus, auditoria final)

1. Revisar os endpoints, os relacionamentos H2 e as regras (ARQUITETURA.md tem a lista).
2. Revisar a segurança básica e o tratamento de erros.
3. Ensaiar o roteiro do [DEMO_SWAGGER.md](DEMO_SWAGGER.md) com o banco limpo (`rm -rf backend-java/data`).
4. Conferir as instruções do macOS (README) do zero.

### Ideias opcionais (só se sobrar tempo; nada disso é necessário para a entrega)

- Verificação de posse nos `PUT`/`DELETE` (parâmetro `solicitanteId`). É paliativo sem autenticação real.
- Upload real de imagens (hoje a mídia é uma URL).

### Pendências conhecidas / limitações (não são bugs)

- **Busca sem acento cobre os acentos do português** (á, à, â, ã, ä, é, ê, í, ó, ô, õ, ú, ü, ç). Outros caracteres especiais não são normalizados.
- **Sem autenticação por token:** qualquer cliente pode agir em nome de qualquer `usuarioId`. A interface só mostra editar/excluir para o autor ou moderador, mas a API não verifica posse. Se houver tempo, adicionar um parâmetro `solicitanteId` validado nos `PUT`/`DELETE`, ou Spring Security com JWT (P2).
- **Sem upload de arquivo:** a mídia é uma URL (as imagens locais `img/*.jpeg` funcionam).
- **N+1 nos contadores** (`totalCurtidas`/`totalComentarios` por post): aceitável no volume acadêmico.
- **Funcionalidades do legado não migradas:** Arena Coach (IA/OpenAI), chat, notificações, painel admin e desafios. Continuam só em `legacy/` e **não** rodam sem MySQL. Não foram reimplementadas, porque estão fora do P0/P1.
- **Imagens:** algumas fotos herdadas do legado (ex.: `futebol.jpeg`, `volei-selecao.webp`) mostram atletas reais ou são de banco de imagens. Para deploy público, trocar por imagens com licença livre.
- **`legacy/conexao.php`** contém credenciais padrão do MAMP (root/root). Não são segredos reais, mas não publicar o `legacy/` sem revisão. Não há `.env` no ZIP.

## 6. Arquivos criados ou modificados

**Criados:**

- `backend-java/` inteiro (gerado pelo Spring Initializr e depois editado):
  - `pom.xml`: Boot 4.0.9, springdoc 3.0.3 e spring-security-crypto;
  - `application*.properties`;
  - 10 classes em `entity/`, 7 em `repository/`, 25 em `dto/`, 8 em `service/`, 9 em `controller/`, 6 em `exception/`, 4 em `config/`;
  - `src/test/.../ArenaPlusApiIntegrationTest.java`.
- `frontend/`:
  - páginas `index.html`, `feed.html`, `perfil.html`, `comunidades.html`, `comunidade.html` e `pessoas.html`;
  - `css/app.css`;
  - `js/config.js`, `api.js`, `session.js`, `ui.js` e `components.js`;
  - `js/pages/*.js`;
  - `server.js` e `package.json`;
  - `img/` (imagens do legado renomeadas e otimizadas; `academia` e `basquete` passaram de PNG de 1,5–2 MB para JPEG).
- Documentos: `README.md`, `STATUS.md`, `ARQUITETURA.md`, `DEMO_SWAGGER.md` e `CHECKLIST_ENTREGA.md`.
- Configuração: `scripts/smoke-test-api.sh`, `.gitignore` e `.claude/launch.json` (frontend no navegador do Claude).
- `docs/`: cópia dos 4 documentos do projeto + TXT de entidades.

**Fase B, criados:**

- `backend-java/src/main/java/.../repository/Busca.java`;
- `backend-java/src/test/java/.../service/PublicacaoServiceTest.java` e `SeguimentoServiceTest.java`;
- `frontend/busca.html` e `frontend/js/pages/busca.js`.

**Fase B, modificados:**

- `UsuarioRepository`, `ComunidadeRepository`, `UsuarioService` e `ComunidadeService` (busca sem acento);
- `ArenaPlusApiIntegrationTest` (+1 teste);
- `frontend/js/ui.js` (diálogos, `plural`, `esqueleto`, busca no header);
- `frontend/js/components.js`, `js/api.js` (`alterarPapel`, `alterarSenha`) e `js/pages/{feed,perfil,comunidade}.js`;
- `perfil.html`, `comunidade.html`, `feed.html` e `css/app.css`.

**Modificados:** nenhum arquivo do legado. O `legacy/` é uma cópia fiel, sem `node_modules`, `.DS_Store` e `upload/.tmp`.

## 7. Como continuar em outra sessão ou modelo

1. Leia este arquivo e depois o [ARQUITETURA.md](ARQUITETURA.md).
2. Ambiente:

   ```bash
   export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
   ```

   - Tudo de uma vez: `./iniciar.sh` (ou `./iniciar.sh --limpo`)
   - API: `cd backend-java && ./mvnw spring-boot:run`
   - Frontend: `cd frontend && node server.js`

3. Antes de declarar qualquer coisa como concluída, rode `./mvnw test` e `scripts/smoke-test-api.sh` e teste no navegador.
4. Convenções:
   - código e mensagens em português;
   - DTOs como `record`;
   - regras no service, nunca no controller;
   - nenhum endpoint devolve uma entidade JPA;
   - no frontend, toda chamada passa por `window.Api` e todo texto dinâmico passa por `UI.esc()`.
5. Para adicionar um campo, altere: entidade → DTO de entrada/saída → service → teste → interface.
6. Atualize as seções 3, 4, 5 e 6 deste arquivo ao fim de cada etapa.
