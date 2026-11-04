# Roteiro de demonstração: Swagger + Frontend + H2

Pré-requisito: a API e o frontend precisam estar rodando. O mais simples é rodar `./iniciar.sh --limpo` na raiz do projeto, que sobe tudo com um banco limpo.

> **Dica:** para começar com um banco limpo, pare a API, apague a pasta `backend-java/data` e suba a API de novo. Os dados de demonstração são recriados automaticamente.

Os ids abaixo partem de um banco recém-criado pelo seeder: 5 usuários, 4 comunidades e 4 publicações. Os novos registros, portanto, recebem os ids 6, 5 e assim por diante. **Sempre use o `id` devolvido na resposta anterior.**

Swagger: http://localhost:8080/swagger-ui/index.html. Em cada endpoint, clique em **Try it out** → **Execute**.

---

## Parte 1: Swagger (CRUD e regras de negócio)

### 1. Usuários: `POST /api/usuarios` (esperado: 201)

```json
{ "nome": "Ana Souza", "email": "ana@demo.dev", "senha": "senha123", "cidade": "São Paulo", "esportePrincipal": "Corrida" }
```

```json
{ "nome": "Bruno Alves", "email": "bruno@demo.dev", "senha": "senha123", "esportePrincipal": "Futebol" }
```

Mostre que a resposta **não tem `senha` nem `senhaHash`**.

**Regra:** reenvie o JSON da Ana. O resultado é **409**, com a mensagem "Já existe um usuário cadastrado com este email".

**Validação:** envie o JSON abaixo. O resultado é **400**, com o detalhe de cada campo em `campos`.

```json
{ "nome": "", "email": "invalido", "senha": "1" }
```

### 2. Login: `POST /api/auth/login`

```json
{ "email": "ana@demo.dev", "senha": "senha123" }
```

O resultado é 200. Com uma senha errada, o resultado é 401.

### 3. Comunidade: `POST /api/comunidades` (esperado: 201; use o id da Ana)

```json
{ "nome": "Corredores de Rua SP", "descricao": "Treinos e provas de corrida em SP.", "esporte": "Corrida", "imagemUrl": "img/academia.jpeg", "criadorId": 6 }
```

Depois, rode `GET /api/membros-comunidade?comunidadeId=5`: a Ana já aparece como **MODERADOR**.

### 4. Adesão: `POST /api/membros-comunidade` (Bruno)

```json
{ "usuarioId": 7, "comunidadeId": 5 }
```

O resultado é 201. Repetindo a mesma requisição, o resultado é **409** ("já participa").

### 5. Publicação: `POST /api/publicacoes`

```json
{ "usuarioId": 6, "comunidadeId": 5, "texto": "Primeiro treino do grupo: 8 km no Ibirapuera!", "midiaUrl": "img/academia.jpeg" }
```

O resultado é 201, e `tipoMidia` é inferido como `IMAGEM`.

**Regra:** publique com o usuário `1` na comunidade `5`. O resultado é **400**, porque ele não é membro.

### 6. Comentário: `POST /api/comentarios`

```json
{ "usuarioId": 7, "publicacaoId": 5, "texto": "Bora! Semana que vem eu vou." }
```

### 7. Curtida: `POST /api/curtidas`

```json
{ "usuarioId": 7, "publicacaoId": 5 }
```

O resultado é 201. Repetindo, o resultado é **409**. Para conferir o total, rode `GET /api/curtidas/contagem?publicacaoId=5` (resultado: `1`).

### 8. Seguimento: `POST /api/seguimentos`

```json
{ "seguidorId": 7, "seguidoId": 6 }
```

O resultado é 201. Repetindo, o resultado é **409**.

**Regra:** envie o JSON abaixo. O resultado é **400** ("não pode seguir a si mesmo").

```json
{ "seguidorId": 6, "seguidoId": 6 }
```

### 9. Consultas

- `GET /api/usuarios/7/feed`: mostra o post da Ana, porque o Bruno a segue.
- `GET /api/usuarios/6/perfil`: total de publicações, seguidores e seguindo.
- `GET /api/publicacoes?comunidadeId=5&viewerId=7`: `curtidaPeloUsuario: true`.
- `GET /api/seguimentos/seguidores/6`.
- `GET /api/usuarios/999` → **404**.

### 10. Atualizações

`PUT /api/publicacoes/5` (resultado: `dataEdicao` preenchida):

```json
{ "texto": "Primeiro treino do grupo: 10 km no Ibirapuera!" }
```

`PUT /api/usuarios/6`:

```json
{ "nome": "Ana Souza", "biografia": "Maratonista em formação", "cidade": "Campinas", "esportePrincipal": "Corrida" }
```

`PATCH /api/membros-comunidade/{id}/papel`:

```json
{ "papel": "MODERADOR" }
```

### 11. Exclusões (todas devolvem 204)

- `DELETE /api/curtidas?usuarioId=7&publicacaoId=5`
- `DELETE /api/seguimentos?seguidorId=7&seguidoId=6`
- `DELETE /api/membros-comunidade?usuarioId=7&comunidadeId=5`
- `DELETE /api/publicacoes/5` (remove também os comentários e as curtidas)
- `DELETE /api/comunidades/5`
- `DELETE /api/usuarios/7`: exclusão lógica. Em seguida, `GET /api/usuarios/7` mostra `ativo: false`.

---

## Parte 2: Frontend (http://localhost:3000)

1. **Criar conta** com nome, email e senha. O app entra direto no feed, que aparece vazio, com o estado "Seu feed está vazio".
2. Em **Comunidades**, entre em "Futebol de Várzea SP".
3. No **Início**, escreva um post, escolha a comunidade no seletor e clique em **Publicar**.
4. **Curta** e **comente** um post. Os contadores são atualizados.
5. Em **Pessoas**, siga alguém. Volte ao **Início**: os posts dessa pessoa aparecem na aba *Seguindo*.
6. No **Perfil**, use **Editar perfil** (e, se quiser, **Alterar senha**).
7. Na **busca** do topo, digite `volei` sem acento: aparecem Beatriz e a comunidade "Vôlei Universitário".
8. Na comunidade em que você é moderador, use o ícone ao lado de um membro para **torná-lo moderador**.
9. Mostre a versão **mobile** (DevTools → modo responsivo): a navegação vira uma barra inferior.

## Parte 3: Persistência no H2

1. Abra http://localhost:8080/h2-console. Use a JDBC URL `jdbc:h2:file:./data/arenaplusdb;AUTO_SERVER=TRUE`, o usuário `sa` e deixe a senha em branco.
2. Rode as consultas abaixo. A coluna `senha_hash` mostra só o hash BCrypt (`$2a$10$...`).

```sql
SELECT * FROM USUARIO;
SELECT * FROM PUBLICACAO;
SELECT * FROM MEMBRO_COMUNIDADE;
```

3. Pare a API (Ctrl+C) e suba de novo com `./mvnw spring-boot:run`. Os dados continuam lá, e o seeder não roda de novo.
