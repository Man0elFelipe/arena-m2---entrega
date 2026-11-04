# Prompt para o Codex — continuar a Arena+ 2.2

Cole o texto abaixo na primeira mensagem da sessão do Codex (na raiz do projeto `arena m2`).

---

Você vai continuar o desenvolvimento da **Arena+ 2.2**, uma rede social esportiva (projeto acadêmico FATEC). **Prazo de entrega: segunda-feira, 09/11/2026.** Priorize uma aplicação pequena, estável, funcional e testada, em vez de muitos recursos incompletos.

## 0. Antes de escrever qualquer código

1. Leia `STATUS.md` (seção "Fase 2.2", no topo), `ARQUITETURA.md`, `docs/` e este arquivo.
2. Você está no branch `arena-2.2` (checkpoint anterior: commit `010456f` em `main`). Rode `git log --oneline` e `git status`.
3. Rode `cd backend-java && ./mvnw test` e registre o resultado real. Esperado: **44 testes, 0 falhas**.
4. Suba uma instância isolada para testar, **sem tocar em processos ou bancos do usuário** (não use `pkill` nem `rm -rf backend-java/data`):
   ```bash
   cd backend-java
   ./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=8099 --spring.datasource.url=jdbc:h2:file:/tmp/arena-teste/db;AUTO_SERVER=TRUE --arenaplus.upload.dir=/tmp/arena-teste/uploads --arenaplus.cors.allowed-origins=http://localhost:3099"
   ```
   e o frontend de teste: `PORT=3099 API_BASE_URL=http://localhost:8099/api node frontend/server.js`.
   Contas de demonstração (criadas pelo seeder): `lucas@arenaplus.dev`, `marina@arenaplus.dev`, `rafael@arenaplus.dev`, `beatriz@arenaplus.dev` (senha `arena123`) e `admin@arenaplus.dev` (ADMINISTRADOR).

## 1. Regras inegociáveis

- **Não recrie nada.** Preserve a arquitetura e o visual existentes.
- **Backend:** Java 21, Spring Boot 4.0.9, Spring Data JPA, H2 em arquivo, springdoc/Swagger, Maven Wrapper, DTOs `record`, regras nos `service`, erros pelo `GlobalExceptionHandler`. As 7 entidades acadêmicas (`Usuario`, `Publicacao`, `Comentario`, `Curtida`, `Seguimento`, `Comunidade`, `MembroComunidade`) não podem ser quebradas.
- **Frontend:** HTML + CSS + JavaScript puro, **sem framework e sem build**. Siga **exatamente** o padrão existente:
  - todo acesso à API passa por `window.Api` (`frontend/js/api.js`);
  - todo texto dinâmico passa por `UI.esc()`;
  - URLs de mídia passam por `UI.urlSegura()`;
  - componentes reutilizáveis ficam em `js/components.js`;
  - um script por página em `js/pages/`;
  - estilos em `css/app.css` usando os tokens `:root` já definidos (azul/grafite/laranja, Inter e Plus Jakarta Sans);
  - estados de carregamento (`UI.carregando`/`UI.esqueleto`), vazio (`UI.vazio`), erro (`UI.falha`), toasts e `UI.confirmar` (nada de `alert()`);
  - acessibilidade: `aria-*`, foco visível, `sr-only`; layout responsivo (em ≤ 640 px a navegação vira barra inferior).
- **Segurança:** a identidade vem **só do token Bearer** (`UsuarioAutenticado` injetado nos controllers). Nenhum endpoint aceita `usuarioId` do cliente como identidade. Toda edição/exclusão valida dono, moderador ou administrador. Nunca exponha senha, hash, token ou chave em respostas, logs, Git ou frontend.
- **Chave da OpenAI:** só pela variável de ambiente `OPENAI_API_KEY` (já mapeada em `application.properties` → `arenaplus.coach.openai-api-key`). **Nunca grave a chave em arquivo, no banco, no Git ou no frontend.** Sem a chave, a aplicação continua funcionando e o Coach responde 503 com mensagem amigável. Peça a chave ao usuário apenas para o teste real.
- **Honestidade:** nenhuma funcionalidade é "concluída" sem implementação, integração e teste executado de verdade (testes automáticos + navegador). Registre falhas e limitações com franqueza.
- Faça commits pequenos (um por funcionalidade) no branch `arena-2.2`, com mensagem em português.

## 2. O que JÁ está pronto (não refaça)

- Autenticação por token (`/api/auth/login|logout|eu`), `AuthInterceptor`, limite de requisições, autorização por dono/moderador/admin, privacidade de email e disponibilidade.
- Upload multipart `/api/midias` (JPEG/PNG/WebP até 10 MB, MP4 até 50 MB, validado pelo conteúdo), mídia servida em `/media/**`, exclusão segura de órfãs. **Verificado no navegador**: JPEG, PNG, MP4 reproduzindo, rejeições e persistência após reiniciar.
- Perfil esportivo (modalidades, nível, objetivos, disponibilidade, conquistas, consentimentos `procuraParceiros` e `mostrarDisponibilidade`), foto de perfil por upload. Verificado.
- Publicações salvas (`/api/salvos`), busca de usuários e comunidades sem acento com filtros de esporte e cidade, `/api/usuarios/parceiros`.
- Chat privado: backend completo e testado (`/api/conversas`).
- Frontend: `index`, `feed`, `perfil`, `explorar`, `salvos`, `publicacao`, `comunidades`, `comunidade`, `mensagens`, navegação *Início | Explorar | Publicar | Comunidades | Perfil* + Salvos e Mensagens (com contador de não lidas) no cabeçalho.

