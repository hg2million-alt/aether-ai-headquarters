# Integração Automação → Worker → D1 → HQ (plano; nada publicado)

**Estado:** contrato, validação, HMAC, deduplicação e Worker/D1 implementados e testados localmente (`npm test`). O frontend não tem mais dados simulados: lê `GET /events` do endereço configurado em **Ajustes** (sem endereço = tudo zerado).

## Fluxo
1. Automação (repo original) envia `POST /events` com JSON do contrato (`src/shared/events.ts`) e headers:
   `X-Aether-Timestamp` (segundos Unix) e `X-Aether-Signature` = HMAC-SHA256 hex de `"{timestamp}.{corpo}"` com `EVENT_SIGNING_SECRET`.
2. Worker (`worker/src/index.ts`): autentica **antes** de ler o conteúdo → valida (estrito, rejeita `verified` e campos extras) → `INSERT OR IGNORE` no D1 (dedupe por `eventId`). Janela anti-replay: 5 min. Segredo ausente → falha fechada.
3. Só eventos gravados pelo Worker são "verificados"; é isso que habilita XP.
4. Estado do agente: `deriveAgentStatuses` — sem evento ou `working` sem sinal por 6 h → `unknown`.

## Autenticação
- **Escrita:** HMAC acima. Segredo só via `wrangler secret put EVENT_SIGNING_SECRET` e como secret do repo da automação; nunca no GitHub/frontend.
- **Leitura (hoje):** `GET /events` com `Authorization: Bearer HQ_READ_TOKEN` (para scripts do dono). **O navegador não pode usar esse token** (seria público no bundle).
- **Leitura pelo HQ (Fase 7):** colocar o site e a rota atrás de **Cloudflare Access** (login do dono) e validar o JWT `Cf-Access-Jwt-Assertion` no Worker antes de ligar `dataSource.load` à API. `workers_dev = false` para não expor a URL direta.

## Passos manuais futuros (exigem sua aprovação)
`wrangler d1 create aether-hq` → colocar o `database_id` em `worker/wrangler.toml` → `wrangler d1 execute aether-hq --file=worker/schema.sql` → `wrangler secret put …` → `wrangler deploy` → configurar Access → ligar o frontend.

## Publicação no Cloudflare Pages (preparada, NÃO executada)
- Build: `npm run build` · saída: `dist` · Node 22 (`.node-version`). Rotas por hash: sem regras de redirect.
- `public/_headers` já traz CSP estrita, nosniff, Referrer-Policy, Permissions-Policy, COOP e frame-ancestors (testado com servidor local sem violações; ao ligar a API, adicionar a origem do Worker em `connect-src`).
- Antes de publicar: aprovação do dono, Cloudflare Access no site, Worker/D1 criados conforme os passos acima.

## Como a automação envia eventos (pronto para usar)
`scripts/send-event.mjs` valida, assina (HMAC) e envia um evento. O segredo vem só de variável de ambiente:

```
AETHER_URL=https://<worker>/events AETHER_SECRET=<segredo> \
node scripts/send-event.mjs <agente> <status> <atividade> [kind] [taskId]
# ex.: início de trabalho
node scripts/send-event.mjs atlas working building "" demo_001
# ex.: demo publicada (rende XP, status completed + kind)
node scripts/send-event.mjs nova completed publishing demo_published demo_001
```
Validado de ponta a ponta contra o Worker local (200 com segredo certo, 401 com errado). Cada agente deve enviar `working` ao começar uma etapa e `completed`/`failed` ao terminar; sem sinal por 6 h o HQ mostra "sem sinal".

## O que falta para o HQ funcionar de verdade
1. Aprovar a publicação: criar D1 + Worker (`wrangler`), `wrangler secret put EVENT_SIGNING_SECRET`.
2. Decidir a leitura pelo navegador: Cloudflare Access (login) + validação do JWT no Worker; hoje `GET /events` exige token de leitura que **não** pode ir ao frontend, e a página só consegue ler via sessão do Access. CORS do Worker para a origem do HQ.
3. Colar o endereço do Worker em Ajustes (vale por aparelho, sem segredo).
4. Configurar a automação original para chamar `send-event.mjs` nas etapas do fluxo.

## Estado da nuvem (atualizado)
Arquitetura final: **um único projeto Cloudflare Pages `aether-hq`** serve o site e a API (`functions/events.ts` → mesmo `handleRequest` testado do Worker). Mesma origem = sem CORS para o site hospedado; o arquivo offline usa o endereço completo + CORS de leitura.
- **D1** `aether-hq` (id `372fef98-3f78-476e-a045-86725ae06c2c`, ENAM) com a tabela `events` — criado e verificado.
- **Projeto Pages** `aether-hq` (https://aether-hq.pages.dev/) criado, com o binding `DB` e os segredos `EVENT_SIGNING_SECRET` e `HQ_READ_TOKEN` já definidos (valores só no Cloudflare e nas mãos do dono — nunca no repositório).
- **Pendente:** o primeiro deploy (`npx wrangler pages deploy dist --project-name aether-hq --branch main`) — bloqueado pelo controle de permissões do ambiente; precisa de confirmação do dono.
- Leitura: o site pede a **chave de leitura** uma vez em Ajustes (fica só no aparelho). A automação usa `EVENT_SIGNING_SECRET` com `scripts/send-event.mjs`.
- Depois de publicar: revogar o token de API usado na configuração e, se desejar, rotacionar as duas chaves.
