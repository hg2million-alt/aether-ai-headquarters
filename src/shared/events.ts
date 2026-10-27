import type { ActivityEvent, AgentId, AgentStatus, EventKind } from '../lib/types.ts'

/** Contrato de evento: automação → Worker → D1 → HQ. Compartilhado por frontend e Worker. */
export const AGENT_IDS: readonly AgentId[] = ['scout', 'atlas', 'sentinel', 'nova', 'mercury']
export const STATUSES: readonly AgentStatus[] = ['idle', 'sleeping', 'working', 'completed', 'failed', 'unknown']
export const KINDS: readonly EventKind[] = [
  'lead_qualified', 'demo_built', 'qa_passed', 'demo_published', 'demo_presented', 'proposal_prepared', 'sale_confirmed',
]

export interface HqEvent {
  eventId: string
  agentId: AgentId
  taskId?: string
  status: AgentStatus
  /** código curto (ex.: "building"), não texto livre */
  activity: string
  /** ISO 8601 UTC, ex.: 2026-10-27T12:00:00Z */
  timestamp: string
  kind?: EventKind
}

export type Validation = { ok: true; event: HqEvent } | { ok: false; errors: string[] }

const EVENT_ID = /^evt_[A-Za-z0-9_-]{1,60}$/
const TASK_ID = /^[A-Za-z0-9_-]{1,64}$/
const ACTIVITY = /^[a-z][a-z0-9_]{0,31}$/
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/
const ALLOWED = new Set(['eventId', 'agentId', 'taskId', 'status', 'activity', 'timestamp', 'kind'])
const MAX_FUTURE_MS = 5 * 60 * 1000

/** Validação estrita: campos desconhecidos são rejeitados (ex.: um cliente não pode enviar `verified`). */
export function validateEvent(input: unknown, now = Date.now()): Validation {
  const errors: string[] = []
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { ok: false, errors: ['body must be an object'] }
  const o = input as Record<string, unknown>
  for (const k of Object.keys(o)) if (!ALLOWED.has(k)) errors.push(`unknown field: ${k}`)
  const str = (k: string, re: RegExp, optional = false) => {
    const v = o[k]
    if (v === undefined && optional) return undefined
    if (typeof v !== 'string' || !re.test(v)) errors.push(`invalid ${k}`)
    return v as string
  }
  const eventId = str('eventId', EVENT_ID)
  const taskId = str('taskId', TASK_ID, true)
  const activity = str('activity', ACTIVITY)
  const timestamp = str('timestamp', ISO_UTC)
  if (!AGENT_IDS.includes(o.agentId as AgentId)) errors.push('invalid agentId')
  if (!STATUSES.includes(o.status as AgentStatus)) errors.push('invalid status')
  if (o.kind !== undefined && !KINDS.includes(o.kind as EventKind)) errors.push('invalid kind')
  if (typeof timestamp === 'string' && ISO_UTC.test(timestamp)) {
    const t = Date.parse(timestamp)
    if (Number.isNaN(t)) errors.push('invalid timestamp')
    else if (t > now + MAX_FUTURE_MS) errors.push('timestamp in the future')
  }
  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    event: { eventId, agentId: o.agentId as AgentId, taskId, status: o.status as AgentStatus, activity, timestamp, kind: o.kind as EventKind | undefined } as HqEvent,
  }
}

const ACTIVITY_LABEL: Record<string, string> = {
  building: 'Construindo demo',
  testing: 'Executando testes',
  publishing: 'Publicando demo',
  prospecting: 'Prospectando leads',
  drafting: 'Preparando abordagem para revisão',
}

/** Converte evento do contrato para o modelo de UI. `verified` é decidido só pelo servidor. */
export function toActivity(e: HqEvent, verified: boolean): ActivityEvent {
  return { ...e, activity: ACTIVITY_LABEL[e.activity] ?? e.activity, verified }
}

/** Remove duplicatas por eventId (mantém a primeira ocorrência). */
export function dedupeEvents<T extends { eventId: string }>(events: T[]): T[] {
  const seen = new Set<string>()
  return events.filter((e) => (seen.has(e.eventId) ? false : (seen.add(e.eventId), true)))
}

export const STALE_WORKING_MS = 6 * 60 * 60 * 1000

/** Estado atual por agente. Sem evento, ou "working" sem sinal recente → `unknown` (nunca inventar tarefa). */
export function deriveAgentStatuses(events: HqEvent[], now = Date.now(), staleMs = STALE_WORKING_MS): Record<AgentId, AgentStatus> {
  const out = {} as Record<AgentId, AgentStatus>
  for (const id of AGENT_IDS) {
    const latest = events
      .filter((e) => e.agentId === id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp) || b.eventId.localeCompare(a.eventId))[0]
    if (!latest) out[id] = 'unknown'
    else if (latest.status === 'working' && now - Date.parse(latest.timestamp) > staleMs) out[id] = 'unknown'
    else out[id] = latest.status
  }
  return out
}
