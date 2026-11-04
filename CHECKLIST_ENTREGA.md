# Checklist de entrega — 09/11/2026

Legenda: ✅ verificado nesta etapa com execução real · 🔶 implementado, falta fechar verificação manual · ⬜ pendente.

## API e segurança

| Critério | Situação | Evidência |
|---|---|---|
| Java 21 / Spring Boot e suíte | ✅ | `./mvnw test`: 49 testes, 0 falhas |
| API isolada sem tocar no banco do projeto | ✅ | Porta 8099, H2 e uploads em `/tmp/arena-teste` |
| Smoke API | ✅ | `scripts/smoke-test-api.sh`: 75 verificações, 0 falhas |
| Identidade Bearer, autorização e limite | ✅ | testes de integração; rate limit em classe própria; chat de terceiro 403 |
| Coach sem chave | ✅ | integração e smoke: POST retorna 503 amigável; chamada HTTP mockada em teste unitário |
| Coach real com OpenAI | 🔶 | não executado. A chave copiada no chat não foi utilizada; requer `OPENAI_API_KEY` ambiente e chave válida/rotacionada. |
| Eventos | ✅ | integração: criar, duplicidade, lotação, permissão e participantes; smoke HTTP |
| Swagger/OpenAPI | ✅ | smoke: `/v3/api-docs` e `/swagger-ui/index.html` retornam 200 |
| Credenciais no Git | ✅ | `git grep -nE 'sk-[A-Za-z0-9_-]{20,}'` sem resultado nesta revisão |

## Interface e demonstração

| Fluxo | Situação | Evidência / pendência |
|---|---|---|
| Chat com duas contas, não lidas e `?com=ID` | ✅ parcial | Lucas/Marina trocaram mensagens; badge de não lidas e link direto confirmados. Polling simultâneo não foi observado em duas sessões. |
| Terceiro sem acesso à conversa | ✅ | teste de integração e smoke retornaram 403; Beatriz só viu conversa independente no navegador. |
| Explorar, abas e filtro | ✅ parcial | quatro abas e filtro por esporte exercitados; carregamento de página seguinte não foi exercitado com volume suficiente. |
| Salvar/remover e detalhe de publicação | ✅ | navegador; salvar apareceu em Salvos e remover retornou ao estado vazio. |
| Compartilhar publicação | 🔶 | botão abre ação e mostra feedback; resultado final de Web Share/cópia para clipboard não foi confirmado neste navegador. |
| Comunidades | ✅ | comunidade temporária criada, recebeu publicação pelo diálogo, foi editada e excluída; Lucas promoveu e rebaixou Marina na comunidade de teste. |
| Coach responsivo | ✅ parcial | painel e mensagem sem chave confirmados em tela móvel estreita; 375 px exatos pendentes. |
| Eventos no navegador | ✅ | criação, inscrição, lista de participantes e horário local conferidos. |
| Persistência após reiniciar API isolada | ✅ | Mesmo banco H2 e uploads em `/tmp/arena-teste`: eventos mantidos na lista e PNG novamente carregado após restart. |
| Stories e desafios (P3) | ⬜ | não iniciar antes do fechamento completo de A–D. |

## Antes da entrega

- [x] Fazer restart da API isolada e consultar evento e arquivo de mídia que já existiam antes do restart.
- [ ] Completar manualmente as verificações de tela listadas acima, incluindo 375 px.
- [ ] Revisar documentos e exemplos antigos para remover payloads de identidade pré-token.
- [ ] Confirmar a revogação da chave exposta e manter segredo apenas no ambiente.
- [ ] Revisar `git diff`, executar a suíte e o smoke novamente após qualquer mudança, e criar commits pequenos em português.
- [ ] Ensaiar apresentação a partir de banco limpo somente na máquina do aluno; não apagar `backend-java/data` durante estes testes.
