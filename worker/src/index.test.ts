import test from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest, type Env } from './index.ts'
import { signPayload } from '../../src/shared/auth.ts'

const SECRET = 'test-secret'
const rows: Record<string, unknown>[] = []
const DB = {
  prepare: (sql: string) => ({
    bind: (...v: unknown[]) => ({
      run: async () => {
        if (rows.some((r) => r.event_id === v[0])) return { meta: { changes: 0 } }
        rows.push({ event_id: v[0], agent_id: v[1], task_id: v[2], status: v[3], activity: v[4], kind: v[5], ts: v[6] })
        return { meta: { changes: 1 } }
      },
      all: async () => ({ results: sql.startsWith('SELECT') ? rows : [] }),
    }),
  }),
}
const env: Env = { DB, EVENT_SIGNING_SECRET: SECRET, HQ_READ_TOKEN: 'read-token' }
const ev = { eventId: 'evt_100', agentId: 'nova', taskId: 'demo_9', status: 'completed', activity: 'publishing', timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), kind: 'demo_published' }

async function post(body: string, o: { secret?: string; ts?: string; sig?: string | null } = {}) {
  const ts = o.ts ?? String(Math.floor(Date.now() / 1000))
  const sig = o.sig === undefined ? await signPayload(o.secret ?? SECRET, ts, body) : o.sig
  const headers: Record<string, string> = { 'x-aether-timestamp': ts }
  if (sig) headers['x-aether-signature'] = sig
  return handleRequest(new Request('https://hq.test/events', { method: 'POST', body, headers }), env)
}

test('POST sem assinatura → 401; assinatura errada → 401; replay antigo → 401', async () => {
  assert.equal((await post(JSON.stringify(ev), { sig: null })).status, 401)
  assert.equal((await post(JSON.stringify(ev), { secret: 'errado' })).status, 401)
  assert.equal((await post(JSON.stringify(ev), { ts: String(Math.floor(Date.now() / 1000) - 3600) })).status, 401)
  assert.equal(rows.length, 0)
})

test('POST assinado com corpo inválido → 400 (campo verified forjado)', async () => {
  assert.equal((await post(JSON.stringify({ ...ev, verified: true }))).status, 400)
  assert.equal((await post('not json')).status, 400)
})

test('POST válido grava; reenvio é deduplicado', async () => {
  const a = await post(JSON.stringify(ev))
  assert.deepEqual(await a.json(), { ok: true, duplicate: false })
  const b = await post(JSON.stringify(ev))
  assert.deepEqual(await b.json(), { ok: true, duplicate: true })
  assert.equal(rows.length, 1)
})

test('segredo ausente → falha fechada (500)', async () => {
  const r = await handleRequest(new Request('https://hq.test/events', { method: 'POST', body: '{}' }), { ...env, EVENT_SIGNING_SECRET: '' })
  assert.equal(r.status, 500)
})

test('GET exige token de leitura', async () => {
  assert.equal((await handleRequest(new Request('https://hq.test/events'), env)).status, 401)
  assert.equal((await handleRequest(new Request('https://hq.test/events', { headers: { authorization: 'Bearer x' } }), env)).status, 401)
  const ok = await handleRequest(new Request('https://hq.test/events', { headers: { authorization: 'Bearer read-token' } }), env)
  assert.equal(ok.status, 200)
  assert.equal(((await ok.json()) as { events: unknown[] }).events.length, 1)
})

test('rotas desconhecidas → 404; métodos não permitidos → 405', async () => {
  assert.equal((await handleRequest(new Request('https://hq.test/x'), env)).status, 404)
  assert.equal((await handleRequest(new Request('https://hq.test/events', { method: 'DELETE' }), env)).status, 405)
})
