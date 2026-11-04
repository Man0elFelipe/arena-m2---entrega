# Demonstração Arena+ 2.2 — Swagger e interface

Pré-requisitos: JDK 21 e Node.js. Inicie a API e o frontend conforme o [README](README.md). Swagger UI: `http://localhost:8080/swagger-ui/index.html`.

## Autenticação no Swagger

1. Execute `POST /api/auth/login` com uma conta de demonstração, por exemplo `lucas@arenaplus.dev` / `arena123`.
2. Copie o valor `token` da resposta (sem aspas).
3. Clique em **Authorize**, cole o token no campo Bearer e confirme. O Swagger enviará `Authorization: Bearer ...` nos endpoints protegidos.
4. Para trocar de usuário, use `POST /api/auth/logout`, clique em **Authorize → Logout** e autorize com o novo token.

Cadastro e login não aceitam usuário autenticado no corpo. Os endpoints identificam a pessoa apenas pelo Bearer token. Não envie `usuarioId`, `seguidorId`, `viewerId` ou IDs equivalentes como identidade; IDs de recurso, como `publicacaoId` e `comunidadeId`, continuam nos payloads quando necessários.

## Sequência rápida

Use os IDs que a API devolver; não presuma valores fixos, pois o banco pode já ter dados.

1. `POST /api/comunidades`:

```json
{"nome":"Corredores de Rua SP","descricao":"Treinos e provas de corrida.","esporte":"Corrida","imagemUrl":"img/academia.jpeg"}
```

O criador é associado como moderador automaticamente.

2. `POST /api/membros-comunidade` para entrar com a conta autorizada:

```json
{"comunidadeId":1}
```

Use uma comunidade existente em vez de repetir esse passo se a conta já for membro. A adesão duplicada devolve 409.

3. `POST /api/publicacoes`:

```json
{"comunidadeId":1,"texto":"Primeiro treino do grupo!"}
```

O autor é inferido do token. Para publicar em comunidade, a pessoa precisa ser membro.

4. `POST /api/comentarios` com `{"publicacaoId":1,"texto":"Bora!"}` e `POST /api/curtidas` com `{"publicacaoId":1}`. Repetir a curtida devolve 409.
5. `GET /api/feed`, `GET /api/comunidades` e `GET /api/usuarios/{id}/perfil` para consultar os dados.
6. `PUT /api/publicacoes/{id}` atualiza texto; `DELETE /api/publicacoes/{id}` remove a publicação se você for o autor, moderador autorizado ou administrador.

## Chat, Eventos e Coach

- Chat: `POST /api/conversas` com `{"usuarioId":2}` inicia ou recupera uma conversa com outro usuário. Mensagens são acessíveis apenas aos participantes; terceiros recebem 403.
- Evento: `POST /api/eventos` com modalidade, título, descrição, cidade, local, data/hora futura e vagas. `POST /api/eventos/{id}/participar` inscreve a conta autorizada; duplicidade e lotação devolvem 409.
- Coach: consulte `GET /api/coach/status`. Sem `OPENAI_API_KEY`, `POST /api/coach/mensagens` devolve 503 amigável e a API restante continua disponível. O histórico é privado por usuário.

## Interface e persistência

No frontend, entre com Lucas e Marina em sessões separadas para demonstrar chat e contador de não lidas. A aba **Eventos** em Explorar permite criar e participar. Ações gravam no H2 em arquivo; pare e reinicie a API sem apagar o diretório do banco para conferir persistência.

## Segurança

Não publique tokens, hashes ou chaves. O Coach lê a chave exclusivamente de `OPENAI_API_KEY`; não é necessário para demonstrar o restante do sistema.
