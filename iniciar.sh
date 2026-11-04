#!/bin/bash
# =============================================================================
#  Arena+ 2.0 — inicializador único (macOS)
#  Sobe a API Java (porta 8080) e o frontend (porta 3000) num só terminal.
#
#  Uso:
#    ./iniciar.sh            inicia tudo e abre o navegador
#    ./iniciar.sh --limpo    apaga o banco H2 antes (dados de demonstração recriados)
#    ./iniciar.sh --sem-navegador
#
#  Ctrl+C encerra a API e o frontend juntos.
# =============================================================================

set -u
RAIZ="$(cd "$(dirname "$0")" && pwd)"
LOGS="$RAIZ/logs"
API_URL="http://localhost:8080"
FRONT_URL="http://localhost:3000"
LIMPO=false
ABRIR_NAVEGADOR=true

for arg in "$@"; do
  case "$arg" in
    --limpo) LIMPO=true ;;
    --sem-navegador) ABRIR_NAVEGADOR=false ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Opção desconhecida: $arg (use --help)"; exit 1 ;;
  esac
done

verde() { printf '\033[32m%s\033[0m\n' "$1"; }
amarelo() { printf '\033[33m%s\033[0m\n' "$1"; }
vermelho() { printf '\033[31m%s\033[0m\n' "$1"; }

echo
printf '\033[1;34m  Arena\033[1;33m+\033[0m  inicializando...\n\n'

# ---------- Java 21 ----------
java_ok() { [ -n "${1:-}" ] && [ -x "$1/bin/java" ] && "$1/bin/java" -version 2>&1 | grep -q 'version "21'; }
if ! java_ok "${JAVA_HOME:-}"; then
  for candidato in \
    /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
    /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
    "$(/usr/libexec/java_home -v 21 2>/dev/null)"; do
    if java_ok "$candidato"; then export JAVA_HOME="$candidato"; break; fi
  done
fi
if ! java_ok "${JAVA_HOME:-}"; then
  vermelho "✗ Java 21 não encontrado."
  echo "  Instale com:  brew install openjdk@21"
  exit 1
fi
verde "✓ Java 21: $JAVA_HOME"

# ---------- Node ----------
if ! command -v node >/dev/null 2>&1; then
  vermelho "✗ Node.js não encontrado (necessário só para servir o frontend)."
  echo "  Instale com:  brew install node"
  exit 1
fi
verde "✓ Node $(node -v)"

mkdir -p "$LOGS"
PID_API=""
PID_FRONT=""

encerrar() {
  trap - INT TERM EXIT
  echo
  amarelo "Encerrando..."
  local parados=""
  if [ -n "$PID_FRONT" ]; then
    kill "$PID_FRONT" 2>/dev/null
    wait "$PID_FRONT" 2>/dev/null   # evita a mensagem "Terminated" do bash
    parados="frontend"
  fi
  if [ -n "$PID_API" ]; then
    # o Maven inicia a JVM como processo filho: encerra a árvore inteira
    pkill -P "$PID_API" 2>/dev/null
    kill "$PID_API" 2>/dev/null
    for _ in $(seq 1 20); do kill -0 "$PID_API" 2>/dev/null || break; sleep 0.5; done
    wait "$PID_API" 2>/dev/null
    parados="${parados:+$parados e }API Java"
  fi
  [ -n "$parados" ] && verde "✓ Encerrado: $parados."
  exit 0
}
trap encerrar INT TERM EXIT

porta_ocupada() { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

# ---------- API Java ----------
if porta_ocupada 8080; then
  if curl -s "$API_URL/v3/api-docs" 2>/dev/null | grep -q 'Arena+ API'; then
    amarelo "• A API já está rodando na porta 8080 — reutilizando."
    $LIMPO && amarelo "  (--limpo ignorado: pare a API atual para limpar o banco)"
  else
    vermelho "✗ A porta 8080 está ocupada por outro programa:"
    lsof -nP -iTCP:8080 -sTCP:LISTEN | tail -n +2
    exit 1
  fi
else
  if $LIMPO; then
    rm -rf "$RAIZ/backend-java/data"
    amarelo "• Banco H2 apagado: os dados de demonstração serão recriados."
  fi
  echo "• Subindo a API Java (a 1ª vez baixa dependências e pode levar alguns minutos)..."
  (cd "$RAIZ/backend-java" && exec ./mvnw -q -B spring-boot:run) > "$LOGS/api.log" 2>&1 &
  PID_API=$!

  printf '  aguardando'
  for i in $(seq 1 300); do
    if curl -s -o /dev/null "$API_URL/v3/api-docs" 2>/dev/null; then break; fi
    if ! kill -0 "$PID_API" 2>/dev/null; then
      echo
      vermelho "✗ A API parou durante a inicialização. Últimas linhas de logs/api.log:"
      tail -20 "$LOGS/api.log"
      PID_API=""
      exit 1
    fi
    [ $((i % 2)) -eq 0 ] && printf '.'
    sleep 1
  done
  echo
  if ! curl -s -o /dev/null "$API_URL/v3/api-docs"; then
    vermelho "✗ A API não respondeu em 5 minutos. Veja logs/api.log"
    exit 1
  fi
  verde "✓ API Java no ar"
fi

# ---------- Frontend ----------
if porta_ocupada 3000; then
  if curl -s "$FRONT_URL/js/config.js" 2>/dev/null | grep -q 'ARENA_CONFIG'; then
    amarelo "• O frontend já está rodando na porta 3000 — reutilizando."
  else
    vermelho "✗ A porta 3000 está ocupada por outro programa:"
    lsof -nP -iTCP:3000 -sTCP:LISTEN | tail -n +2
    exit 1
  fi
else
  node "$RAIZ/frontend/server.js" > "$LOGS/frontend.log" 2>&1 &
  PID_FRONT=$!
  for _ in $(seq 1 20); do curl -s -o /dev/null "$FRONT_URL" && break; sleep 0.25; done
  verde "✓ Frontend no ar"
fi

echo
printf '\033[1m  Arena+ pronta!\033[0m\n'
echo "  App ........... $FRONT_URL        (login: lucas@arenaplus.dev / arena123)"
echo "  Swagger ....... $API_URL/swagger-ui/index.html"
echo "  Console H2 .... $API_URL/h2-console   (JDBC: jdbc:h2:file:./data/arenaplusdb;AUTO_SERVER=TRUE · usuário sa · senha vazia)"
echo "  Logs .......... logs/api.log · logs/frontend.log"
echo
amarelo "  Pressione Ctrl+C para encerrar tudo."
echo

if $ABRIR_NAVEGADOR; then
  open "$FRONT_URL" 2>/dev/null
  open "$API_URL/swagger-ui/index.html" 2>/dev/null
fi

# Mantém o script vivo enquanto os processos iniciados por ele estiverem rodando
if [ -z "$PID_API$PID_FRONT" ]; then
  amarelo "  Nada foi iniciado por este script (tudo já estava rodando)."
  trap - INT TERM EXIT
  exit 0
fi
while true; do
  if [ -n "$PID_API" ] && ! kill -0 "$PID_API" 2>/dev/null; then
    vermelho "✗ A API parou inesperadamente. Veja logs/api.log"; PID_API=""; encerrar
  fi
  if [ -n "$PID_FRONT" ] && ! kill -0 "$PID_FRONT" 2>/dev/null; then
    vermelho "✗ O frontend parou inesperadamente. Veja logs/frontend.log"; PID_FRONT=""; encerrar
  fi
  sleep 2
done
