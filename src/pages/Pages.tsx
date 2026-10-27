import { useState } from 'react'
import { Card, Label, PageHeader } from '../components/ui'
import { fetchSnapshot, getReadKey, getStoredUrl, HttpError, setEventsUrl, setReadKey, useSnapshot } from '../data/source'

const CONN_PT = { not_configured: 'Não conectado', connecting: 'Conectando…', online: 'Conectado', unauthorized: 'Chave inválida', error: 'Erro de conexão' } as const

export function Settings() {
  const snap = useSnapshot()
  const [url, setUrl] = useState(getStoredUrl)
  const [key, setKey] = useState(getReadKey)
  const [msg, setMsg] = useState('')

  const save = () => {
    setEventsUrl(url.trim())
    setReadKey(key.trim())
    setMsg('Salvo neste aparelho.')
  }
  const test = async () => {
    setMsg('Testando…')
    try {
      const s = await fetchSnapshot(url.trim() || '/events', key.trim())
      setMsg(`OK · ${s.activity.length} evento(s) recebido(s).`)
    } catch (e) {
      setMsg(e instanceof HttpError && (e.status === 401 || e.status === 403) ? 'Chave de leitura inválida.' : `Falhou: ${(e as Error).message}. Verifique o endereço.`)
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
        <label htmlFor="key"><Label>Chave de leitura</Label></label>
        <input
          id="key"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Cole a chave de leitura"
          className="mt-3 min-h-12 w-full rounded-xl border border-line bg-bg px-4 text-sm text-white placeholder:text-fg-3"
        />
        <p className="mt-2 text-xs text-fg-3">Fica só neste aparelho. Libera a leitura dos eventos.</p>
        <label htmlFor="url" className="mt-5 block"><Label>Endereço dos eventos (opcional)</Label></label>
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
        <p className="mt-2 text-xs text-fg-3">Em branco: usa o próprio site quando hospedado. No arquivo offline, informe o endereço completo.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={save} className="min-h-12 rounded-xl border border-white bg-elevated text-[10px] uppercase tracking-[0.08em] text-white">Salvar</button>
          <button onClick={test} className="min-h-12 rounded-xl border border-line text-[10px] uppercase tracking-[0.08em] text-fg-2">Testar</button>
        </div>
        {msg && <p role="status" className="mt-3 text-xs text-fg-2">{msg}</p>}
      </Card>
    </>
  )
}
