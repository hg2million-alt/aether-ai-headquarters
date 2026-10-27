export type AgentId = 'scout' | 'atlas' | 'sentinel' | 'nova' | 'mercury'
export type AgentStatus = 'idle' | 'sleeping' | 'working' | 'completed' | 'failed' | 'unknown'
/** 'simulated' = demonstrativo; 'verified' = vindo de evento autenticado (Fase 6). */
export type DataSource = 'simulated' | 'verified'

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

export interface ActivityEvent {
  eventId: string
  agentId: AgentId
  status: AgentStatus
  activity: string
  timestamp: string
}

export interface NextRoutine {
  /** null = nenhuma rotina configurada */
  at: string | null
  label: string
}

export interface HqSnapshot {
  source: DataSource
  goals: Goals
  progress: GoalProgress
  funnel: Funnel
  agents: AgentInfo[]
  nextRoutine: NextRoutine
  activity: ActivityEvent[]
}
