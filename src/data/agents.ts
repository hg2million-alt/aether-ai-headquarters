import type { AgentId, Goals } from '../lib/types'

/** Os cinco agentes são funções operacionais (não cinco IAs simultâneas). */
export const AGENT_META: { id: AgentId; name: string; role: string }[] = [
  { id: 'scout', name: 'SCOUT', role: 'Prospecção' },
  { id: 'atlas', name: 'ATLAS', role: 'Desenvolvimento' },
  { id: 'sentinel', name: 'SENTINEL', role: 'Qualidade' },
  { id: 'nova', name: 'NOVA', role: 'Publicação' },
  { id: 'mercury', name: 'MERCURY', role: 'Comercial' },
]

/** Metas de produção (hipóteses de trabalho, não resultados). */
export const GOALS: Goals = { dailyTarget: 2, weeklyTarget: 14 }
