#!/bin/bash
# Smoke test ponta a ponta da API Arena+ (requer a API em :8080). Cria registros no banco atual.
B=${API:-http://localhost:8080}
pass=0; fail=0
TOK=""
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

req() { # metodo url esperado [json]  (usa $TOK se definido)
  local code body auth=()
  [ -n "$TOK" ] && auth=(-H "Authorization: Bearer $TOK")
  if [ -n "$4" ]; then body=$(curl -s -w '\n%{http_code}' -X "$1" "$B$2" "${auth[@]}" -H 'Content-Type: application/json' -d "$4")
  else body=$(curl -s -w '\n%{http_code}' -X "$1" "$B$2" "${auth[@]}"); fi
  code=$(echo "$body" | tail -1); RESP=$(echo "$body" | sed '$d')
  if [ "$code" = "$3" ]; then pass=$((pass+1)); echo "OK   $code $1 $2"; else fail=$((fail+1)); echo "FAIL $code (esperado $3) $1 $2 -> $RESP"; fi
}
jget() { echo "$RESP" | python3 -I -c "import json,sys;d=json.load(sys.stdin);print(d$1)"; }
login() { TOK=""; req POST /api/auth/login 200 "{\"email\":\"$1\",\"senha\":\"segredo123\"}"; TOK=$(jget "['token']"); }
upload() { # arquivo esperado
  local code
  code=$(curl -s -o "$TMP/up.json" -w '%{http_code}' -X POST "$B/api/midias" -H "Authorization: Bearer $TOK" -F "arquivo=@$1")
  RESP=$(cat "$TMP/up.json")
  if [ "$code" = "$2" ]; then pass=$((pass+1)); echo "OK   $code POST /api/midias ($(basename "$1"))"; else fail=$((fail+1)); echo "FAIL $code (esperado $2) POST /api/midias ($(basename "$1")) -> $RESP"; fi
}

T=$(date +%s)
req POST /api/usuarios 201 "{\"nome\":\"Smoke A\",\"email\":\"a$T@smoke.dev\",\"senha\":\"segredo123\",\"esportePrincipal\":\"Corrida\"}"; A=$(jget "['id']")
echo "$RESP" | grep -qiE 'senha|\$2a\$' && { echo "FAIL hash/senha vazados"; fail=$((fail+1)); }
req POST /api/usuarios 201 "{\"nome\":\"Smoke B\",\"email\":\"b$T@smoke.dev\",\"senha\":\"segredo123\"}"; Bu=$(jget "['id']")
req POST /api/usuarios 409 "{\"nome\":\"Dup\",\"email\":\"a$T@smoke.dev\",\"senha\":\"segredo123\"}"

# --- autenticação ---
req GET /api/usuarios 401                       # sem token
req POST /api/auth/login 401 "{\"email\":\"a$T@smoke.dev\",\"senha\":\"errada\"}"
login "a$T@smoke.dev"; TA=$TOK
login "b$T@smoke.dev"; TB=$TOK

# --- comunidade, membros, publicação, comentário, curtida, seguimento ---
TOK=$TA
req POST /api/comunidades 201 "{\"nome\":\"Smoke Run\",\"descricao\":\"teste\",\"esporte\":\"Corrida\"}"; C=$(jget "['id']")
TOK=$TB
req POST /api/membros-comunidade 201 "{\"comunidadeId\":$C}"
req POST /api/membros-comunidade 409 "{\"comunidadeId\":$C}"
TOK=$TA
req POST /api/publicacoes 201 "{\"comunidadeId\":$C,\"texto\":\"Primeiro treino\"}"; P=$(jget "['id']")
TOK=$TB
req POST /api/comentarios 201 "{\"publicacaoId\":$P,\"texto\":\"Boa!\"}"; CM=$(jget "['id']")
req POST /api/curtidas 201 "{\"publicacaoId\":$P}"
req POST /api/curtidas 409 "{\"publicacaoId\":$P}"
req POST /api/seguimentos 201 "{\"seguidoId\":$A}"
req POST /api/seguimentos 409 "{\"seguidoId\":$A}"
req POST /api/seguimentos 400 "{\"seguidoId\":$Bu}"
req POST /api/publicacoes 404 "{\"comunidadeId\":999999,\"texto\":\"x\"}"

# --- autorização (403) ---
req PUT "/api/publicacoes/$P" 403 "{\"texto\":\"roubada\"}"
req DELETE "/api/publicacoes/$P" 403
req PUT "/api/usuarios/$A" 403 "{\"nome\":\"Hackeado\"}"
req PUT "/api/comunidades/$C" 403 "{\"nome\":\"x\",\"descricao\":\"y\",\"esporte\":\"z\"}"

# --- upload de mídia ---
printf '\xff\xd8\xff\xe0JFIFsmoke' > "$TMP/foto.jpg"
printf '\x89PNG\r\n\x1a\nsmoke' > "$TMP/foto.png"
printf '\x00\x00\x00\x18ftypisomsmoke-video-bytes' > "$TMP/video.mp4"
echo "isto nao e uma imagem" > "$TMP/falso.jpg"
TOK=$TA
upload "$TMP/foto.jpg" 201; URL_JPG=$(jget "['url']")
upload "$TMP/foto.png" 201
upload "$TMP/video.mp4" 201; URL_MP4=$(jget "['url']")
upload "$TMP/falso.jpg" 400
code=$(curl -s -o /dev/null -w '%{http_code}' "$B$URL_JPG"); [ "$code" = "200" ] && { pass=$((pass+1)); echo "OK   200 GET $URL_JPG (mídia servida)"; } || { fail=$((fail+1)); echo "FAIL $code GET $URL_JPG"; }
req POST /api/publicacoes 201 "{\"texto\":\"Com foto\",\"midiaUrl\":\"$URL_JPG\"}"; P2=$(jget "['id']")
req POST /api/publicacoes 201 "{\"texto\":\"Com vídeo\",\"midiaUrl\":\"$URL_MP4\"}"
[ "$(jget "['tipoMidia']")" = "VIDEO" ] && { pass=$((pass+1)); echo "OK   tipoMidia=VIDEO"; } || { fail=$((fail+1)); echo "FAIL tipoMidia"; }
TOK=$TB
req POST /api/publicacoes 400 "{\"texto\":\"usando a mídia do outro\",\"midiaUrl\":\"$URL_JPG\"}"

# --- salvos (coleção privada) ---
req POST "/api/salvos/$P" 201
req POST "/api/salvos/$P" 409
req GET /api/salvos 200
TOK=$TA
req GET /api/salvos 200   # a coleção do outro usuário não aparece aqui (ver testes de integração)

# --- consultas, edições, exclusões ---
TOK=$TB
req GET /api/feed 200
req GET "/api/publicacoes?comunidadeId=$C" 200
req GET "/api/usuarios/$A/perfil" 200
req GET "/api/usuarios?busca=smoke&esporte=corrida" 200
req GET /api/usuarios/parceiros 200
req GET "/api/curtidas/contagem?publicacaoId=$P" 200
TOK=$TA
req PUT "/api/publicacoes/$P" 200 "{\"texto\":\"Primeiro treino (editado)\"}"
req PUT "/api/usuarios/$A" 200 "{\"nome\":\"Smoke A2\",\"cidade\":\"Santos\",\"nivelExperiencia\":\"INTERMEDIARIO\",\"procuraParceiros\":true}"
req PUT "/api/comunidades/$C" 200 "{\"nome\":\"Smoke Run 2\",\"descricao\":\"teste\",\"esporte\":\"Corrida\"}"
TOK=$TB
req DELETE "/api/comentarios/$CM" 204
req DELETE "/api/curtidas?publicacaoId=$P" 204
req DELETE "/api/salvos/$P" 204
req DELETE "/api/seguimentos?seguidoId=$A" 204
req DELETE "/api/membros-comunidade?comunidadeId=$C" 204
TOK=$TA
req DELETE "/api/publicacoes/$P2" 204
code=$(curl -s -o /dev/null -w '%{http_code}' "$B$URL_JPG"); [ "$code" = "404" ] && { pass=$((pass+1)); echo "OK   404 GET $URL_JPG (mídia removida com a publicação)"; } || { fail=$((fail+1)); echo "FAIL $code mídia deveria ter sido apagada"; }
req DELETE "/api/publicacoes/$P" 204
req DELETE "/api/comunidades/$C" 204
req POST /api/auth/logout 204
req GET /api/auth/eu 401                        # token revogado
TOK=$TB
req DELETE "/api/usuarios/$Bu" 204
TOK=""
req GET /v3/api-docs 200
req GET /swagger-ui/index.html 200
echo "RESULTADO: $pass ok, $fail falhas"
[ "$fail" -eq 0 ]
