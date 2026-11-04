# ARENA+ — PLANO DE EXECUÇÃO PARA CLAUDE (PRAZO: SEGUNDA 09/11/2026)

## Instrução principal
Você é o agente de implementação. Receberá este conjunto de documentos, o ZIP do projeto e o TXT das entidades. **Não se limite a escrever recomendações: implemente os arquivos, execute testes e reporte evidências, se o ambiente oferecer execução.** Não invente resultados. Trabalhe em incrementos pequenos e testáveis.

## Ordem obrigatória
### Fase 0 — Inventário e segurança (primeiro)
- Listar arquivos e entrypoints do ZIP; inspecionar `package.json`, `server.js`, `arena_plus.sql`, `openapi.json`, `arena plus swagger.yml` e páginas front.
- Identificar segredos/credenciais em configs e `.env` sem reproduzir valores nos relatórios; não subir segredos.
- Mapear o frontend existente e registrar funcionalidades que parecem existir versus as efetivamente testadas.
- Criar `STATUS.md` com checklist e pendências. Não alterar código legado sem justificativa.

### Fase 1 — Backend Java (prioridade máxima)
- Criar `backend-java/` com Spring Initializr/Maven Wrapper, Java 21 e dependências.
- Criar 7 entidades JPA, repositories, DTOs, services, controllers, validações e tratamento de erros.
- H2 em arquivo, Swagger/OpenAPI configurados; README macOS.
- Compilar, testar e corrigir antes de seguir.

### Fase 2 — Prova de API
- Executar API e testar sequência de ponta a ponta: dois usuários -> comunidade -> adesão -> publicação -> comentário -> curtida -> seguimento -> consultas -> atualizações -> exclusões.
- Testar violações de regra (duplicidades, auto-seguimento, IDs inexistentes).
- Confirmar dados persistidos após reinício; registrar comandos e resultados reais.
- Preparar `DEMO_SWAGGER.md` com exemplos JSON prontos para copiar e sequência de cliques.

### Fase 3 — Frontend integrado
- Mapear e conectar os fluxos mais importantes: cadastro/perfil, feed, comunidades.
- Centralizar base URL e garantir CORS local.
- Rodar frontend + API em portas diferentes, com instruções simples.
- Registrar funcionalidades legadas que continuam no Node e as que agora usam Java.

### Fase 4 — Polimento
- Refinar UI/UX sem comprometer fluxos validados.
- Verificar responsividade, estados de erro, navegação e acessibilidade básica.
- Executar smoke test completo.

### Fase 5 — Entrega
Gerar `README.md`, `STATUS.md`, `DEMO_SWAGGER.md`, `ARQUITETURA.md` e `CHECKLIST_ENTREGA.md`; deixar comandos exatos para macOS; indicar endpoints, dados de teste, limitações e evidências de teste.

## Corte de escopo em caso de atraso
**P0 inegociável:** API Java sobe, H2 funciona, Swagger documenta, 7 entidades modeladas, endpoints básicos testados.
**P1:** frontend integrado a cadastro, publicações e comunidades; regras de negócio e testes essenciais.
**P2:** refinamento visual e responsividade.
**P3:** chat, notificações, IA, gamificação e demais extras.
Não sacrificar P0 para implementar P3.

## Como comunicar progresso
Ao fim de cada fase, informar: arquivos criados/alterados, comandos executados, testes que passaram, erros conhecidos e próximo passo. Se uma dependência externa ou ambiente impedir execução, explicar o bloqueio e fornecer alternativa concreta. Não dizer 'concluído' sem verificação.

## Prompt de início para Claude
'Leia integralmente 01_CONTEXTO.md, 02_REQUISITOS.md, 03_EVOLUCAO.md, 04_PLANO_EXECUCAO.md e o TXT das entidades. Inspecione o ZIP da Arena+ antes de escrever código. Comece pela Fase 0 e em seguida implemente P0 da Fase 1. Preserve o frontend existente, crie a API Java Spring Boot/H2/Swagger em backend-java/, valide com testes reais e mantenha STATUS.md atualizado. Você pode tomar decisões técnicas pequenas, mas documente mudanças de escopo. Priorize uma demonstração funcional para 09/11/2026.'
