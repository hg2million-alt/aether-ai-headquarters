/** Assinatura HMAC-SHA256 de eventos. Web Crypto: roda em Workers e no Node. O segredo nunca vai ao frontend. */
const enc = new TextEncoder()
export const MAX_SKEW_MS = 5 * 60 * 1000

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)))
  return Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Assina `${timestamp}.${body}`; timestamp = segundos Unix (anti-replay). */
export const signPayload = (secret: string, timestamp: string, body: string) => hmacHex(secret, `${timestamp}.${body}`)

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export type AuthResult = 'ok' | 'bad_timestamp' | 'expired' | 'bad_signature'

export async function verifySignature(p: { secret: string; timestamp: string | null; signature: string | null; body: string; now?: number }): Promise<AuthResult> {
  if (!p.timestamp || !/^\d{9,12}$/.test(p.timestamp)) return 'bad_timestamp'
  if (Math.abs((p.now ?? Date.now()) - Number(p.timestamp) * 1000) > MAX_SKEW_MS) return 'expired'
  if (!p.signature || !/^[0-9a-f]{64}$/.test(p.signature)) return 'bad_signature'
  const expected = await signPayload(p.secret, p.timestamp, p.body)
  return timingSafeEqual(expected, p.signature) ? 'ok' : 'bad_signature'
}
