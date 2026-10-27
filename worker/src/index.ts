import { timingSafeEqual, verifySignature } from '../../src/shared/auth.ts'
import { validateEvent } from '../../src/shared/events.ts'

/** Subconjunto mínimo de D1 usado aqui (evita depender de @cloudflare/workers-types). */
export interface D1Like {
  prepare(sql: string): { bind(...v: unknown[]): { run(): Promise<{ meta: { changes: number } }>; all(): Promise<{ results: Record<string, unknown>[] }> } }
}

/** Segredos vêm de `wrangler secret put` — nunca do repositório. */
export interface Env {
  DB: D1Like
  EVENT_SIGNING_SECRET: string
  HQ_READ_TOKEN: string
}

const MAX_BODY = 4096
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

async function ingest(req: Request, env: Env): Promise<Response> {
  if (!env.EVENT_SIGNING_SECRET) return json({ error: 'server_misconfigured' }, 500) // falha fechada
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return json({ error: 'payload_too_large' }, 413)
  const body = await req.text()
  if (body.length > MAX_BODY) return json({ error: 'payload_too_large' }, 413)

  // 1) autenticar ANTES de interpretar o conteúdo
  const auth = await verifySignature({
    secret: env.EVENT_SIGNING_SECRET,
    timestamp: req.headers.get('x-aether-timestamp'),
    signature: req.headers.get('x-aether-signature'),
    body,
  })
  if (auth !== 'ok') return json({ error: 'unauthorized' }, 401)

  // 2) validar
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  const v = validateEvent(parsed)
  if (!v.ok) return json({ error: 'invalid_event', details: v.errors }, 400)

  // 3) gravar de forma idempotente (deduplicação por event_id)
  const e = v.event
  const res = await env.DB.prepare(
    'INSERT OR IGNORE INTO events (event_id, agent_id, task_id, status, activity, kind, ts, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(e.eventId, e.agentId, e.taskId ?? null, e.status, e.activity, e.kind ?? null, e.timestamp, new Date().toISOString())
    .run()
  return json({ ok: true, duplicate: res.meta.changes === 0 })
}

async function list(req: Request, env: Env): Promise<Response> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer /, '')
  if (!env.HQ_READ_TOKEN || !timingSafeEqual(token, env.HQ_READ_TOKEN)) return json({ error: 'unauthorized' }, 401)
  const { results } = await env.DB.prepare(
    'SELECT event_id, agent_id, task_id, status, activity, kind, ts FROM events ORDER BY ts DESC, event_id DESC LIMIT ?',
  )
    .bind(100)
    .all()
  return json({
    events: results.map((r) => ({
      eventId: r.event_id, agentId: r.agent_id, taskId: r.task_id ?? undefined, status: r.status, activity: r.activity, kind: r.kind ?? undefined, timestamp: r.ts,
    })),
  })
}

export async function handleRequest(req: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(req.url)
  if (pathname !== '/events') return json({ error: 'not_found' }, 404)
  if (req.method === 'POST') return ingest(req, env)
  if (req.method === 'GET') return list(req, env)
  return json({ error: 'method_not_allowed' }, 405)
}

export default { fetch: handleRequest }
