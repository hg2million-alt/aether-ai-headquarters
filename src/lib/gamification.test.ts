import test from 'node:test'
import assert from 'node:assert/strict'
import { computeGamification, levelFor } from './gamification.ts'

const ev = (o: Record<string, unknown>) => ({ eventId: 'e', agentId: 'nova', status: 'completed', activity: '', timestamp: '2026-10-27T12:00:00Z', ...o }) as never

test('eventos não verificados não rendem XP', () => {
  const r = computeGamification([ev({ kind: 'demo_published', verified: false })])
  assert.equal(r.totalXp, 0)
})

test('não duplica por eventId nem por (taskId, kind)', () => {
  const r = computeGamification([
    ev({ eventId: 'a', taskId: 't1', kind: 'demo_published', verified: true }),
    ev({ eventId: 'a', taskId: 't2', kind: 'demo_published', verified: true }),
    ev({ eventId: 'b', taskId: 't1', kind: 'demo_published', verified: true, timestamp: '2026-10-27T13:00:00Z' }),
  ])
  assert.equal(r.rewards.length, 1)
  assert.equal(r.totalXp, 40)
})

test('somente status completed rende XP', () => {
  const r = computeGamification([ev({ kind: 'demo_built', verified: true, status: 'failed' })])
  assert.equal(r.totalXp, 0)
})

test('níveis: 0→1, 100→2, 300→3', () => {
  assert.equal(levelFor(0).level, 1)
  assert.equal(levelFor(99).level, 1)
  assert.equal(levelFor(100).level, 2)
  assert.equal(levelFor(300).level, 3)
})

test('conquista de meta diária exige 2 publicações no mesmo dia', () => {
  const pub = (id: string, ts: string) => ev({ eventId: id, taskId: id, kind: 'demo_published', verified: true, timestamp: ts })
  const one = computeGamification([pub('a', '2026-10-27T12:00:00Z'), pub('b', '2026-10-28T12:00:00Z')])
  assert.equal(one.achievements.find((a) => a.id === 'daily_goal')?.unlockedAt, null)
  const two = computeGamification([pub('a', '2026-10-27T12:00:00Z'), pub('b', '2026-10-27T15:00:00Z')])
  assert.ok(two.achievements.find((a) => a.id === 'daily_goal')?.unlockedAt)
})

test('determinismo: ordem de entrada não altera o resultado', () => {
  const a = ev({ eventId: 'a', taskId: 't', kind: 'qa_passed', verified: true })
  const b = ev({ eventId: 'b', taskId: 't', kind: 'qa_passed', verified: true })
  assert.deepEqual(computeGamification([a, b]), computeGamification([b, a]))
})
