# Arena+ 2.2

Rede social esportiva da Arena+ (Projeto Interdisciplinar, FATEC). Esta versão traz:

- uma **API REST em Java 21 / Spring Boot 4** com autenticação Bearer, **H2 em arquivo** e **Swagger UI** (`backend-java/`);
- um **frontend novo**, integrado à API Java e reaproveitando a identidade visual e as imagens do projeto original (`frontend/`);
- o **código legado** (PHP + Node/Express + MySQL), preservado só para referência (`legacy/`).

| Pasta | Conteúdo |
|---|---|
| `backend-java/` | API Java: 7 entidades acadêmicas e entidades auxiliares para auth, mídia, chat, Coach, salvos e eventos |
| `frontend/` | HTML, CSS e JS sem framework, servidos por um servidor Node sem dependências (porta 3000) |
| `legacy/` | Código original do ZIP (não é usado pela nova versão) |
| `docs/` | Documentos do projeto (contexto, requisitos, evolução, plano e entidades) |
| `scripts/` | `smoke-test-api.sh`: teste ponta a ponta via HTTP |

Documentos de acompanhamento: [STATUS.md](STATUS.md) · [ARQUITETURA.md](ARQUITETURA.md) · [DEMO_SWAGGER.md](DEMO_SWAGGER.md) · [CHECKLIST_ENTREGA.md](CHECKLIST_ENTREGA.md)

---

## Como executar no macOS

Os recursos incluem chat privado, eventos esportivos e Arena Coach (IA).

### Configurar o Arena Coach (chave da IA)

A chamada à IA acontece **só no backend Java**; a chave nunca vai para o navegador, para o Git ou para o banco.

1. Copie o exemplo e preencha a chave (o arquivo `.env` já está no `.gitignore`):
   ```bash
   cp .env.example .env
   # edite o .env e preencha ARENAPLUS_COACH_API_KEY=...
   ```
2. Rode `./iniciar.sh`. Ele lê o `.env` (sem imprimir valores) e mostra `✓ Arena Coach: chave encontrada`.
3. Se a API já estiver rodando, **pare-a e inicie de novo**: ela só lê a chave ao subir.

Variáveis aceitas: `ARENAPLUS_COACH_API_KEY` (ou `OPENAI_API_KEY`), `ARENAPLUS_COACH_MODEL` (padrão `gpt-4o-mini`) e `ARENAPLUS_COACH_BASE_URL` (padrão `https://api.openai.com/v1`; serve para qualquer provedor com o formato `chat/completions`).

| Situação | Resposta da API | O que o painel mostra |
|---|---|---|
| Sem chave no servidor | `503` | "Coach não configurado no servidor" + **Verificar novamente** |
| Chave inválida, sem saldo, modelo errado, limite do provedor, 5xx ou timeout | `502` | "O Coach está indisponível agora" + **Tentar de novo** |
| Muitas perguntas (6/min, 30/h por usuário) | `429` | "Muitas perguntas em pouco tempo" |
| Sem conexão com a API | — | "Sem conexão com a API" + **Tentar de novo** |

O motivo exato de uma falha do provedor (status HTTP e corpo, **com a chave mascarada**) aparece no log da API (`logs/api.log`). Ao subir, o log diz se há chave (`Arena Coach configurado: ... chave=(oculta)` ou `Arena Coach SEM CHAVE`).

O Coach só orienta sobre esporte e hábitos de treino; não diagnostica nem prescreve, recusa dor/lesão/dieta restritiva e indica um profissional. O esporte principal, o nível e as comunidades do próprio usuário vão ao provedor como contexto da conversa.

### Jeito rápido: um comando só

```bash
./iniciar.sh
```

Ou dê **duplo clique em `Iniciar Arena+.command`** no Finder.

O script:

1. encontra o Java 21 sozinho (não precisa exportar o `JAVA_HOME`);
2. sobe a API e o frontend no mesmo terminal;
3. espera a API ficar pronta;
4. abre o app e o Swagger no navegador.

**Ctrl+C** encerra tudo. Os logs ficam em `logs/api.log` e `logs/frontend.log`.

