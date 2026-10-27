export type AgentId = 'scout' | 'atlas' | 'sentinel' | 'nova' | 'mercury'
export type AgentStatus = 'idle' | 'sleeping' | 'working' | 'completed' | 'failed' | 'unknown'
/** Estado da conexão com a automação (Worker). */
export type Connection = 'not_configured' | 'connecting' | 'online' | 'unauthorized' | 'error'

export interface Funnel {
  leadsFound: number
  leadsQualified: number
  demosInDevelopment: number
  demosProduced: number
  demosPublished: number
  demosPresented: number
  repliesReceived: number
  negotiations: number
  proposalsSent: number
  salesConfirmed: number
  revenueBRL: number
}

export interface Goals {
  dailyTarget: number
  weeklyTarget: number
}

export interface GoalProgress {
  publishedToday: number
  publishedThisWeek: number
}

export interface AgentInfo {
  id: AgentId
  name: string
  role: string
  status: AgentStatus
}

/** Marcos operacionais que podem render XP (quando verificados). */
export type EventKind =
  | 'lead_qualified'
  | 'demo_built'
  | 'qa_passed'
  | 'demo_published'
  | 'demo_presented'
  | 'proposal_prepared'
  | 'sale_confirmed'

export interface ActivityEvent {
  eventId: string
  agentId: AgentId
  taskId?: string
  status: AgentStatus
  activity: string
  timestamp: string
  kind?: EventKind
  /** true somente para eventos autenticados vindos da automação (Fase 6). */
  verified?: boolean
}

export interface NextRoutine {
  /** null = nenhuma rotina configurada */
  at: string | null
  label: string
}

export interface HqSnapshot {
  connection: Connection
  goals: Goals
  progress: GoalProgress
  funnel: Funnel
  agents: AgentInfo[]
  nextRoutine: NextRoutine
  activity: ActivityEvent[]
}