## 3. O que FALTA — nesta ordem

### A. Verificar no navegador o que foi escrito mas ainda não foi testado (corrija o que falhar)
1. `mensagens.html`: dois usuários trocando mensagens, contador de não lidas no cabeçalho, atualização periódica, terceiro sem acesso, layout mobile (375 px), `?com=ID`.
2. `explorar.html` (abas Publicações/Pessoas/Comunidades/Encontrar parceiros com filtros e "carregar mais"), `salvos.html`, `publicacao.html?id=`.
3. Salvar/remover dos salvos e **compartilhar** (copiar link; Web Share API quando existir).
4. `comunidades.html` e `comunidade.html` após a adaptação ao token (entrar/sair, criar, publicar na comunidade pelo diálogo, promover moderador, editar/excluir).
5. Procure links quebrados (`grep -rn "pessoas.html\|busca.html" frontend`) e confirme que nenhuma tela principal tem link morto, em desktop e mobile.

### B. P2 — Arena Coach (OpenAI, só no backend)
- Backend: `CoachService` chamando a API oficial da OpenAI (use `java.net.http.HttpClient`, sem dependência nova), modelo em `arenaplus.coach.modelo`, timeout `arenaplus.coach.timeout-segundos`, limite `arenaplus.coach.limite-por-hora` e `max-chars-mensagem` (já nas properties).
- Entidade nova `MensagemCoach` (usuário, papel PERGUNTA/RESPOSTA, texto, data) para o **histórico por usuário autenticado**; ninguém lê o histórico alheio.
- Endpoints (já previstos em `api.js`): `GET /api/coach/status`, `GET /api/coach/mensagens`, `POST /api/coach/mensagens`, `DELETE /api/coach/mensagens`.
- Prompt de sistema em português: orientações gerais de esporte e treino; **não** substitui médico, nutricionista ou treinador; recusar diagnósticos e prescrições; incentivar descanso e segurança; sem incentivar excesso.
- Tratamento de timeout, indisponibilidade (503 sem chave), 429 da OpenAI e limite de uso.
- Frontend: substituir o stub `frontend/js/coach.js` (`window.Coach.montar()` já é chamado em todas as páginas). Desktop: botão flutuante no canto inferior direito com ícone da Arena+, painel animado com minimizar/fechar, histórico, sugestões de perguntas e indicador "respondendo...". Mobile: atalho próprio na navegação, sem cobrir controles.
- Testes automáticos com a chamada HTTP **mockada** (sem gastar créditos) e um teste real manual pelo navegador **só se o usuário fornecer a chave**.

### C. P2 — Eventos esportivos (partidas e treinos)
- Entidades `Evento` (modalidade, título, descrição, cidade, local, data/hora, vagas máximas, organizador, estado ABERTO/ENCERRADO/CANCELADO) e `ParticipacaoEvento` (única por usuário/evento).
- Endpoints (previstos em `api.js`): criar, listar com filtros (modalidade, cidade, busca) e paginação, buscar, `POST|DELETE /{id}/participar`, `GET /{id}/participantes`, `PATCH /{id}/cancelar|encerrar` (só organizador ou admin). Regras: sem inscrição duplicada (409), respeitar o limite de vagas, não participar de evento cancelado/encerrado.
- Frontend: nova aba **Eventos** em `explorar.html` + diálogo "Criar evento" + detalhe com participantes e botão participar/cancelar.
- Testes de integração (criação, duplicidade, limite, permissões, persistência) e no navegador.

### D. Fechamento (obrigatório antes de declarar pronto)
- Estender `scripts/smoke-test-api.sh` com chat, eventos e Coach (sem chave → 503). Hoje ele tem 58 verificações e **não cobre chat**.
- Teste de limite de requisições (`arenaplus.rate-limit.auth-por-minuto`) em classe de teste própria com `@TestPropertySource`.
- **Atualizar a documentação**, que ainda descreve o modelo antigo sem token: `DEMO_SWAGGER.md` (os JSONs ainda têm `usuarioId`; incluir o passo de login + *Authorize*), `README.md`, `ARQUITETURA.md`, `CHECKLIST_ENTREGA.md` e `STATUS.md`.
- Rodar: `./mvnw test`, `scripts/smoke-test-api.sh`, validar o Swagger (login → Authorize → endpoints), reiniciar a API e confirmar que banco e mídias persistem, e confirmar que não há credenciais no repositório (`git grep -nE "sk-[A-Za-z0-9_-]{20,}"` deve ser vazio).
- Registrar em `STATUS.md` os testes **realmente executados**, limitações e a próxima tarefa exata.

### E. P3 (somente se tudo acima estiver estável)
Stories com expiração de 24 h e desafios com progresso e conquistas. Não comece antes de A–D estarem concluídos e testados.

## 4. Fora do escopo
Neo4j, PostgreSQL, deploy, WebSockets e notificações push. (O cabeçalho tem acesso a Mensagens; "Notificações" não existe no backend e **não deve ser simulada** com dados fictícios.)

## 5. Ao final de cada etapa
Informe: arquivos criados/alterados, comandos executados, resultados reais dos testes, problemas conhecidos e próximo passo. Se algo falhar, diga que falhou.
