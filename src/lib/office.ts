import type { AgentId, AgentStatus } from './types'

const resting: AgentStatus[] = ['idle', 'sleeping']

/** Modo noturno: todos os agentes informados confirmadamente inativos. `unknown` não conta como inativo. */
export function isNight(statuses: Partial<Record<AgentId, AgentStatus>>): boolean {
  const list = Object.values(statuses)
  return list.length > 0 && list.every((s) => resting.includes(s))
}
