import { getActualidadSql, isActualidadDatabaseConfigured } from "./db";

export type ActualidadReviewState = {
  reviewerKey: string;
  startedAt?: string;
  lastReviewedAt?: string;
  onboardingCompletedAt?: string;
};

let ensurePromise: Promise<void> | null = null;

async function ensureReviewStateTable() {
  if (!isActualidadDatabaseConfigured()) return;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    const sql = getActualidadSql();

    await sql`
      CREATE TABLE IF NOT EXISTS actualidad_review_state (
        reviewer_key TEXT PRIMARY KEY,
        started_at TIMESTAMPTZ,
        last_reviewed_at TIMESTAMPTZ,
        onboarding_completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Compatibilidad con quienes ya tenían la tabla creada en etapas anteriores.
    await sql`
      ALTER TABLE actualidad_review_state
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ
    `;

    await sql`
      ALTER TABLE actualidad_review_state
      ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ
    `;
  })().catch((error) => {
    ensurePromise = null;
    throw error;
  });

  return ensurePromise;
}

function iso(value: string | Date | null | undefined) {
  return value ? new Date(value).toISOString() : undefined;
}

export async function getActualidadReviewState(
  reviewerKey: string,
): Promise<ActualidadReviewState> {
  if (!isActualidadDatabaseConfigured()) {
    return { reviewerKey };
  }

  await ensureReviewStateTable();
  const sql = getActualidadSql();

  const rows = (await sql`
    SELECT
      reviewer_key,
      started_at,
      last_reviewed_at,
      onboarding_completed_at
    FROM actualidad_review_state
    WHERE reviewer_key = ${reviewerKey}
    LIMIT 1
  `) as {
    reviewer_key: string;
    started_at: string | Date | null;
    last_reviewed_at: string | Date | null;
    onboarding_completed_at: string | Date | null;
  }[];

  const row = rows[0];

  return {
    reviewerKey,
    startedAt: iso(row?.started_at),
    lastReviewedAt: iso(row?.last_reviewed_at),
    onboardingCompletedAt: iso(row?.onboarding_completed_at),
  };
}

export async function markActualidadReviewedNow(reviewerKey: string) {
  await ensureReviewStateTable();
  const sql = getActualidadSql();

  const rows = (await sql`
    INSERT INTO actualidad_review_state (
      reviewer_key,
      started_at,
      last_reviewed_at,
      updated_at
    )
    VALUES (${reviewerKey}, NOW(), NOW(), NOW())
    ON CONFLICT (reviewer_key)
    DO UPDATE SET
      started_at = COALESCE(actualidad_review_state.started_at, NOW()),
      last_reviewed_at = NOW(),
      updated_at = NOW()
    RETURNING last_reviewed_at
  `) as { last_reviewed_at: string | Date }[];

  return new Date(rows[0].last_reviewed_at).toISOString();
}

export async function completeActualidadOnboarding(reviewerKey: string) {
  await ensureReviewStateTable();
  const sql = getActualidadSql();

  // Una cuenta nueva empieza con bandeja limpia en este instante.
  //
  // Si la persona ya venía trabajando desde una etapa anterior, conservamos
  // su referencia previa para no "reiniciarla" accidentalmente al volver a
  // abrir el tutorial.
  await sql`
    INSERT INTO actualidad_review_state (
      reviewer_key,
      started_at,
      last_reviewed_at,
      onboarding_completed_at,
      updated_at
    )
    VALUES (${reviewerKey}, NOW(), NOW(), NOW(), NOW())
    ON CONFLICT (reviewer_key)
    DO UPDATE SET
      started_at = COALESCE(
        actualidad_review_state.started_at,
        actualidad_review_state.onboarding_completed_at,
        actualidad_review_state.last_reviewed_at,
        NOW()
      ),
      last_reviewed_at = COALESCE(
        actualidad_review_state.last_reviewed_at,
        actualidad_review_state.onboarding_completed_at,
        NOW()
      ),
      onboarding_completed_at = COALESCE(
        actualidad_review_state.onboarding_completed_at,
        NOW()
      ),
      updated_at = NOW()
  `;
}

export function getEffectiveActualidadStartAt(
  state: ActualidadReviewState,
) {
  return (
    state.startedAt ??
    state.onboardingCompletedAt ??
    state.lastReviewedAt
  );
}

export function isCollectedSinceStart(
  collectedAt: string,
  startedAt?: string,
) {
  if (!startedAt) return false;
  return new Date(collectedAt).getTime() >= new Date(startedAt).getTime();
}

export function isNewSinceReview(collectedAt: string, lastReviewedAt?: string) {
  if (!lastReviewedAt) return true;
  return new Date(collectedAt).getTime() > new Date(lastReviewedAt).getTime();
}
