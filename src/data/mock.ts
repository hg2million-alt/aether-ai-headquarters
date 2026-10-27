import type { HqSnapshot } from '../lib/types'

/** DADOS SIMULADOS — apenas demonstração visual. Substituídos por eventos verificados na Fase 6. */
export const mockSnapshot: HqSnapshot = {
  source: 'simulated',
  goals: { dailyTarget: 2, weeklyTarget: 14 },
  progress: { publishedToday: 1, publishedThisWeek: 6 },
  funnel: {
    leadsFound: 48,
    leadsQualified: 21,
    demosInDevelopment: 2,
    demosProduced: 8,
    demosPublished: 6,
    demosPresented: 3,
    repliesReceived: 1,
    negotiations: 1,
    proposalsSent: 1,
    salesConfirmed: 0,
    revenueBRL: 0,
  },
  agents: [
    { id: 'scout', name: 'SCOUT', role: 'Prospecção', status: 'idle' },
    { id: 'atlas', name: 'ATLAS', role: 'Desenvolvimento', status: 'working' },
    { id: 'sentinel', name: 'SENTINEL', role: 'Qualidade', status: 'sleeping' },
    { id: 'nova', name: 'NOVA', role: 'Publicação', status: 'completed' },
    { id: 'mercury', name: 'MERCURY', role: 'Comercial', status: 'unknown' },
  ],
  nextRoutine: { at: null, label: 'Nenhuma rotina configurada' },
  activity: [
    { eventId: 'sim_006', agentId: 'nova', taskId: 'demo_001', kind: 'demo_published', verified: false, status: 'completed', activity: 'Demo publicada (evento duplicado)', timestamp: '2026-10-27T13:43:00Z' },
    { eventId: 'sim_005', agentId: 'atlas', status: 'working', activity: 'Montando demo a partir de template', timestamp: '2026-10-27T15:10:00Z' },
    { eventId: 'sim_004', agentId: 'nova', taskId: 'demo_001', kind: 'demo_published', verified: false, status: 'completed', activity: 'Demo publicada', timestamp: '2026-10-27T13:42:00Z' },
    { eventId: 'sim_003', agentId: 'sentinel', taskId: 'demo_001', kind: 'qa_passed', verified: false, status: 'completed', activity: 'Testes de links e build aprovados', timestamp: '2026-10-27T13:30:00Z' },
    { eventId: 'sim_002', agentId: 'scout', taskId: 'demo_001', kind: 'lead_qualified', verified: false, status: 'completed', activity: 'Lead qualificado selecionado', timestamp: '2026-10-27T12:55:00Z' },
    { eventId: 'sim_001', agentId: 'mercury', status: 'failed', activity: 'Rascunho de abordagem recusado na revisão', timestamp: '2026-10-26T20:05:00Z' },
  ],
}
