import { useState } from 'react'
import { Card, Label, PageHeader } from '../components/ui'
import { fetchSnapshot, getEventsUrl, setEventsUrl, useSnapshot } from '../data/source'

const CONN_PT = { not_configured: 'Não conectado', connecting: 'Conectando…', online: 'Conectado', error: 'Erro de conexão' } as const

export function Settings() {
  const snap = useSnapshot()
  const [url, setUrl] = useState(getEventsUrl)
  const [msg, setMsg] = useState('')

  const save = () => {
    setEventsUrl(url.trim())
    setMsg(url.trim() ? 'Endereço salvo neste aparelho.' : 'Conexão removida.')
  }
  const test = async () => {
    setMsg('Testando…')
    try {
      const s = await fetchSnapshot(url.trim())
      setMsg(`OK · ${s.activity.length} evento(s) recebido(s).`)
    } catch (e) {
      setMsg(`Falhou: ${(e as Error).message}. Verifique o endereço e o acesso.`)
    }
  }

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Conexão com a automação." />
      <Card className="mx-5">
        <Label>Estado</Label>
        <p className="mt-3 text-2xl font-extralight text-white">{CONN_PT[snap.connection]}</p>
        <p className="mt-2 text-xs text-fg-3">O HQ só mostra eventos autenticados enviados pela automação. Sem conexão, tudo fica zerado.</p>
      </Card>

      <Card className="mx-5 mt-4">
        <label htmlFor="url"><Label>Endereço dos eventos (Worker)</Label></label>
        <input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="https://…/events"
          className="mt-3 min-h-12 w-full rounded-xl border border-line bg-bg px-4 text-sm text-white placeholder:text-fg-3"
        />
        <p className="mt-2 text-xs text-fg-3">Só o endereço público. Nenhuma senha ou chave é guardada aqui.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={save} className="min-h-12 rounded-xl border border-white bg-elevated text-[10px] uppercase tracking-[0.08em] text-white">Salvar</button>
          <button onClick={test} className="min-h-12 rounded-xl border border-line text-[10px] uppercase tracking-[0.08em] text-fg-2">Testar</button>
        </div>
        {msg && <p role="status" className="mt-3 text-xs text-fg-2">{msg}</p>}
      </Card>
    </>
  )
}
