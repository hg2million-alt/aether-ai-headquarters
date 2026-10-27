import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSnapshot, parseEvents } from './live.ts'
import type { HqEvent } from '../shared/events.ts'

const NOW = Date.parse('2026-10-28T15:00:00Z') // quarta-feira
const ev = (o: Partial<HqEvent>): HqEvent => ({ eventId: 'evt_1', agentId: 'atlas', status: 'working', activity: 'building', timestamp: '2026-10-28T14:00:00Z', ...o })

test('sem eventos: tudo zerado, agentes sem sinal, nada inventado', () => {
  const s = buildSnapshot([], 'not_configured', NOW)
  assert.equal(s.connection, 'not_configured')
  assert.deepEqual(s.agents.map((a) => a.status), ['unknown', 'unknown', 'unknown', 'unknown', 'unknown'])
  assert.deepEqual(Object.values(s.funnel).filter((n) => n !== 0), [])
  assert.equal(s.progress.publishedToday, 0)
  assert.equal(s.activity.length, 0)
})

test('estado e contagens vêm só dos eventos', () => {
  const s = buildSnapshot([
    ev({ eventId: 'evt_a' }),
    ev({ eventId: 'evt_b', agentId: 'nova', status: 'completed', activity: 'publishing', kind: 'demo_published', timestamp: '2026-10-28T13:00:00Z' }),
    ev({ eventId: 'evt_c', agentId: 'nova', status: 'completed', activity: 'publishing', kind: 'demo_published', timestamp: '2026-10-27T13:00:00Z' }),
    ev({ eventId: 'evt_d', agentId: 'scout', status: 'completed', activity: 'prospecting', kind: 'lead_qualified' }),
  ], 'online', NOW)
  const by = Object.fromEntries(s.agents.map((a) => [a.id, a.status]))
  assert.equal(by.atlas, 'working')
  assert.equal(by.nova, 'completed')
  assert.equal(by.mercury, 'unknown')
  assert.equal(s.funnel.demosPublished, 2)
  assert.equal(s.funnel.leadsQualified, 1)
  assert.equal(s.progress.publishedToday, 1)
  assert.equal(s.progress.publishedThisWeek, 2) // terça e quarta, mesma semana
  assert.equal(s.activity[0].verified, true)
})

test('"working" sem sinal há mais de 6 h vira desconhecido', () => {
  const s = buildSnapshot([ev({ timestamp: '2026-10-28T03:00:00Z' })], 'online', NOW)
  assert.equal(s.agents.find((a) => a.id === 'atlas')!.status, 'unknown')
})

test('resposta do Worker: itens fora do contrato são descartados', () => {
  const list = parseEvents({ events: [ev({}), { eventId: 'x' }, { ...ev({ eventId: 'evt_9' }), verified: true }, null] }, NOW)
  assert.equal(list.length, 1)
  assert.deepEqual(parseEvents('lixo', NOW), [])
})
