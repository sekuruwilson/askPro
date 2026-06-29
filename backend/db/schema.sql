-- ============================================================
-- AskDHS Intelligence — PostgreSQL Schema
-- Run this file against the nisr_askPro database
-- Requires pgvector extension to be enabled first
-- ============================================================

-- Enable vector extension (must already be done in nisr_askPro)
CREATE EXTENSION IF NOT EXISTS vector;

-- ────────────────────────────────────────────────────────────
-- 1. Documents — stores metadata for each uploaded PDF
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      TEXT        NOT NULL,          -- internal filename with timestamp prefix
  original_name TEXT        NOT NULL,          -- original uploaded filename
  file_size     INTEGER,                       -- file size in bytes
  page_count    INTEGER,                       -- number of pages (filled after PDF parsing)
  category      TEXT        DEFAULT 'DHS',     -- DHS / Census / EICV / Other
  year          INTEGER,                       -- publication year if extractable
  description   TEXT,                          -- auto-generated or manual description
  status        TEXT        DEFAULT 'processing', -- processing | ready | failed
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. Document Chunks — text chunks + embeddings
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_chunks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID        REFERENCES documents(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,   -- actual text of this chunk
  chunk_index INTEGER,                -- position of this chunk in the document
  page_number INTEGER,                -- source page number in the original PDF
  embedding   vector(1536),           -- OpenAI text-embedding-3-small (1536 dims)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. Conversations — chat sessions
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT,                    -- set from the first user message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 4. Messages — individual chat messages
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL,   -- "user" or "assistant"
  content         TEXT        NOT NULL,
  sources         JSONB,                  -- [{document, excerpt, similarity}]
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- Vector Index
-- NOTE: Create this AFTER loading at least a few hundred chunks.
-- Uncomment and run separately once you have data:
-- CREATE INDEX IF NOT EXISTS chunks_embedding_idx
--   ON document_chunks USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);
-- ────────────────────────────────────────────────────────────
