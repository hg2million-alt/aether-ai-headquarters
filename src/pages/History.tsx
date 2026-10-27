import { ActivityList } from '../components/ActivityList'
import { Card, ConnectionBanner, PageHeader } from '../components/ui'
import { useSnapshot } from '../data/source'

export function History() {
  const s = useSnapshot()
  return (
    <>
      <PageHeader title="Histórico" subtitle="Eventos operacionais, do mais recente ao mais antigo." />
      <ConnectionBanner state={s.connection} />
      <Card className="mx-5">
        <ActivityList events={s.activity} />
      </Card>
    </>
  )
}
