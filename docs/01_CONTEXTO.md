# ARENA+ — CONTEXTO DO PROJETO

## Objetivo deste documento
Este documento orienta um agente de programação (Claude) sobre a Arena+. Deve ser lido junto com o ZIP original `arena .zip` e `Arena_Plus_Models_Entidades(1).txt`. **O código existente é a fonte da verdade sobre a implementação atual; este documento não atesta que as funcionalidades estejam operacionais.**

## Visão do produto
Arena+ é uma rede social dedicada ao esporte, voltada a perfis, publicações, comentários, curtidas, conexões entre usuários e comunidades esportivas. A visão ampliada é estimular participação, pertencimento e visibilidade de praticantes e talentos esportivos. Recursos de IA (Arena Coach) e impacto social são possibilidades de evolução, não requisitos mínimos da entrega acadêmica.

## Situação observada no ZIP
- `server.js` e `package.json`: backend Node.js/Express; dependências incluem express, mysql2, bcryptjs, express-session, multer, swagger-jsdoc e swagger-ui-express.
- Diversos arquivos `.php`: legado PHP; não assumir que precisam permanecer ativos.
- `arena_plus.sql` e `database/arena_updates.sql`: esquema/migrações legados MySQL. O SQL principal declara tabelas `usuarios`, `configuracoes_usuario`, `posts`, `curtidas`, `comentarios`, `seguidores`, `comunidades`, `notificacoes`, `membros_comunidade`, `desafios`, `usuarios_desafios`, `arena_coach_base`.
- `arena plus swagger.yml` e `openapi.json`: especificações existentes; verificar coerência com rotas reais antes de reutilizar.
- HTML, CSS, JS e imagens: reaproveitar a interface e identidade visual sempre que possível.
- A aplicação **não foi executada nem validada** nesta análise. Não afirmar que login, feed, chat ou IA funcionam sem teste.

## Escopo acadêmico obrigatório — sete entidades
Transcrever os atributos **exatamente** do arquivo de entidades fornecido; tipos Java, opcionais e regras vêm daquele arquivo. Entidades: `Usuario`, `Publicacao`, `Comentario`, `Curtida`, `Seguimento`, `Comunidade`, `MembroComunidade`.

Relacionamentos conceituais: publicação tem autor e opcionalmente comunidade; comentário e curtida referenciam usuário e publicação; seguimento referencia seguidor e seguido; comunidade tem criador; participação referencia usuário e comunidade.

Regras fundamentais: email único; senha apenas como hash; uma curtida por usuário/publicação; não seguir a si mesmo; seguimento sem duplicidade; apenas um vínculo por usuário/comunidade; mídia opcional e no máximo uma imagem/vídeo por publicação; `tipoPerfil` COMUM ou ADMINISTRADOR; `papel` MEMBRO ou MODERADOR.

## Decisão arquitetural
- **Frontend existente** será preservado e progressivamente integrado à **API Java**.
- **API acadêmica**: Java 21 + Spring Boot + Spring Web + Spring Data JPA + Bean Validation + H2 + springdoc-openapi/Swagger UI + Maven.
- **Node.js** pode permanecer como sistema legado ou suporte a funcionalidades fora do escopo Java; não deve substituir endpoints Java exigidos pelo professor.
- **H2** é banco exclusivo da API Java para a entrega. Não supor sincronização automática com MySQL legado.
- Evitar dependência de MAMP/XAMPP, MySQL, Docker ou serviços pagos para executar a demonstração.

## Meta da entrega
Até segunda-feira, **09/11/2026**: executar backend Java localmente; persistir dados em H2; demonstrar CRUD e relações essenciais no Swagger; ter pelo menos fluxo de frontend integrado (cadastro/perfis/publicações/comunidades) e interface estável. Escopo adicional só depois de validação.

## Regras de colaboração com Claude
Primeiro inventariar arquivos e funcionalidades, identificar entrypoints e dependências, documentar achados. Não reescrever cegamente o projeto. Não apagar arquivos originais; preferir novo diretório `backend-java/`. Não alegar testes que não foram executados. Se alguma ferramenta estiver ausente, registrar bloqueio e fornecer instruções verificáveis.
