-- Cloudflare D1. Aplicar com: wrangler d1 execute aether-hq --file=worker/schema.sql
CREATE TABLE IF NOT EXISTS events (
  event_id    TEXT PRIMARY KEY,           -- deduplicação
  agent_id    TEXT NOT NULL,
  task_id     TEXT,
  status      TEXT NOT NULL,
  activity    TEXT NOT NULL,
  kind        TEXT,
  ts          TEXT NOT NULL,              -- ISO UTC do evento
  received_at TEXT NOT NULL               -- ISO UTC do recebimento (autenticado)
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts DESC);
