# Integração Automação → Worker → D1 → HQ (plano; nada publicado)

**Estado:** contrato, validação, HMAC, deduplicação e Worker/D1 implementados e testados localmente (`npm test`). Frontend segue em dados simulados.

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
