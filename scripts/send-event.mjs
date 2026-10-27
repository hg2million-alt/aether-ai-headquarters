#!/usr/bin/env node
/**
 * Envia um evento assinado (HMAC-SHA256) ao Worker do Æther HQ.
 *
 *   AETHER_URL=https://<worker>/events AETHER_SECRET=<segredo> \
 *   node scripts/send-event.mjs <agente> <status> <atividade> [kind] [taskId]
 *
 *   agente:    scout | atlas | sentinel | nova | mercury
 *   status:    idle | sleeping | working | completed | failed | unknown
 *   atividade: código curto, ex.: building, testing, publishing, prospecting, drafting
 *   kind (opcional, só com status completed rende XP): lead_qualified | demo_built | qa_passed |
 *        demo_published | demo_presented | proposal_prepared | sale_confirmed
 *
 * O segredo vem SEMPRE de variável de ambiente (nunca do repositório).
 */
import { signPayload } from '../src/shared/auth.ts'
import { validateEvent } from '../src/shared/events.ts'

const [agentId, status, activity, kind, taskId] = process.argv.slice(2)
const url = process.env.AETHER_URL
const secret = process.env.AETHER_SECRET
if (!url || !secret || !agentId || !status || !activity) {
  console.error('Uso: AETHER_URL=… AETHER_SECRET=… node scripts/send-event.mjs <agente> <status> <atividade> [kind] [taskId]')
  process.exit(2)
}

const event = {
  eventId: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  agentId,
  status,
  activity,
  timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  ...(kind ? { kind } : {}),
  ...(taskId ? { taskId } : {}),
}
const check = validateEvent(event)
if (!check.ok) {
  console.error('Evento inválido:', check.errors.join('; '))
  process.exit(2)
}

const body = JSON.stringify(event)
const ts = String(Math.floor(Date.now() / 1000))
const res = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-aether-timestamp': ts, 'x-aether-signature': await signPayload(secret, ts, body) },
  body,
})
console.log(res.status, await res.text())
process.exit(res.ok ? 0 : 1)
