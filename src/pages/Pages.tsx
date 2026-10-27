import { Card, Label, PageHeader, Placeholder, Stat } from '../components/ui'

export function Dashboard() {
  return (
    <>
      <PageHeader title="Painel" subtitle="Metas e resultados são exibidos separadamente." />
      <div className="grid grid-cols-2 gap-3 px-5 pb-4">
        <Stat label="Meta diária" value="2" hint="demos / dia" />
        <Stat label="Meta semanal" value="14" hint="demos / semana" />
      </div>
      <Placeholder phase="Fase 2">
        Métricas reais (leads, demos, propostas, vendas) serão adicionadas na Fase 2. Nenhum número fictício é exibido como resultado.
      </Placeholder>
    </>
  )
}

export function Office() {
  return (
    <>
      <PageHeader title="Escritório" subtitle="Escritório virtual isométrico." />
      <Placeholder phase="Fase 3">
        Cena 3D (Three.js / React Three Fiber) com fallback 2D será implementada na Fase 3.
      </Placeholder>
    </>
  )
}

const agents = [
  ['SCOUT', 'Prospecção'],
  ['ATLAS', 'Desenvolvimento'],
  ['SENTINEL', 'Qualidade'],
  ['NOVA', 'Publicação'],
  ['MERCURY', 'Comercial'],
]

export function Agents() {
  return (
    <>
      <PageHeader title="Agentes" subtitle="Funções operacionais, não processos de IA simultâneos." />
      <ul className="space-y-3 px-5">
        {agents.map(([name, role]) => (
          <li key={name}>
            <Card className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light uppercase tracking-title text-white">{name}</p>
                <p className="mt-1 text-xs text-fg-2">{role}</p>
              </div>
              <Label>unknown</Label>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}

export function History() {
  return (
    <>
      <PageHeader title="Histórico" subtitle="Eventos operacionais verificados." />
      <Placeholder phase="Fase 2">Sem eventos registrados. O histórico será alimentado por eventos autenticados.</Placeholder>
    </>
  )
}

export function Settings() {
  return (
    <>
      <PageHeader title="Ajustes" subtitle="Preferências e integração." />
      <Placeholder phase="Fase 6">Configurações e preparação da integração com Worker/D1 virão na Fase 6.</Placeholder>
    </>
  )
}
