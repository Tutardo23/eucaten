import type { ActualidadSourceKey } from "./sources";
import {
  type ActualidadCategory,
  type ActualidadItem,
  type ActualidadSourceType,
  type ActualidadStatus,
} from "./types";
import {
  createActualidadFingerprint,
  createActualidadId,
  createActualidadSlug,
  assertActualidadCategories,
  assertActualidadSourceType,
  assertHttpUrl,
} from "./validation";
import {
  getActualidadSql,
  isActualidadDatabaseConfigured,
} from "./db";

type NewsRow = {
  id: string;
  slug: string;
  fingerprint: string;
  title: string;
  summary: string;
  source_key: string | null;
  source_name: string;
  source_url: string;
  source_type: ActualidadSourceType;
  source_published_at: string | Date;
  collected_at: string | Date;
  categories: string[];
  status: ActualidadStatus;
  is_jurisprudence: boolean;
  court: string | null;
  case_name: string | null;
  judgment_date: string | Date | null;
  judgment_url: string | null;
  judgment_verified: boolean;
  published_by: string | null;
  web_published_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

export type CreateActualidadInput = {
  title: string;
  summary?: string;
  sourceKey?: ActualidadSourceKey;
  sourceName: string;
  sourceUrl: string;
  sourceType: ActualidadSourceType;
  publishedAt: string;
  categories: ActualidadCategory[];
  jurisprudence?: {
    court?: string;
    caseName?: string;
    judgmentDate?: string;
    judgmentUrl?: string;
    judgmentVerified?: boolean;
  };
};

export type UpdateActualidadInput = Omit<CreateActualidadInput, "publishedAt"> & {
  publishedAt: string;
};

function toIso(value: string | Date | null | undefined) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function rowToActualidadItem(row: NewsRow): ActualidadItem {
  return {
    id: row.id,
    slug: row.slug,
    fingerprint: row.fingerprint,
    title: row.title,
    summary: row.summary,
    sourceKey: (row.source_key as ActualidadSourceKey | null) ?? undefined,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    publishedAt: new Date(row.source_published_at).toISOString(),
    collectedAt: new Date(row.collected_at).toISOString(),
    categories: row.categories as ActualidadCategory[],
    status: row.status,
    jurisprudence: row.is_jurisprudence
      ? {
          court: row.court ?? undefined,
          caseName: row.case_name ?? undefined,
          judgmentDate: toIso(row.judgment_date),
          judgmentUrl: row.judgment_url ?? undefined,
          judgmentVerified: row.judgment_verified,
        }
      : undefined,
    publishedBy: row.published_by ?? undefined,
    webPublishedAt: toIso(row.web_published_at),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function validateInput(input: CreateActualidadInput | UpdateActualidadInput) {
  if (!input.title.trim()) throw new Error("El título es obligatorio.");
  if (!input.sourceName.trim()) throw new Error("La fuente es obligatoria.");

  assertHttpUrl(input.sourceUrl, "sourceUrl");
  assertActualidadSourceType(input.sourceType);
  assertActualidadCategories(input.categories);

  const publishedAt = new Date(input.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error("publishedAt debe ser una fecha válida.");
  }

  if (input.jurisprudence?.judgmentUrl) {
    assertHttpUrl(input.jurisprudence.judgmentUrl, "judgmentUrl");
  }

  if (
    input.jurisprudence?.judgmentVerified &&
    !input.jurisprudence.judgmentUrl
  ) {
    throw new Error(
      "Una sentencia solo puede marcarse como verificada si tiene enlace judicial.",
    );
  }
}

export async function listPublishedActualidad(
  limit = 50,
): Promise<ActualidadItem[]> {
  if (!isActualidadDatabaseConfigured()) return [];

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const sql = getActualidadSql();

  const rows = (await sql`
    SELECT *
    FROM actualidad_news_items
    WHERE status = 'published'
    ORDER BY source_published_at DESC, created_at DESC
    LIMIT ${safeLimit}
  `) as NewsRow[];

  return rows.map(rowToActualidadItem);
}

export async function listActualidadByStatus(
  status: ActualidadStatus,
  limit = 100,
): Promise<ActualidadItem[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);
  const sql = getActualidadSql();

  const rows = (await sql`
    SELECT *
    FROM actualidad_news_items
    WHERE status = ${status}
    ORDER BY source_published_at DESC, created_at DESC
    LIMIT ${safeLimit}
  `) as NewsRow[];

  return rows.map(rowToActualidadItem);
}

export async function getActualidadById(id: string) {
  const sql = getActualidadSql();
  const rows = (await sql`
    SELECT *
    FROM actualidad_news_items
    WHERE id = ${id}
    LIMIT 1
  `) as NewsRow[];

  return rows[0] ? rowToActualidadItem(rows[0]) : null;
}

export async function createActualidadItem(
  input: CreateActualidadInput,
): Promise<ActualidadItem> {
  validateInput(input);

  const sql = getActualidadSql();
  const id = createActualidadId();
  const slug = createActualidadSlug(input.title, id);
  const fingerprint = createActualidadFingerprint(input);
  const jurisprudence = input.jurisprudence;
  const isJurisprudence = Boolean(jurisprudence);
  const judgmentVerified = jurisprudence?.judgmentVerified ?? false;

  const rows = (await sql`
    INSERT INTO actualidad_news_items (
      id,
      slug,
      fingerprint,
      title,
      summary,
      source_key,
      source_name,
      source_url,
      source_type,
      source_published_at,
      categories,
      status,
      is_jurisprudence,
      court,
      case_name,
      judgment_date,
      judgment_url,
      judgment_verified
    )
    VALUES (
      ${id},
      ${slug},
      ${fingerprint},
      ${input.title.trim()},
      ${(input.summary ?? "").trim()},
      ${input.sourceKey ?? null},
      ${input.sourceName.trim()},
      ${input.sourceUrl},
      ${input.sourceType},
      ${new Date(input.publishedAt).toISOString()},
      ${input.categories},
      'pending',
      ${isJurisprudence},
      ${jurisprudence?.court?.trim() || null},
      ${jurisprudence?.caseName?.trim() || null},
      ${jurisprudence?.judgmentDate || null},
      ${jurisprudence?.judgmentUrl || null},
      ${judgmentVerified}
    )
    RETURNING *
  `) as NewsRow[];

  return rowToActualidadItem(rows[0]);
}


export async function createActualidadItemIfNew(
  input: CreateActualidadInput,
): Promise<{ created: boolean; item: ActualidadItem }> {
  validateInput(input);

  const sql = getActualidadSql();

  const existingByUrl = (await sql`
    SELECT *
    FROM actualidad_news_items
    WHERE source_url = ${input.sourceUrl}
    ORDER BY created_at DESC
    LIMIT 1
  `) as NewsRow[];

  if (existingByUrl[0]) {
    return { created: false, item: rowToActualidadItem(existingByUrl[0]) };
  }

  const id = createActualidadId();
  const slug = createActualidadSlug(input.title, id);
  const fingerprint = createActualidadFingerprint(input);
  const jurisprudence = input.jurisprudence;
  const isJurisprudence = Boolean(jurisprudence);
  const judgmentVerified = jurisprudence?.judgmentVerified ?? false;

  const rows = (await sql`
    INSERT INTO actualidad_news_items (
      id,
      slug,
      fingerprint,
      title,
      summary,
      source_key,
      source_name,
      source_url,
      source_type,
      source_published_at,
      categories,
      status,
      is_jurisprudence,
      court,
      case_name,
      judgment_date,
      judgment_url,
      judgment_verified
    )
    VALUES (
      ${id},
      ${slug},
      ${fingerprint},
      ${input.title.trim()},
      ${(input.summary ?? "").trim()},
      ${input.sourceKey ?? null},
      ${input.sourceName.trim()},
      ${input.sourceUrl},
      ${input.sourceType},
      ${new Date(input.publishedAt).toISOString()},
      ${input.categories},
      'pending',
      ${isJurisprudence},
      ${jurisprudence?.court?.trim() || null},
      ${jurisprudence?.caseName?.trim() || null},
      ${jurisprudence?.judgmentDate || null},
      ${jurisprudence?.judgmentUrl || null},
      ${judgmentVerified}
    )
    ON CONFLICT (fingerprint) DO NOTHING
    RETURNING *
  `) as NewsRow[];

  if (rows[0]) {
    return { created: true, item: rowToActualidadItem(rows[0]) };
  }

  const existingByFingerprint = (await sql`
    SELECT *
    FROM actualidad_news_items
    WHERE fingerprint = ${fingerprint}
    LIMIT 1
  `) as NewsRow[];

  if (!existingByFingerprint[0]) {
    throw new Error("La publicación no pudo guardarse ni recuperarse después de deduplicar.");
  }

  return { created: false, item: rowToActualidadItem(existingByFingerprint[0]) };
}

export async function updateActualidadItem(
  id: string,
  input: UpdateActualidadInput,
): Promise<ActualidadItem | null> {
  validateInput(input);

  const sql = getActualidadSql();
  const jurisprudence = input.jurisprudence;
  const isJurisprudence = Boolean(jurisprudence);
  const judgmentVerified = jurisprudence?.judgmentVerified ?? false;

  const rows = (await sql`
    UPDATE actualidad_news_items
    SET
      title = ${input.title.trim()},
      summary = ${(input.summary ?? "").trim()},
      source_key = ${input.sourceKey ?? null},
      source_name = ${input.sourceName.trim()},
      source_url = ${input.sourceUrl},
      source_type = ${input.sourceType},
      source_published_at = ${new Date(input.publishedAt).toISOString()},
      categories = ${input.categories},
      is_jurisprudence = ${isJurisprudence},
      court = ${jurisprudence?.court?.trim() || null},
      case_name = ${jurisprudence?.caseName?.trim() || null},
      judgment_date = ${jurisprudence?.judgmentDate || null},
      judgment_url = ${jurisprudence?.judgmentUrl || null},
      judgment_verified = ${judgmentVerified},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `) as NewsRow[];

  return rows[0] ? rowToActualidadItem(rows[0]) : null;
}

export async function setActualidadStatus(
  id: string,
  status: ActualidadStatus,
  actor?: string,
): Promise<ActualidadItem | null> {
  const sql = getActualidadSql();
  const isPublishing = status === "published";

  const rows = (await sql`
    UPDATE actualidad_news_items
    SET
      status = ${status},
      published_by = CASE
        WHEN ${isPublishing} THEN ${actor ?? null}
        ELSE published_by
      END,
      web_published_at = CASE
        WHEN ${isPublishing} THEN COALESCE(web_published_at, NOW())
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `) as NewsRow[];

  return rows[0] ? rowToActualidadItem(rows[0]) : null;
}

export async function getPublishedActualidadBySlug(slug: string) {
  if (!isActualidadDatabaseConfigured()) return null;

  const safeSlug = slug.trim();
  if (!safeSlug) return null;

  const sql = getActualidadSql();
  const rows = (await sql`
    SELECT *
    FROM actualidad_news_items
    WHERE slug = ${safeSlug}
      AND status = 'published'
    LIMIT 1
  `) as NewsRow[];

  return rows[0] ? rowToActualidadItem(rows[0]) : null;
}
