import { useMemo } from 'react'
import { Badge, Card, ConnectionBanner, Label, PageHeader } from '../components/ui'
import { useSnapshot } from '../data/source'
import { formatDateTime } from '../lib/format'
import { computeGamification, KIND_LABEL, levelFor } from '../lib/gamification'

function XpBar({ xp }: { xp: number }) {
  const { level, into, span } = levelFor(xp)
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.12em] text-fg-2">Nível <span className="text-lg font-extralight text-white">{level}</span></p>
        <p className="text-xs tabular-nums text-fg-3">{into} / {span} XP</p>
      </div>
      <div role="progressbar" aria-label="Progresso do nível" aria-valuemin={0} aria-valuemax={span} aria-valuenow={into} className="mt-2 h-1 overflow-hidden rounded-full bg-elevated">
        <div className="h-full bg-white" style={{ width: `${Math.round((into / span) * 100)}%` }} />
      </div>
    </div>
  )
}

export function Agents() {
  const snap = useSnapshot()
  const g = useMemo(() => computeGamification(snap.activity, { dailyTarget: snap.goals.dailyTarget }), [snap])
  const unlocked = g.achievements.filter((a) => a.unlockedAt).length
  const nameOf = (id: string) => snap.agents.find((a) => a.id === id)?.name ?? id

  return (
    <>
      <PageHeader title="Agentes" subtitle="XP só por eventos verificados, sem duplicidade." />
      <ConnectionBanner state={snap.connection} />

      <Card className="mx-5">
        <Label>XP total</Label>
        <p className="mt-3 text-4xl font-extralight tabular-nums text-white">{g.totalXp}</p>
        <div className="mt-4"><XpBar xp={g.totalXp} /></div>
      </Card>

      <h2 className="px-5 pb-3 pt-8"><Label>Por agente</Label></h2>
      <ul className="space-y-3 px-5">
        {snap.agents.map((a) => {
          const s = g.byAgent[a.id]
          return (
            <li key={a.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-light uppercase tracking-[0.2em] text-white">{a.name}</p>
                    <p className="mt-1 text-xs text-fg-2">{a.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extralight tabular-nums text-white">{s.xp}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-fg-3">{s.rewards} recompensas</p>
                  </div>
                </div>
                <div className="mt-4"><XpBar xp={s.xp} /></div>
              </Card>
            </li>
          )
        })}
      </ul>

      <h2 className="flex items-baseline justify-between px-5 pb-3 pt-8">
        <Label>Conquistas</Label>
        <span className="text-xs tabular-nums text-fg-3">{unlocked} / {g.achievements.length}</span>
      </h2>
      <ul className="grid grid-cols-2 gap-3 px-5">
        {g.achievements.map((a) => (
          <li key={a.id}>
            <Card className={`h-full ${a.unlockedAt ? '' : 'border-dashed'}`}>
              <Badge>{a.unlockedAt ? 'Desbloqueada' : 'Bloqueada'}</Badge>
              <p className="mt-3 text-sm text-white">{a.title}</p>
              <p className="mt-1 text-xs text-fg-3">{a.description}</p>
            </Card>
          </li>
        ))}
      </ul>

      <h2 className="px-5 pb-3 pt-8"><Label>Histórico de recompensas</Label></h2>
      <Card className="mx-5">
        {g.rewards.length === 0 ? (
          <p className="text-sm text-fg-3">Sem recompensas.</p>
        ) : (
          <ul className="divide-y divide-line">
            {[...g.rewards].reverse().map((r) => (
              <li key={r.eventId} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm text-fg">{KIND_LABEL[r.kind]}</p>
                  <p className="mt-1 text-xs text-fg-3">{nameOf(r.agentId)} · {formatDateTime(r.timestamp)}</p>
                </div>
                <p className="text-sm tabular-nums text-white">+{r.xp}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
