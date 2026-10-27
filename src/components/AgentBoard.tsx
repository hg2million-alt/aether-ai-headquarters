import { ago, STATUS_PT } from '../lib/labels'
import type { HqSnapshot } from '../lib/types'
import { AgentAvatar } from './AgentAvatar'
import { Card, Label } from './ui'

/** O que cada agente está fazendo agora: estado atual + último evento autenticado. */
export function AgentBoard({ snap }: { snap: HqSnapshot }) {
  return (
    <>
      <h2 className="px-5 pb-3"><Label>Agentes agora</Label></h2>
      <ul className="space-y-3 px-5">
        {snap.agents.map((a) => {
          const last = snap.activity.find((e) => e.agentId === a.id)
          const live = a.status === 'working'
          return (
            <li key={a.id}>
              <Card className="flex gap-4">
                <AgentAvatar id={a.id} status={a.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-light uppercase tracking-[0.2em] text-white">{a.name}</p>
                      <p className="mt-1 text-xs text-fg-2">{a.role}</p>
                    </div>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[10px] uppercase tracking-label text-fg">
                    <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-white' : 'border border-fg-2'}`} />
                    {STATUS_PT[a.status]}
                  </span>
                  <p className="mt-3 text-sm text-fg">{last ? last.activity : 'Sem eventos ainda'}</p>
                  <p className="mt-1 text-xs text-fg-3">
                    {last ? `Último sinal ${ago(last.timestamp)}` : 'Aguardando o primeiro evento da automação'}
                    {last && a.status === 'unknown' ? ' · sem sinal recente' : ''}
                  </p>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </>
  )
}
