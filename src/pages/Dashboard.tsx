import { ActivityList } from '../components/ActivityList'
import { Card, Label, PageHeader, Progress, SimBanner, Stat } from '../components/ui'
import { mockSnapshot as s } from '../data/mock'
import { formatBRL } from '../lib/format'

export function Dashboard() {
  const { funnel: f, agents } = s
  const active = agents.filter((a) => a.status === 'working').length
  const resting = agents.filter((a) => a.status === 'idle' || a.status === 'sleeping').length
  const unknown = agents.filter((a) => a.status === 'unknown').length

  return (
    <>
      <PageHeader title="Painel" subtitle="Metas e resultados são exibidos separadamente." />
      {s.source === 'simulated' && <SimBanner />}

      <h2 className="px-5 pb-3"><Label>Metas · demos publicadas</Label></h2>
      <Card className="mx-5 space-y-6">
        <Progress label="Hoje" value={s.progress.publishedToday} target={s.goals.dailyTarget} />
        <Progress label="Semana" value={s.progress.publishedThisWeek} target={s.goals.weeklyTarget} />
      </Card>

      <h2 className="px-5 pb-3 pt-8"><Label>Resultados</Label></h2>
      <div className="grid grid-cols-2 gap-3 px-5">
        <Stat label="Leads qualificados" value={String(f.leadsQualified)} hint={`${f.leadsFound} encontrados`} />
        <Stat label="Em produção" value={String(f.demosInDevelopment)} hint={`${f.demosProduced} produzidas`} />
        <Stat label="Publicadas" value={String(f.demosPublished)} />
        <Stat label="Apresentadas" value={String(f.demosPresented)} hint={`${f.repliesReceived} respostas`} />
        <Stat label="Negociações" value={String(f.negotiations)} hint={`${f.proposalsSent} propostas enviadas`} />
        <Stat label="Vendas" value={String(f.salesConfirmed)} hint="confirmadas" />
        <div className="col-span-2">
          <Stat label="Receita registrada" value={formatBRL(f.revenueBRL)} />
        </div>
      </div>

      <h2 className="px-5 pb-3 pt-8"><Label>Operação</Label></h2>
      <div className="grid grid-cols-2 gap-3 px-5">
        <Stat label="Agentes ativos" value={String(active)} hint={unknown ? `${unknown} desconhecido` : undefined} />
        <Stat label="Descansando" value={String(resting)} />
        <Card className="col-span-2">
          <Label>Próxima rotina</Label>
          <p className="mt-3 text-sm text-fg-2">{s.nextRoutine.label}</p>
        </Card>
      </div>

      <h2 className="px-5 pb-3 pt-8"><Label>Atividade recente</Label></h2>
      <Card className="mx-5">
        <ActivityList events={s.activity} limit={4} />
      </Card>
    </>
  )
}
