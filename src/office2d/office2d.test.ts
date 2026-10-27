import test from 'node:test'
import assert from 'node:assert/strict'
import { Sim } from './behavior.ts'
import { SPOTS } from './layout.ts'
import { findPath, isFree } from './path.ts'

test('todas as vagas e pontos de aproximação são alcançáveis a partir do corredor de trabalho', () => {
  const origin: [number, number] = [7, 4.2]
  assert.ok(isFree(...origin))
  for (const s of SPOTS) {
    assert.ok(isFree(...s.approach), `aproximação livre: ${s.id}`)
    assert.ok(findPath(origin, s.approach), `alcançável: ${s.id}`)
  }
})

test('caminho nunca cruza células bloqueadas e passa por portas', () => {
  const p = findPath([7, 4.2], [8.4, 15.6])! // trabalho → descanso (porta em gy=10)
  assert.ok(p.length >= 2)
  for (let k = 0; k < p.length - 1; k++) {
    const [a, b] = [p[k], p[k + 1]]
    for (let t = 0; t <= 20; t++) assert.ok(isFree(a[0] + ((b[0] - a[0]) * t) / 20, a[1] + ((b[1] - a[1]) * t) / 20))
  }
  let through = false
  for (let k = 0; k < p.length - 1; k++)
    for (let t = 0; t <= 40; t++) {
      const x = p[k][0] + ((p[k + 1][0] - p[k][0]) * t) / 40, y = p[k][1] + ((p[k + 1][1] - p[k][1]) * t) / 40
      if (Math.abs(y - 10.1) < 0.15 && x >= 6 && x <= 8) through = true
    }
  assert.ok(through, 'atravessa a porta')
})

test('trabalhando → mesa; dormindo → cama; ocioso → fora da mesa', () => {
  const s = new Sim({ scout: 'working', atlas: 'sleeping', sentinel: 'idle', nova: 'completed', mercury: 'unknown' })
  const by = Object.fromEntries(s.agents.map((a) => [a.id, a.spot.id]))
  assert.equal(by.scout, 'desk:0')
  assert.equal(by.atlas, 'bed:1')
  assert.notEqual(by.sentinel, 'desk:2')
  assert.equal(by.nova, 'desk:3')
  assert.equal(by.mercury, 'desk:4')
})

test('ninguém ocupa a mesma vaga e o lazer varia ao longo do tempo', () => {
  const st = { scout: 'idle', atlas: 'idle', sentinel: 'idle', nova: 'idle', mercury: 'idle' } as const
  const s = new Sim(st)
  const seen = new Set<string>()
  for (let t = 0; t < 200; t += 0.25) {
    s.update(0.25, st)
    const ids = s.agents.map((a) => a.spot.id)
    assert.equal(new Set(ids).size, ids.length, 'vagas distintas')
    for (const a of s.agents) seen.add(a.act)
  }
  assert.ok(seen.size >= 4, `atividades distintas: ${[...seen]}`)
})

test('ocioso → trabalhando: o agente volta à mesa caminhando', () => {
  const s = new Sim({ scout: 'idle', atlas: 'idle', sentinel: 'idle', nova: 'idle', mercury: 'idle' })
  const work = { scout: 'working', atlas: 'working', sentinel: 'working', nova: 'working', mercury: 'working' } as const
  for (let t = 0; t < 60; t += 0.25) s.update(0.25, work)
  for (const a of s.agents) {
    assert.ok(a.spot.id.startsWith('desk:'))
    assert.ok(!a.walking, `${a.id} chegou`)
  }
})

test('determinismo: mesma entrada, mesma trajetória', () => {
  const st = { scout: 'idle', atlas: 'idle', sentinel: 'sleeping', nova: 'idle', mercury: 'working' } as const
  const a = new Sim(st), b = new Sim(st)
  for (let t = 0; t < 120; t += 0.25) { a.update(0.25, st); b.update(0.25, st) }
  assert.deepEqual(a.agents.map((x) => [x.x, x.y, x.spot.id]), b.agents.map((x) => [x.x, x.y, x.spot.id]))
})

test('ociosos não escurecem o escritório; só todos dormindo', async () => {
  const { isNight } = await import('../lib/office.ts')
  assert.equal(isNight({ scout: 'idle', atlas: 'sleeping' }), false)
  assert.equal(isNight({ scout: 'sleeping', atlas: 'sleeping' }), true)
  assert.equal(isNight({ scout: 'sleeping', atlas: 'unknown' }), false)
})
