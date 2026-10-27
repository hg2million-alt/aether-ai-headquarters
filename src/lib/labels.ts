import type { AgentStatus } from './types'

export const STATUS_PT: Record<AgentStatus, string> = {
  working: 'Trabalhando', idle: 'Ocioso', sleeping: 'Dormindo', completed: 'Concluiu', failed: 'Falhou', unknown: 'Sem sinal',
}

/** "agora", "há 5 min", "há 2 h", "há 3 d". */
export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (s < 60) return 'agora'
  if (s < 3600) return `há ${Math.floor(s / 60)} min`
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`
  return `há ${Math.floor(s / 86400)} d`
}
