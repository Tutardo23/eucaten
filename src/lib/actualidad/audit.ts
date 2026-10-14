import { getActualidadSql, isActualidadDatabaseConfigured } from "./db";

export type ActualidadAuditAction =
  | "onboarding_completed"
  | "radar_run"
  | "review_marked"
  | "item_created"
  | "item_updated"
  | "item_published"
  | "item_rejected"
  | "item_pending";

export type ActualidadAuditEntry = {
  id: number;
  actorKey: string;
  actorLabel: string;
  action: ActualidadAuditAction;
  itemId?: string;
  detail?: string;
  createdAt: string;
};

let ensurePromise: Promise<void> | null = null;

async function ensureAuditTable() {
  if (!isActualidadDatabaseConfigured()) return;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    const sql = getActualidadSql();
    await sql`
      CREATE TABLE IF NOT EXISTS actualidad_audit_log (
        id BIGSERIAL PRIMARY KEY,
        actor_key TEXT NOT NULL,
        actor_label TEXT NOT NULL,
        action TEXT NOT NULL,
        item_id TEXT,
        detail TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS actualidad_audit_log_created_at_idx
      ON actualidad_audit_log (created_at DESC)
    `;
  })().catch((error) => {
    ensurePromise = null;
    throw error;
  });

  return ensurePromise;
}

export async function writeActualidadAuditSafe(input: {
  actorKey: string;
  actorLabel: string;
  action: ActualidadAuditAction;
  itemId?: string;
  detail?: string;
}) {
  if (!isActualidadDatabaseConfigured()) return;

  try {
    await ensureAuditTable();
    const sql = getActualidadSql();

    await sql`
      INSERT INTO actualidad_audit_log (
        actor_key,
        actor_label,
        action,
        item_id,
        detail
      )
      VALUES (
        ${input.actorKey},
        ${input.actorLabel},
        ${input.action},
        ${input.itemId ?? null},
        ${input.detail?.slice(0, 900) ?? null}
      )
    `;
  } catch (error) {
    // La auditoría nunca debe bloquear una decisión editorial válida.
    console.warn("[actualidad:audit]", error);
  }
}

export async function listRecentActualidadAudit(
  limit = 12,
): Promise<ActualidadAuditEntry[]> {
  if (!isActualidadDatabaseConfigured()) return [];

  try {
    await ensureAuditTable();
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
    const sql = getActualidadSql();

    const rows = (await sql`
      SELECT id, actor_key, actor_label, action, item_id, detail, created_at
      FROM actualidad_audit_log
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `) as {
      id: number | string;
      actor_key: string;
      actor_label: string;
      action: ActualidadAuditAction;
      item_id: string | null;
      detail: string | null;
      created_at: string | Date;
    }[];

    return rows.map((row) => ({
      id: Number(row.id),
      actorKey: row.actor_key,
      actorLabel: row.actor_label,
      action: row.action,
      itemId: row.item_id ?? undefined,
      detail: row.detail ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  } catch {
    return [];
  }
}
