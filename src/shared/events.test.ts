import test from 'node:test'
import assert from 'node:assert/strict'
import { dedupeEvents, deriveAgentStatuses, validateEvent, type HqEvent } from './events.ts'
import { signPayload, verifySignature } from './auth.ts'

const NOW = Date.parse('2026-10-27T12:00:00Z')
const base = { eventId: 'evt_001', agentId: 'atlas', taskId: 'demo_001', status: 'working', activity: 'building', timestamp: '2026-10-27T12:00:00Z' }

test('evento do exemplo da especificação é válido', () => {
  assert.equal(validateEvent(base, NOW).ok, true)
})

test('rejeita campos desconhecidos (ex.: verified forjado), tipos e valores inválidos', () => {
  for (const bad of [{ ...base, verified: true }, { ...base, agentId: 'x' }, { ...base, status: 'busy' }, { ...base, eventId: '1' }, { ...base, timestamp: 'ontem' }, { ...base, kind: 'free_money' }, null, [], 'x']) {
    assert.equal(validateEvent(bad, NOW).ok, false)
  }
})

test('rejeita timestamp no futuro (>5 min)', () => {
  assert.equal(validateEvent({ ...base, timestamp: '2026-10-27T12:10:00Z' }, NOW).ok, false)
  assert.equal(validateEvent({ ...base, timestamp: '2026-10-27T12:02:00Z' }, NOW).ok, true)
})

test('dedupe por eventId', () => {
  assert.equal(dedupeEvents([{ eventId: 'a' }, { eventId: 'a' }, { eventId: 'b' }]).length, 2)
})

test('estado desconhecido: sem eventos ou "working" obsoleto', () => {
  const ev = (o: Partial<HqEvent>) => ({ ...base, ...o }) as HqEvent
  const s = deriveAgentStatuses([ev({}), ev({ eventId: 'evt_2', agentId: 'nova', status: 'completed', timestamp: '2026-10-27T01:00:00Z' })], NOW)
  assert.equal(s.atlas, 'working')
  assert.equal(s.nova, 'completed')
  assert.equal(s.scout, 'unknown')
  assert.equal(deriveAgentStatuses([ev({ timestamp: '2026-10-27T03:00:00Z' })], NOW).atlas, 'unknown')
})

test('HMAC: aceita assinatura correta e rejeita adulteração, expirada e malformada', async () => {
  const ts = String(Math.floor(NOW / 1000))
  const sig = await signPayload('s3cret', ts, 'corpo')
  const v = (o: object) => verifySignature({ secret: 's3cret', timestamp: ts, signature: sig, body: 'corpo', now: NOW, ...o })
  assert.equal(await v({}), 'ok')
  assert.equal(await v({ body: 'corpo2' }), 'bad_signature')
  assert.equal(await v({ secret: 'outro' }), 'bad_signature')
  assert.equal(await v({ signature: 'abc' }), 'bad_signature')
  assert.equal(await v({ signature: null }), 'bad_signature')
  assert.equal(await v({ timestamp: null }), 'bad_timestamp')
  assert.equal(await v({ now: NOW + 10 * 60 * 1000 }), 'expired')
})
