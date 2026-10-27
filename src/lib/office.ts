import type { AgentId, AgentStatus } from './types'

/** Modo noturno: todos os agentes informados dormindo. Ocioso = acordado circulando; `unknown` não conta. */
export function isNight(statuses: Partial<Record<AgentId, AgentStatus>>): boolean {
  const list = Object.values(statuses)
  return list.length > 0 && list.every((s) => s === 'sleeping')
}
