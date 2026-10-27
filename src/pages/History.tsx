import { ActivityList } from '../components/ActivityList'
import { Card, PageHeader, SimBanner } from '../components/ui'
import { useSnapshot } from '../data/source'

export function History() {
  const s = useSnapshot()
  return (
    <>
      <PageHeader title="Histórico" subtitle="Eventos operacionais, do mais recente ao mais antigo." />
      {s.source === 'simulated' && <SimBanner />}
      <Card className="mx-5">
        <ActivityList events={s.activity} />
      </Card>
    </>
  )
}
