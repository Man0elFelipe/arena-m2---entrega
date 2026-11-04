# ARENA+ — EVOLUÇÃO VISUAL, UX E PRODUTO

## Objetivo
Melhorar substancialmente o frontend existente, mantendo a identidade esportiva da Arena+. Não reconstruir telas sem necessidade. **Funcionalidade real e demonstrável tem prioridade sobre aparência ou efeitos.**

## Etapa zero: auditoria
Inspecionar as páginas, estilos, scripts, imagens e fluxos do ZIP. Identificar telas duplicadas PHP/HTML, botões sem ação, navegação quebrada, dados fictícios e dependências de MySQL. Criar uma matriz `tela -> ação -> endpoint atual -> endpoint Java -> status`.

## Direção visual proposta (sujeita à identidade atual)
Visual esportivo contemporâneo, limpo, profissional e enérgico, com hierarquia tipográfica forte, espaçamento consistente, cards bem organizados, estados de interação claros e excelente legibilidade. Preservar logo, cores e recursos próprios já existentes quando adequados. Não copiar interfaces de terceiros.

## Melhorias prioritárias
1. Layout responsivo para celular e desktop; header e navegação coerentes.
2. Login/cadastro e perfil: validações claras, erros amigáveis, feedback de carregamento, dados persistidos.
3. Feed: cards de posts consistentes, autor/data, comentários e curtidas funcionais, estado vazio, atualização após criação.
4. Comunidades: explorar, criar, entrar/sair, ver membros e publicações vinculadas.
5. Busca simples de usuários/comunidades se houver tempo.
6. Acessibilidade: labels, foco visível, contraste, navegação por teclado, `alt` nas imagens, feedback sem depender só de cor.
7. Performance: imagens otimizadas, evitar scripts repetidos, carregamento sob demanda quando útil.
8. Mensagens de sucesso/erro, confirmação de exclusão, estados de loading e prevenção de duplo envio.

## Extras opcionais — somente depois do MVP
Notificações, chat, ranking, desafios, IA Arena Coach, recomendações e painéis avançados. Não prometer recursos não implementados. IA exige avaliação de custo, privacidade e segurança; não bloquear a entrega por isso.

## Qualidade de engenharia
Organizar JS e CSS por responsabilidade; eliminar URLs fixas inconsistentes; centralizar requisições e tratamento de erros; usar componentes reutilizáveis quando fizer sentido, sem introduzir framework grande só por estética. Não quebrar funcionalidades existentes comprovadas.

## Demonstração ideal
Um aluno abre a Arena+ no Mac, cadastra usuário, entra em uma comunidade, cria uma publicação, comenta e curte; em seguida abre o Swagger e demonstra as mesmas entidades e operações; por fim abre o console H2 e verifica persistência. Se login real não estiver pronto, usar fluxo de demonstração claramente identificado, sem fingir autenticação.

## Critérios de aceite UX
Sem links mortos no percurso demonstrado; sem alertas genéricos de navegador quando houver alternativa; formulários com validação; telas utilizáveis em viewport de celular; ações refletem dados reais do backend; erros de rede visíveis e recuperáveis.
