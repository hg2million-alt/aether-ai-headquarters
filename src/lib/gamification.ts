import type { ActivityEvent, AgentId, EventKind } from './types'

/** Toda a lógica é determinística: sem IA, sem aleatoriedade, sem relógio. */
export const XP_TABLE: Record<EventKind, number> = {
  lead_qualified: 10,
  demo_built: 25,
  qa_passed: 15,
  demo_published: 40,
  demo_presented: 20,
  proposal_prepared: 30,
  sale_confirmed: 200,
}

export const KIND_LABEL: Record<EventKind, string> = {
  lead_qualified: 'Lead qualificado',
  demo_built: 'Demo construída',
  qa_passed: 'Testes aprovados',
  demo_published: 'Demo publicada',
  demo_presented: 'Demo apresentada',
  proposal_prepared: 'Proposta preparada',
  sale_confirmed: 'Venda confirmada',
}

export interface Reward {
  eventId: string
  agentId: AgentId
  taskId?: string
  kind: EventKind
  xp: number
  timestamp: string
}

export interface LevelInfo {
  level: number
  /** XP acumulado dentro do nível atual */
  into: number
  /** XP necessário para completar o nível atual */
  span: number
}

/** XP total para alcançar o nível L: 50·L·(L−1) → 0, 100, 300, 600, 1000… */
const xpFor = (level: number) => 50 * level * (level - 1)

export function levelFor(xp: number): LevelInfo {
  let level = 1
  while (xp >= xpFor(level + 1)) level++
  return { level, into: xp - xpFor(level), span: xpFor(level + 1) - xpFor(level) }
}

export interface Achievement {
  id: string
  title: string
  description: string
  unlockedAt: string | null
}

export interface GamificationResult {
  rewards: Reward[]
  totalXp: number
  byAgent: Record<AgentId, { xp: number; rewards: number }>
  achievements: Achievement[]
}

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })
const dayOf = (iso: string) => dayFmt.format(new Date(iso))

const AGENTS: AgentId[] = ['scout', 'atlas', 'sentinel', 'nova', 'mercury']

interface Options {
  /** Apenas para pré-visualização com dados simulados. Padrão: só eventos verificados. */
  includeUnverified?: boolean
  dailyTarget?: number
}

/**
 * Concede XP por evento concluído e verificado. Sem duplicar:
 * cada eventId rende uma vez e cada par (taskId, kind) rende uma vez (vence o mais antigo).
 */
export function computeGamification(events: ActivityEvent[], opts: Options = {}): GamificationResult {
  const sorted = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.eventId.localeCompare(b.eventId))
  const seenEvents = new Set<string>()
  const seenTaskKinds = new Set<string>()
  const rewards: Reward[] = []

  for (const e of sorted) {
    if (!e.kind || e.status !== 'completed') continue
    if (!e.verified && !opts.includeUnverified) continue
    if (Number.isNaN(Date.parse(e.timestamp))) continue
    if (seenEvents.has(e.eventId)) continue
    seenEvents.add(e.eventId)
    if (e.taskId) {
      const key = `${e.taskId}:${e.kind}`
      if (seenTaskKinds.has(key)) continue
      seenTaskKinds.add(key)
    }
    rewards.push({ eventId: e.eventId, agentId: e.agentId, taskId: e.taskId, kind: e.kind, xp: XP_TABLE[e.kind], timestamp: e.timestamp })
  }

  const byAgent = Object.fromEntries(AGENTS.map((a) => [a, { xp: 0, rewards: 0 }])) as GamificationResult['byAgent']
  for (const r of rewards) {
    byAgent[r.agentId].xp += r.xp
    byAgent[r.agentId].rewards++
  }
  const totalXp = rewards.reduce((n, r) => n + r.xp, 0)

  const first = (kind: EventKind) => rewards.find((r) => r.kind === kind)?.timestamp ?? null
  const target = opts.dailyTarget ?? 2
  const perDay = new Map<string, string[]>()
  for (const r of rewards.filter((x) => x.kind === 'demo_published')) {
    const d = dayOf(r.timestamp)
    perDay.set(d, [...(perDay.get(d) ?? []), r.timestamp])
  }
  const goalDay = [...perDay.values()].find((ts) => ts.length >= target)

  const achievements: Achievement[] = [
    { id: 'first_lead', title: 'Primeiro lead', description: 'Qualificar o primeiro lead.', unlockedAt: first('lead_qualified') },
    { id: 'first_publish', title: 'No ar', description: 'Publicar a primeira demo.', unlockedAt: first('demo_published') },
    { id: 'daily_goal', title: 'Meta do dia', description: `Publicar ${target} demos no mesmo dia.`, unlockedAt: goalDay ? goalDay[target - 1] : null },
    { id: 'first_presented', title: 'Primeira apresentação', description: 'Apresentar a primeira demo.', unlockedAt: first('demo_presented') },
    { id: 'first_proposal', title: 'Primeira proposta', description: 'Preparar a primeira proposta.', unlockedAt: first('proposal_prepared') },
    { id: 'first_sale', title: 'Primeira venda', description: 'Confirmar a primeira venda.', unlockedAt: first('sale_confirmed') },
  ]

  return { rewards, totalXp, byAgent, achievements }
}
