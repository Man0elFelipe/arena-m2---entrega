#!/bin/bash
# Smoke test ponta a ponta da API Arena+ (requer API em :8080)
B=${API:-http://localhost:8080}
pass=0; fail=0
req(){ # metodo url esperado [json]
  local code body
  if [ -n "$4" ]; then body=$(curl -s -w '\n%{http_code}' -X $1 "$B$2" -H 'Content-Type: application/json' -d "$4")
  else body=$(curl -s -w '\n%{http_code}' -X $1 "$B$2"); fi
  code=$(echo "$body" | tail -1); RESP=$(echo "$body" | sed '$d')
  if [ "$code" = "$3" ]; then pass=$((pass+1)); echo "OK   $code $1 $2"; else fail=$((fail+1)); echo "FAIL $code (esperado $3) $1 $2 -> $RESP"; fi
}
jid(){ echo "$RESP" | python3 -I -c "import json,sys;print(json.load(sys.stdin)['id'])"; }
T=$(date +%s)
req POST /api/usuarios 201 "{\"nome\":\"Smoke A\",\"email\":\"a$T@smoke.dev\",\"senha\":\"segredo123\",\"esportePrincipal\":\"Corrida\"}"; A=$(jid)
echo "$RESP" | grep -q senha && { echo "FAIL hash vazado"; fail=$((fail+1)); }
req POST /api/usuarios 201 "{\"nome\":\"Smoke B\",\"email\":\"b$T@smoke.dev\",\"senha\":\"segredo123\"}"; Bu=$(jid)
req POST /api/usuarios 409 "{\"nome\":\"Dup\",\"email\":\"a$T@smoke.dev\",\"senha\":\"segredo123\"}"
req POST /api/auth/login 200 "{\"email\":\"a$T@smoke.dev\",\"senha\":\"segredo123\"}"
req POST /api/auth/login 401 "{\"email\":\"a$T@smoke.dev\",\"senha\":\"errada\"}"
req POST /api/comunidades 201 "{\"nome\":\"Smoke Run\",\"descricao\":\"teste\",\"esporte\":\"Corrida\",\"criadorId\":$A}"; C=$(jid)
req POST /api/membros-comunidade 201 "{\"usuarioId\":$Bu,\"comunidadeId\":$C}"
req POST /api/membros-comunidade 409 "{\"usuarioId\":$Bu,\"comunidadeId\":$C}"
req POST /api/publicacoes 201 "{\"usuarioId\":$A,\"comunidadeId\":$C,\"texto\":\"Primeiro treino\"}"; P=$(jid)
req POST /api/comentarios 201 "{\"usuarioId\":$Bu,\"publicacaoId\":$P,\"texto\":\"Boa!\"}"; CM=$(jid)
req POST /api/curtidas 201 "{\"usuarioId\":$Bu,\"publicacaoId\":$P}"
req POST /api/curtidas 409 "{\"usuarioId\":$Bu,\"publicacaoId\":$P}"
req POST /api/seguimentos 201 "{\"seguidorId\":$Bu,\"seguidoId\":$A}"
req POST /api/seguimentos 409 "{\"seguidorId\":$Bu,\"seguidoId\":$A}"
req POST /api/seguimentos 400 "{\"seguidorId\":$A,\"seguidoId\":$A}"
req POST /api/publicacoes 404 "{\"usuarioId\":999999,\"texto\":\"x\"}"
req GET "/api/usuarios/$Bu/feed" 200
req GET "/api/publicacoes?comunidadeId=$C&viewerId=$Bu" 200
req GET "/api/usuarios/$A/perfil" 200
req GET "/api/curtidas/contagem?publicacaoId=$P" 200
req PUT /api/publicacoes/$P 200 "{\"texto\":\"Primeiro treino (editado)\"}"
req PUT /api/usuarios/$A 200 "{\"nome\":\"Smoke A2\",\"cidade\":\"Santos\"}"
req PUT /api/comunidades/$C 200 "{\"nome\":\"Smoke Run 2\",\"descricao\":\"teste\",\"esporte\":\"Corrida\"}"
req DELETE /api/comentarios/$CM 204
req DELETE "/api/curtidas?usuarioId=$Bu&publicacaoId=$P" 204
req DELETE "/api/seguimentos?seguidorId=$Bu&seguidoId=$A" 204
req DELETE "/api/membros-comunidade?usuarioId=$Bu&comunidadeId=$C" 204
req DELETE /api/publicacoes/$P 204
req DELETE /api/comunidades/$C 204
req DELETE /api/usuarios/$Bu 204
req GET /v3/api-docs 200
req GET /swagger-ui/index.html 200
echo "RESULTADO: $pass ok, $fail falhas"
