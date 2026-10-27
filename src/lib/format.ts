const tz = 'America/Sao_Paulo'
const dt = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatDateTime = (iso: string) => dt.format(new Date(iso))
export const formatBRL = (n: number) => brl.format(n)
