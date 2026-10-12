CREATE TABLE IF NOT EXISTS actualidad_news_items (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  fingerprint TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  source_key TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (
    source_type IN (
      'official',
      'judicial',
      'international_organization',
      'specialized_media',
      'press'
    )
  ),
  source_published_at TIMESTAMPTZ NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  categories TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'published', 'rejected')
  ),
  is_jurisprudence BOOLEAN NOT NULL DEFAULT FALSE,
  court TEXT,
  case_name TEXT,
  judgment_date DATE,
  judgment_url TEXT,
  judgment_verified BOOLEAN NOT NULL DEFAULT FALSE,
  published_by TEXT,
  web_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT actualidad_judgment_verification_requires_url
    CHECK (NOT judgment_verified OR judgment_url IS NOT NULL)
);

-- statement-breakpoint

CREATE INDEX IF NOT EXISTS actualidad_news_items_status_published_idx
  ON actualidad_news_items (status, source_published_at DESC);

-- statement-breakpoint

CREATE INDEX IF NOT EXISTS actualidad_news_items_categories_idx
  ON actualidad_news_items USING GIN (categories);

-- statement-breakpoint

CREATE INDEX IF NOT EXISTS actualidad_news_items_source_key_idx
  ON actualidad_news_items (source_key);