| Opção | Efeito |
|---|---|
| `./iniciar.sh --limpo` | Apaga o banco H2 antes de subir; os dados de demonstração são recriados (ideal antes da apresentação) |
| `./iniciar.sh --sem-navegador` | Não abre o navegador |

Se a API ou o frontend já estiverem rodando, o script reaproveita o que já está no ar e não mexe nesses processos. Se a porta estiver ocupada por outro programa, ele avisa qual é.

> Na primeira vez, o macOS pode bloquear o `.command` ("desenvolvedor não identificado"). Nesse caso, clique com o botão direito → **Abrir** → **Abrir**.

Os passos abaixo fazem o mesmo manualmente, em dois terminais.

### 1. Pré-requisitos (uma única vez)

```bash
brew install openjdk@21
```

O Maven não precisa ser instalado: o projeto usa o Maven Wrapper (`./mvnw`). O Node.js (18 ou mais recente) só é necessário para servir o frontend.

Em cada terminal novo, aponte o `JAVA_HOME` para o JDK 21 (ou adicione a linha ao `~/.zshrc`):

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
```

> Em Macs Intel, o caminho começa com `/usr/local/opt/openjdk@21/...`.

### 2. Subir a API Java (terminal 1)

```bash
cd backend-java
./mvnw spring-boot:run
```

Quando aparecer `Started ArenaplusApiApplication`, a API estará disponível. Na primeira execução, o banco é populado com dados de demonstração.

| Recurso | Endereço |
|---|---|
| Swagger UI | http://localhost:8080/swagger-ui/index.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |
| Console H2 | http://localhost:8080/h2-console |

Dados do console H2:

- **JDBC URL:** `jdbc:h2:file:./data/arenaplusdb;AUTO_SERVER=TRUE`
- **Usuário:** `sa`
- **Senha:** deixe em branco

O banco fica em `backend-java/data/arenaplusdb.mv.db`. Esse arquivo é ignorado pelo Git.

### 3. Subir o frontend (terminal 2)

```bash
cd frontend
node server.js
```

Depois, abra http://localhost:3000.

**Contas de demonstração** (todas com a senha `arena123`): `lucas@arenaplus.dev`, `marina@arenaplus.dev`, `rafael@arenaplus.dev`, `beatriz@arenaplus.dev` e `admin@arenaplus.dev` (perfil ADMINISTRADOR).

### 4. Testes

```bash
cd backend-java
./mvnw test                   # 49 testes na revisão de 03/11/2026
../scripts/smoke-test-api.sh  # smoke HTTP (com a API rodando)
```

> O smoke test cria registros no banco de demonstração. Para voltar a um banco limpo, pare a API, apague a pasta `backend-java/data` e suba a API de novo.

### Problemas comuns

| Sintoma | Solução |
|---|---|
| `Unable to locate a Java Runtime` | Instale o JDK 21 e exporte o `JAVA_HOME` (passo 1). |
| `Port 8080 already in use` | Rode `lsof -i :8080` e encerre o processo que está usando a porta. |
| O frontend mostra "Não foi possível conectar à API" | Confira se a API está rodando. Se ela estiver em outra porta, ajuste `frontend/js/config.js`. |
| Erro de CORS ao abrir o HTML direto do disco (`file://`) | Use `node server.js` (porta 3000). Só origens locais conhecidas são liberadas. |

## Segurança

Esta é uma **demonstração acadêmica**:

- as senhas são guardadas apenas como hash BCrypt, e nenhuma resposta expõe a senha ou o hash;
- operações protegidas exigem token Bearer e usam a identidade extraída do token; campos de ID no corpo identificam recursos e nunca substituem essa identidade;
- mensagens privadas e histórico do Coach são filtrados pelo usuário autenticado;
- a chave do Coach vem somente do ambiente/`.env` (`ARENAPLUS_COACH_API_KEY`), nunca é devolvida em respostas nem escrita em log;
- o Swagger e o console H2 não devem ser expostos publicamente.

Veja as limitações em [STATUS.md](STATUS.md).
