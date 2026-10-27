import { Card, Label, PageHeader, Placeholder } from '../components/ui'

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

export function Settings() {
  return (
    <>
      <PageHeader title="Ajustes" subtitle="Preferências e integração." />
      <Placeholder phase="Fase 6">Configurações e preparação da integração com Worker/D1 virão na Fase 6.</Placeholder>
    </>
  )
}
