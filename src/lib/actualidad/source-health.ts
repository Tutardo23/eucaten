import type { SourceCollectionResult } from "./collectors/common";
import { getActualidadSql, isActualidadDatabaseConfigured } from "./db";
import type { ActualidadSourceKey } from "./sources";

export type SourceHealthStatus = "ok" | "warning" | "error";

export type ActualidadSourceHealth = {
  sourceKey: ActualidadSourceKey;
  lastCheckedAt: string;
  lastSuccessAt?: string;
  status: SourceHealthStatus;
  found: number;
  created: number;
  existing: number;
  skipped: number;
  errorSummary?: string;
};

let ensurePromise: Promise<void> | null = null;

async function ensureSourceHealthTable() {
  if (!isActualidadDatabaseConfigured()) return;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    const sql = getActualidadSql();
    await sql`
      CREATE TABLE IF NOT EXISTS actualidad_source_health (
        source_key TEXT PRIMARY KEY,
        last_checked_at TIMESTAMPTZ NOT NULL,
        last_success_at TIMESTAMPTZ,
        status TEXT NOT NULL,
        found INTEGER NOT NULL DEFAULT 0,
        created INTEGER NOT NULL DEFAULT 0,
        existing INTEGER NOT NULL DEFAULT 0,
        skipped INTEGER NOT NULL DEFAULT 0,
        error_summary TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  })().catch((error) => {
    ensurePromise = null;
    throw error;
  });

  return ensurePromise;
}

function statusFor(result: SourceCollectionResult): SourceHealthStatus {
  if (!result.errors.length) return "ok";
  if (result.found > 0 || result.created > 0 || result.existing > 0) return "warning";
  return "error";
}

export async function recordActualidadSourceHealth(
  results: readonly SourceCollectionResult[],
) {
  if (!isActualidadDatabaseConfigured() || !results.length) return;

  await ensureSourceHealthTable();
  const sql = getActualidadSql();

  const payload = JSON.stringify(
    results.map((result) => ({
      source_key: result.source,
      last_checked_at: result.checkedAt,
      status: statusFor(result),
      found: result.found,
      created: result.created,
      existing: result.existing,
      skipped: result.skipped,
      error_summary: result.errors.length
        ? result.errors.slice(0, 3).join(" | ").slice(0, 1800)
        : null,
    })),
  );

  await sql`
    INSERT INTO actualidad_source_health (
      source_key,
      last_checked_at,
      last_success_at,
      status,
      found,
      created,
      existing,
      skipped,
      error_summary,
      updated_at
    )
    SELECT
      row.source_key,
      row.last_checked_at,
      CASE WHEN row.status <> 'error' THEN row.last_checked_at ELSE NULL END,
      row.status,
      row.found,
      row.created,
      row.existing,
      row.skipped,
      row.error_summary,
      NOW()
    FROM jsonb_to_recordset(${payload}::jsonb) AS row(
      source_key TEXT,
      last_checked_at TIMESTAMPTZ,
      status TEXT,
      found INTEGER,
      created INTEGER,
      existing INTEGER,
      skipped INTEGER,
      error_summary TEXT
    )
    ON CONFLICT (source_key)
    DO UPDATE SET
      last_checked_at = EXCLUDED.last_checked_at,
      last_success_at = CASE
        WHEN EXCLUDED.status <> 'error' THEN EXCLUDED.last_checked_at
        ELSE actualidad_source_health.last_success_at
      END,
      status = EXCLUDED.status,
      found = EXCLUDED.found,
      created = EXCLUDED.created,
      existing = EXCLUDED.existing,
      skipped = EXCLUDED.skipped,
      error_summary = EXCLUDED.error_summary,
      updated_at = NOW()
  `;
}

export async function listActualidadSourceHealth(): Promise<ActualidadSourceHealth[]> {
  if (!isActualidadDatabaseConfigured()) return [];

  await ensureSourceHealthTable();
  const sql = getActualidadSql();
  const rows = (await sql`
    SELECT
      source_key,
      last_checked_at,
      last_success_at,
      status,
      found,
      created,
      existing,
      skipped,
      error_summary
    FROM actualidad_source_health
    ORDER BY last_checked_at DESC, source_key ASC
  `) as {
    source_key: ActualidadSourceKey;
    last_checked_at: string | Date;
    last_success_at: string | Date | null;
    status: SourceHealthStatus;
    found: number;
    created: number;
    existing: number;
    skipped: number;
    error_summary: string | null;
  }[];

  return rows.map((row) => ({
    sourceKey: row.source_key,
    lastCheckedAt: new Date(row.last_checked_at).toISOString(),
    lastSuccessAt: row.last_success_at
      ? new Date(row.last_success_at).toISOString()
      : undefined,
    status: row.status,
    found: Number(row.found),
    created: Number(row.created),
    existing: Number(row.existing),
    skipped: Number(row.skipped),
    errorSummary: row.error_summary ?? undefined,
  }));
}
