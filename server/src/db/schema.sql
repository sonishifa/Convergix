CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL DEFAULT 'Untitled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snapshots (
  id         BIGSERIAL PRIMARY KEY,
  doc_id     TEXT NOT NULL,
  state      BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_snapshots_doc ON snapshots(doc_id, created_at DESC);

CREATE TABLE IF NOT EXISTS op_log (
  id         BIGSERIAL PRIMARY KEY,
  doc_id     TEXT NOT NULL,
  user_id    TEXT,
  user_name  TEXT,
  op         BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_oplog_doc ON op_log(doc_id, created_at);