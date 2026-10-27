import type { Connection, HqSnapshot } from '../lib/types.ts'
import { deriveAgentStatuses, toActivity, validateEvent, type HqEvent } from '../shared/events.ts'
import { AGENT_META, GOALS } from './agents.ts'

const TZ = 'America/Sao_Paulo'
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })
const dayOf = (ms: number) => dayFmt.format(new Date(ms))

/** Início (dia civil, fuso de São Paulo) da semana (segunda a domingo) que contém `ms`. */
function weekStart(ms: number): string {
  const d = new Date(`${dayOf(ms)}T00:00:00Z`)
  const back = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}

/**
 * Monta o painel a partir de eventos AUTENTICADOS (gravados pelo Worker). Sem eventos tudo fica
 * zerado e os agentes `unknown`. Nada aqui é inventado: cada número é uma contagem de eventos.
 */
export function buildSnapshot(events: HqEvent[], connection: Connection, now = Date.now()): HqSnapshot {
  const status = deriveAgentStatuses(events, now)
  const count = (kind: string) => events.filter((e) => e.kind === kind).length
  const published = events.filter((e) => e.kind === 'demo_published')
  const today = dayOf(now), week = weekStart(now)
  const built = count('demo_built'), pub = published.length
  return {
    connection,
    goals: GOALS,
    progress: {
      publishedToday: published.filter((e) => dayOf(Date.parse(e.timestamp)) === today).length,
      publishedThisWeek: published.filter((e) => weekStart(Date.parse(e.timestamp)) === week).length,
    },
    funnel: {
      leadsFound: 0,
      leadsQualified: count('lead_qualified'),
      demosInDevelopment: Math.max(0, built - pub),
      demosProduced: built,
      demosPublished: pub,
      demosPresented: count('demo_presented'),
      repliesReceived: 0,
      negotiations: 0,
      proposalsSent: count('proposal_prepared'),
      salesConfirmed: count('sale_confirmed'),
      revenueBRL: 0,
    },
    agents: AGENT_META.map((a) => ({ ...a, status: status[a.id] })),
    nextRoutine: { at: null, label: 'Nenhuma rotina configurada' },
    activity: [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((e) => toActivity(e, true)),
  }
}

/** Valida a resposta do Worker: descarta qualquer item fora do contrato. */
export function parseEvents(body: unknown, now = Date.now()): HqEvent[] {
  const list = (body as { events?: unknown })?.events
  if (!Array.isArray(list)) return []
  const out: HqEvent[] = []
  for (const item of list) {
    const v = validateEvent(item, now)
    if (v.ok) out.push(v.event)
  }
  return out
}
