# Checklist de entrega — 09/11/2026

Legenda: ✅ verificado com execução real · 🔶 implementado, falta verificação manual · ⬜ pendente

## Critérios de aceite (02_REQUISITOS.md)

| # | Critério | Status | Evidência |
|---|---|---|---|
| 1 | O build Java passa | ✅ | `./mvnw test` → 30 testes, BUILD SUCCESS |
| 2 | A API sobe sem MAMP/MySQL | ✅ | `./mvnw spring-boot:run`, só com H2 |
| 3 | O H2 persiste entre reinícios | ✅ | Usuário criado antes do restart continua presente depois |
| 4 | Swagger acessível | ✅ | `/swagger-ui/index.html` (200, 8 grupos) |
| 5 | As sete entidades estão presentes | ✅ | `entity/` + tabelas no H2 |
| 6 | Regras de unicidade implementadas | ✅ | Testes: email, curtida, seguimento e membro (409) |
| 7 | Nenhum hash vazado | ✅ | Teste `cadastroDevolve201SemExporSenhaOuHash` + smoke |
| 8 | Cadastro, feed e comunidades integrados ao frontend | ✅ | Testado no navegador e conferido na API |
| 9 | README com execução no macOS | ✅ | `README.md` |
| 10 | Checklist honesto de testes e pendências | ✅ | `STATUS.md` (seções 4 e 5) |

## Antes da apresentação

- ✅ Ids do roteiro do `DEMO_SWAGGER.md` conferidos com o banco limpo (Fase B)
- ✅ Fluxos da interface testados no navegador: editar/excluir post, criar e gerenciar comunidade, entrar/sair, editar perfil, alterar senha, desativar conta, paginação, busca
- ⬜ Auditoria final (Fase C — Opus)
- ⬜ Ensaiar a demonstração (cerca de 10 minutos: frontend → Swagger → H2)
- ⬜ Confirmar o JDK 21 na máquina da apresentação (`java -version`)
- ⬜ Antes de começar, rodar `./iniciar.sh --limpo` (API + frontend com banco limpo)
