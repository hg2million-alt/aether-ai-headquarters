import { handleRequest, type Env } from '../worker/src/index.ts'

/** Pages Function: /events (POST assinado da automação; GET com chave de leitura). Bindings: DB, EVENT_SIGNING_SECRET, HQ_READ_TOKEN. */
export const onRequest = (ctx: { request: Request; env: Env }) => handleRequest(ctx.request, ctx.env)
