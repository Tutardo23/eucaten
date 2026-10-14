import type { Metadata } from "next";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import {
  ACTUALIDAD_CATEGORIES,
  ACTUALIDAD_SOURCE_TYPES,
  ACTUALIDAD_STATUSES,
  type ActualidadItem,
  type ActualidadStatus,
} from "@/lib/actualidad/types";
import { ACTUALIDAD_SOURCES } from "@/lib/actualidad/sources";
import { getActualidadAdminAccess } from "@/lib/actualidad/auth";
import { isActualidadDatabaseConfigured } from "@/lib/actualidad/db";
import { listActualidadByStatus } from "@/lib/actualidad/repository";
import { evaluateEditorialPriority, editorialPriorityRank } from "@/lib/actualidad/priority";
import {
  getActualidadReviewState,
  getEffectiveActualidadStartAt,
  isCollectedSinceStart,
  isNewSinceReview,
} from "@/lib/actualidad/review-state";
import { evaluatePublicationReadiness } from "@/lib/actualidad/publication-readiness";
import { listActualidadSourceHealth } from "@/lib/actualidad/source-health";
import { listRecentActualidadAudit, type ActualidadAuditAction } from "@/lib/actualidad/audit";
import {
  collectActualidadNowAction,
  completeActualidadOnboardingAction,
  markActualidadReviewedAction,
  createActualidadAction,
  setActualidadStatusAction,
  updateActualidadAction,
} from "./actions";
import { CollectNowButton } from "./collect-now-button";
import { ActualidadTutorial } from "./tutorial";
import "./admin.css";
import "./admin-inbox.css";
import "./admin-tutorial.css";

export const metadata: Metadata = {
  title: "Administrar Actualidad",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_META: Record<ActualidadStatus, { label: string; empty: string }> = {
  pending: { label: "Pendientes", empty: "No hay publicaciones pendientes." },
  published: { label: "Publicadas", empty: "Todavía no hay publicaciones aprobadas." },
  rejected: { label: "Descartadas", empty: "No hay publicaciones descartadas." },
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  official: "Fuente oficial",
  judicial: "Fuente judicial",
  international_organization: "Organismo internacional",
  specialized_media: "Medio especializado",
  press: "Prensa",
};

const SOURCE_ORDER = [
  "uif",
  "boletin-oficial",
  "bcra",
  "cnv",
  "gafi",
  "gafilat",
  "oficina-anticorrupcion",
  "aaip",
  "igj",
  "ministerio-seguridad",
  "fiscales",
  "camara-fintech",
  "iproup",
  "alea",
  "lotba",
  "iplyc-ba",
  "yogonet",
  "gm-news",
  "sbc-noticias",
] as const;

const AUTOMATIC_SOURCE_COUNT = ACTUALIDAD_SOURCES.filter(
  (source) => source.enabled && source.automation === "automatic",
).length;

const WATCH_ONLY_SOURCES = ACTUALIDAD_SOURCES.filter(
  (source) => source.automation === "watch_only",
);

const WATCH_ONLY_SOURCE_COUNT = WATCH_ONLY_SOURCES.length;

function dateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

function sourceTypeLabel(item: Pick<ActualidadItem, "sourceKey" | "sourceType">) {
  const definition = item.sourceKey
    ? ACTUALIDAD_SOURCES.find((source) => source.key === item.sourceKey)
    : undefined;
  return definition?.displayTypeLabel ?? SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType;
}

function displayDateTime(value?: string) {
  if (!value) return "Todavía no marcaste una revisión al día";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function filterPendingItems(
  items: ActualidadItem[],
  filters: { query?: string; category?: string; source?: string },
) {
  const query = filters.query?.trim();
  const normalizedQuery = query ? normalizeSearch(query) : "";

  return items.filter((item) => {
    if (filters.category && !item.categories.includes(filters.category as (typeof ACTUALIDAD_CATEGORIES)[number])) {
      return false;
    }

    if (filters.source && item.sourceKey !== filters.source) {
      return false;
    }

    if (normalizedQuery) {
      const haystack = normalizeSearch(
        `${item.title} ${item.summary} ${item.sourceName} ${item.categories.join(" ")}`,
      );
      if (!haystack.includes(normalizedQuery)) return false;
    }

    return true;
  });
}

function latestIso(values: (string | undefined)[]) {
  const valid = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (!valid.length) return undefined;
  return new Date(Math.max(...valid)).toISOString();
}

function isHealthStale(value?: string) {
  if (!value) return true;
  return Date.now() - new Date(value).getTime() > 36 * 60 * 60 * 1000;
}

function sourcePriority(item: ActualidadItem) {
  const index = item.sourceKey
    ? SOURCE_ORDER.indexOf(item.sourceKey as (typeof SOURCE_ORDER)[number])
    : -1;
  return index === -1 ? SOURCE_ORDER.length : index;
}

function groupPendingBySource(items: ActualidadItem[], lastReviewedAt?: string) {
  const groups = new Map<
    string,
    {
      key: string;
      name: string;
      sourceType: ActualidadItem["sourceType"];
      sourceKey?: string;
      items: ActualidadItem[];
      priority: number;
      highCount: number;
      newCount: number;
    }
  >();

  for (const item of items) {
    const key = item.sourceKey ?? item.sourceName.toLowerCase();
    const itemPriority = editorialPriorityRank(item);
    const isNew = isNewSinceReview(item.collectedAt, lastReviewedAt);
    const existing = groups.get(key);

    if (existing) {
      existing.items.push(item);
      existing.priority = Math.min(existing.priority, itemPriority);
      if (evaluateEditorialPriority(item).level === "high") existing.highCount += 1;
      if (isNew) existing.newCount += 1;
      continue;
    }

    groups.set(key, {
      key,
      name: item.sourceName,
      sourceType: item.sourceType,
      sourceKey: item.sourceKey,
      items: [item],
      priority: itemPriority,
      highCount: evaluateEditorialPriority(item).level === "high" ? 1 : 0,
      newCount: isNew ? 1 : 0,
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort(
        (a, b) =>
          editorialPriorityRank(a) - editorialPriorityRank(b) ||
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      ),
    }))
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        sourcePriority(a.items[0]) - sourcePriority(b.items[0]) ||
        b.newCount - a.newCount ||
        b.items.length - a.items.length ||
        a.name.localeCompare(b.name, "es"),
    );
}

function StatusAction({
  item,
  status,
  label,
  tone,
  returnStatus,
  returnFocus,
  disabled = false,
  title,
}: {
  item: ActualidadItem;
  status: ActualidadStatus;
  label: string;
  tone?: "primary" | "danger" | "neutral";
  returnStatus: ActualidadStatus;
  returnFocus?: "start" | "new" | "high" | "all" | "history";
  disabled?: boolean;
  title?: string;
}) {
  return (
    <form action={setActualidadStatusAction}>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="returnStatus" value={returnStatus} />
      {returnFocus ? <input type="hidden" name="returnFocus" value={returnFocus} /> : null}
      <button
        className={`admin-button ${tone ? `is-${tone}` : ""}`}
        type="submit"
        disabled={disabled}
        title={title}
      >
        {label}
      </button>
    </form>
  );
}

function CategoryCheckboxes({ selected = [] }: { selected?: readonly string[] }) {
  return (
    <div className="admin-category-grid">
      {ACTUALIDAD_CATEGORIES.map((category) => (
        <label className="admin-checkbox" key={category}>
          <input
            type="checkbox"
            name="categories"
            value={category}
            defaultChecked={selected.includes(category)}
          />
          <span>{category}</span>
        </label>
      ))}
    </div>
  );
}

function PublicationForm({ item }: { item?: ActualidadItem }) {
  return (
    <form action={item ? updateActualidadAction : createActualidadAction} className="admin-form">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      {item ? <input type="hidden" name="currentStatus" value={item.status} /> : null}

      <div className="admin-field admin-field-wide">
        <label htmlFor={`${item?.id ?? "new"}-title`}>Título</label>
        <input
          id={`${item?.id ?? "new"}-title`}
          name="title"
          defaultValue={item?.title ?? ""}
          required
          maxLength={220}
        />
      </div>

      <div className="admin-field admin-field-wide">
        <label htmlFor={`${item?.id ?? "new"}-summary`}>Descripción breve</label>
        <textarea
          id={`${item?.id ?? "new"}-summary`}
          name="summary"
          defaultValue={item?.summary ?? ""}
          rows={5}
          maxLength={1200}
        />
      </div>

      <div className="admin-field">
        <label htmlFor={`${item?.id ?? "new"}-sourceName`}>Fuente</label>
        <input
          id={`${item?.id ?? "new"}-sourceName`}
          name="sourceName"
          defaultValue={item?.sourceName ?? ""}
          required
          maxLength={180}
        />
      </div>

      <div className="admin-field">
        <label htmlFor={`${item?.id ?? "new"}-publishedAt`}>Fecha</label>
        <input
          id={`${item?.id ?? "new"}-publishedAt`}
          name="publishedAt"
          type="date"
          defaultValue={item ? dateInputValue(item.publishedAt) : dateInputValue(new Date().toISOString())}
          required
        />
      </div>

      <div className="admin-field admin-field-wide">
        <label htmlFor={`${item?.id ?? "new"}-sourceUrl`}>Enlace original</label>
        <input
          id={`${item?.id ?? "new"}-sourceUrl`}
          name="sourceUrl"
          type="url"
          defaultValue={item?.sourceUrl ?? ""}
          placeholder="https://..."
          required
        />
      </div>

      <div className="admin-field">
        <label htmlFor={`${item?.id ?? "new"}-sourceType`}>Tipo de fuente</label>
        <select
          id={`${item?.id ?? "new"}-sourceType`}
          name="sourceType"
          defaultValue={item?.sourceType ?? "official"}
        >
          {ACTUALIDAD_SOURCE_TYPES.map((type) => (
            <option value={type} key={type}>
              {SOURCE_TYPE_LABELS[type] ?? type}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-field">
        <label htmlFor={`${item?.id ?? "new"}-sourceKey`}>Fuente configurada</label>
        <select
          id={`${item?.id ?? "new"}-sourceKey`}
          name="sourceKey"
          defaultValue={item?.sourceKey ?? ""}
        >
          <option value="">Otra / manual</option>
          {ACTUALIDAD_SOURCES.map((source) => (
            <option value={source.key} key={source.key}>
              {source.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="admin-field admin-field-wide admin-fieldset">
        <legend>Categorías</legend>
        <CategoryCheckboxes selected={item?.categories} />
      </fieldset>

      <div className="admin-form-actions admin-field-wide">
        <button className="admin-button is-primary" type="submit">
          {item ? "Guardar cambios" : "Crear como pendiente"}
        </button>
      </div>
    </form>
  );
}

function ItemCard({
  item,
  activeStatus,
  compact = false,
  lastReviewedAt,
  activeFocus,
}: {
  item: ActualidadItem;
  activeStatus: ActualidadStatus;
  compact?: boolean;
  lastReviewedAt?: string;
  activeFocus?: "start" | "new" | "high" | "all" | "history";
}) {
  const priority = evaluateEditorialPriority(item);
  const readiness = evaluatePublicationReadiness(item);
  const isNew = isNewSinceReview(item.collectedAt, lastReviewedAt);

  return (
    <article
      className={`admin-news-card ${compact ? "is-compact" : ""} is-priority-${priority.level}`}
    >
      <div className="admin-editorial-flags" aria-label="Señales editoriales">
        {isNew && item.status === "pending" ? <span className="admin-flag is-new">Nueva</span> : null}
        <span className={`admin-flag is-priority-${priority.level}`}>{priority.label}</span>
        {item.jurisprudence?.judgmentVerified ? (
          <span className="admin-flag is-verified">Fallo verificado</span>
        ) : item.jurisprudence ? (
          <span className="admin-flag is-unverified">Fallo no verificado</span>
        ) : null}
      </div>

      <div className="admin-news-head">
        <div>
          <div className="admin-news-meta">
            <span>{displayDate(item.publishedAt)}</span>
            {!compact ? <span>{item.sourceName}</span> : null}
            <span>{sourceTypeLabel(item)}</span>
          </div>
          <h2>{item.title}</h2>
        </div>
        {!compact ? (
          <span className={`admin-status is-${item.status}`}>{STATUS_META[item.status].label}</span>
        ) : null}
      </div>

      {priority.level !== "normal" ? (
        <p className="admin-priority-reason">{priority.reasons.join(" · ")}</p>
      ) : null}

      {item.jurisprudence && !item.jurisprudence.judgmentVerified ? (
        <div className="admin-jurisprudence-warning">
          <strong>Alerta jurisprudencial.</strong> La fuente informa una decisión judicial, pero el fallo
          original todavía no fue verificado. No se presenta como sentencia verificada.
        </div>
      ) : null}

      {!readiness.ready && item.status === "pending" ? (
        <div className="admin-publication-blocker">
          <strong>Antes de publicar:</strong> {readiness.blockers.join(" ")}
        </div>
      ) : null}

      <div className="admin-news-tags">
        {item.categories.map((category) => (
          <span key={category}>{category}</span>
        ))}
      </div>

      {!compact && item.summary ? <p className="admin-news-summary">{item.summary}</p> : null}

      <div className="admin-news-actions">
        <a className="admin-source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
          Ver fuente original ↗
        </a>

        <div className="admin-action-group">
          {item.status !== "published" ? (
            <StatusAction
              item={item}
              status="published"
              label="Aprobar"
              tone="primary"
              returnStatus={activeStatus}
              returnFocus={activeFocus}
              disabled={!readiness.ready}
              title={!readiness.ready ? readiness.blockers.join(" ") : undefined}
            />
          ) : null}

          {item.status !== "pending" ? (
            <StatusAction
              item={item}
              status="pending"
              label="Volver a pendientes"
              tone="neutral"
              returnStatus={activeStatus}
              returnFocus={activeFocus}
            />
          ) : null}

          {item.status !== "rejected" ? (
            <StatusAction
              item={item}
              status="rejected"
              label="Descartar"
              tone="danger"
              returnStatus={activeStatus}
              returnFocus={activeFocus}
            />
          ) : null}
        </div>
      </div>

      <details className={compact ? "admin-review-detail" : "admin-edit-panel"}>
        <summary>{compact ? "Ver detalle / editar" : "Editar publicación"}</summary>
        {compact && item.summary ? <p className="admin-review-summary">{item.summary}</p> : null}
        <PublicationForm item={item} />
      </details>
    </article>
  );
}

function PendingInbox({
  items,
  lastReviewedAt,
  activeFocus,
}: {
  items: ActualidadItem[];
  lastReviewedAt?: string;
  activeFocus: "start" | "new" | "high" | "all" | "history";
}) {
  const groups = groupPendingBySource(items, lastReviewedAt);

  if (!groups.length) {
    return <div className="admin-empty">No hay publicaciones en esta vista.</div>;
  }

  return (
    <div className="admin-inbox">
      <div className="admin-inbox-intro">
        <div>
          <strong>{groups.length}</strong>
          <span>{groups.length === 1 ? "fuente para revisar" : "fuentes para revisar"}</span>
        </div>
        <p>
          Lo que conviene revisar primero aparece arriba. No hace falta resolver toda la bandeja de una vez:
          el sistema conserva todo y separa lo nuevo de lo ya visto.
        </p>
      </div>

      <div className="admin-source-groups">
        {groups.map((group, index) => (
          <details className="admin-source-group" key={group.key} open={index === 0}>
            <summary>
              <div>
                <span className="admin-source-kicker">
                  {sourceTypeLabel({ sourceKey: group.sourceKey, sourceType: group.sourceType })}
                </span>
                <strong>{group.name}</strong>
              </div>
              <div className="admin-source-summary-meta">
                {group.highCount ? <span className="admin-source-high">{group.highCount} primero</span> : null}
                {group.newCount ? <span className="admin-source-new">{group.newCount} nuevas</span> : null}
                <span className="admin-source-count">
                  {group.items.length} {group.items.length === 1 ? "pendiente" : "pendientes"}
                </span>
              </div>
            </summary>

            <div className="admin-source-items">
              {group.items.map((item) => (
                <ItemCard
                  item={item}
                  activeStatus="pending"
                  compact
                  lastReviewedAt={lastReviewedAt}
                  activeFocus={activeFocus}
                  key={item.id}
                />
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}


const AUDIT_ACTION_LABELS: Record<ActualidadAuditAction, string> = {
  onboarding_completed: "Completó la guía",
  radar_run: "Ejecutó el radar",
  review_marked: "Marcó revisión al día",
  item_created: "Creó una publicación",
  item_updated: "Editó una publicación",
  item_published: "Publicó una novedad",
  item_rejected: "Descartó una novedad",
  item_pending: "Devolvió a pendientes",
};

type PageProps = {
  searchParams: Promise<{
    estado?: string;
    foco?: string;
    categoria?: string;
    fuente?: string;
    q?: string;
    tipo?: string;
    mensaje?: string;
  }>;
};

export default async function ActualidadAdminPage({ searchParams }: PageProps) {
  const access = await getActualidadAdminAccess();

  if (access.status === "not_configured") {
    return (
      <main className="admin-page admin-state-page">
        <div className="admin-state-card">
          <p className="admin-eyebrow">EUCATEN / ACTUALIDAD</p>
          <h1>Falta configurar Clerk.</h1>
          <p>
            El panel está bloqueado hasta que existan las claves de Clerk y al menos un usuario autorizado.
          </p>
          <Link href="/">Volver al sitio</Link>
        </div>
      </main>
    );
  }

  if (access.status === "signed_out") {
    redirect("/sign-in");
  }

  if (access.status === "denied") {
    return (
      <main className="admin-page admin-state-page">
        <div className="admin-state-card">
          <p className="admin-eyebrow">EUCATEN / ACTUALIDAD</p>
          <h1>Acceso no habilitado.</h1>
          <p>
            La cuenta inició sesión correctamente, pero no está autorizada para administrar Actualidad.
            <span className="admin-access-user-id">
              ID de Clerk: <strong>{access.userId}</strong>
            </span>
          </p>
          <Link href="/">Volver al sitio</Link>
        </div>
      </main>
    );
  }

  if (!isActualidadDatabaseConfigured()) {
    return (
      <main className="admin-page admin-state-page">
        <div className="admin-state-card">
          <p className="admin-eyebrow">EUCATEN / ACTUALIDAD</p>
          <h1>Falta conectar Neon.</h1>
          <p>El acceso está protegido, pero DATABASE_URL todavía no está configurada.</p>
          <Link href="/">Volver al sitio</Link>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const activeStatus: ActualidadStatus = (ACTUALIDAD_STATUSES as readonly string[]).includes(
    params.estado ?? "",
  )
    ? (params.estado as ActualidadStatus)
    : "pending";

  const [pending, published, rejected, reviewState, sourceHealth, auditEntries] = await Promise.all([
    listActualidadByStatus("pending", 200),
    listActualidadByStatus("published", 200),
    listActualidadByStatus("rejected", 200),
    getActualidadReviewState(access.userId),
    listActualidadSourceHealth(),
    listRecentActualidadAudit(12),
  ]);

  const effectiveStartedAt = getEffectiveActualidadStartAt(reviewState);
  const onboardingCompleted = Boolean(reviewState.onboardingCompletedAt);

  // La bandeja diaria de cada persona comienza cuando activa su cuenta.
  // Antes del onboarding mostramos 0 para evitar que el backlog histórico
  // aparezca detrás del tutorial.
  const operationalPending =
    onboardingCompleted && effectiveStartedAt
      ? pending.filter((item) =>
          isCollectedSinceStart(item.collectedAt, effectiveStartedAt),
        )
      : [];

  const historicalPending =
    onboardingCompleted && effectiveStartedAt
      ? pending.filter(
          (item) => !isCollectedSinceStart(item.collectedAt, effectiveStartedAt),
        )
      : pending;

  const newPending = operationalPending.filter((item) =>
    isNewSinceReview(item.collectedAt, reviewState.lastReviewedAt),
  );
  const firstPriorityPending = operationalPending.filter(
    (item) => evaluateEditorialPriority(item).level === "high",
  );
  const unverifiedJurisprudence = operationalPending.filter(
    (item) => item.jurisprudence && !item.jurisprudence.judgmentVerified,
  );

  const startBase = newPending.length ? newPending : operationalPending;
  const startItems = [...startBase]
    .sort(
      (a, b) =>
        editorialPriorityRank(a) - editorialPriorityRank(b) ||
        new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime(),
    )
    .slice(0, 5);

  const requestedFocus = params.foco;
  const activeFocus: "start" | "new" | "high" | "all" | "history" =
    requestedFocus === "start" ||
    requestedFocus === "new" ||
    requestedFocus === "high" ||
    requestedFocus === "all" ||
    requestedFocus === "history"
      ? requestedFocus
      : "start";

  const activeCategory =
    params.categoria &&
    (ACTUALIDAD_CATEGORIES as readonly string[]).includes(params.categoria)
      ? params.categoria
      : undefined;
  const activeSource =
    params.fuente &&
    ACTUALIDAD_SOURCES.some((source) => source.key === params.fuente)
      ? params.fuente
      : undefined;
  const activeQuery = params.q?.trim() || undefined;

  const focusBase =
    activeFocus === "start"
      ? startItems
      : activeFocus === "new"
        ? newPending
        : activeFocus === "high"
          ? firstPriorityPending
          : activeFocus === "history"
            ? historicalPending
            : operationalPending;

  const focusedPending = filterPendingItems(focusBase, {
    query: activeQuery,
    category: activeCategory,
    source: activeSource,
  });

  const automaticSources = ACTUALIDAD_SOURCES.filter(
    (source) => source.enabled && source.automation === "automatic",
  );
  const healthBySource = new Map(sourceHealth.map((health) => [health.sourceKey, health]));
  const healthRows = automaticSources.map((source) => {
    const health = healthBySource.get(source.key);
    const stale = isHealthStale(health?.lastCheckedAt);
    return { source, health, stale };
  });
  const healthIssueCount = healthRows.filter(
    ({ health, stale }) => !health || stale || health.status !== "ok",
  ).length;
  const healthOkCount = healthRows.length - healthIssueCount;
  const latestHealthCheck = latestIso(healthRows.map(({ health }) => health?.lastCheckedAt));

  const groups: Record<ActualidadStatus, ActualidadItem[]> = {
    pending: operationalPending,
    published,
    rejected,
  };

  const items = activeStatus === "pending" ? focusedPending : groups[activeStatus];

  return (
    <main className="admin-page">
      <ActualidadTutorial
        openInitially={!reviewState.onboardingCompletedAt}
        historicalCount={pending.length}
        completeAction={completeActualidadOnboardingAction}
      />

      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">EUCATEN / ACTUALIDAD</p>
          <h1>Revisión editorial</h1>
          <p className="admin-header-copy">
            Revisá una fuente por vez. El sistema busca y prepara las novedades; vos solo decidís qué se publica.
          </p>
        </div>
        <div className="admin-user-area">
          <span>{access.identifier}</span>
          <UserButton />
        </div>
      </header>

      {params.mensaje ? (
        <div className={`admin-notice ${params.tipo === "error" ? "is-error" : "is-ok"}`}>
          {params.mensaje}
        </div>
      ) : null}

      <section className="admin-summary" aria-label="Resumen de publicaciones">
        <Link className={activeStatus === "pending" ? "is-active" : ""} href="/admin/actualidad?estado=pending">
          <span>Pendientes desde mi inicio</span>
          <strong>{operationalPending.length}</strong>
        </Link>
        <Link className={activeStatus === "published" ? "is-active" : ""} href="/admin/actualidad?estado=published">
          <span>Publicadas</span>
          <strong>{published.length}</strong>
        </Link>
        <Link className={activeStatus === "rejected" ? "is-active" : ""} href="/admin/actualidad?estado=rejected">
          <span>Descartadas</span>
          <strong>{rejected.length}</strong>
        </Link>
      </section>

      {activeStatus === "pending" ? (
        <>
          <section className="admin-daily-brief" aria-label="Resumen para revisar">
            <div className="admin-daily-brief-copy">
              <span>Resumen de revisión</span>
              <h2>
                {newPending.length
                  ? `${newPending.length} ${newPending.length === 1 ? "novedad nueva" : "novedades nuevas"}`
                  : "Tu bandeja está al día"}
              </h2>
              <p>
                {startItems.length
                  ? `Si hoy tenés poco tiempo, empezá por estas ${startItems.length}. Están ordenadas por impacto regulatorio y novedad, pero la decisión de publicar siempre es tuya.`
                  : "No hay nada nuevo que necesites mirar ahora. Podés volver cuando entre contenido nuevo."}
              </p>
              {startItems.length ? (
                <Link className="admin-brief-link" href="/admin/actualidad?estado=pending&foco=start">
                  Ver {startItems.length} para empezar →
                </Link>
              ) : null}
            </div>

            <div className="admin-daily-metrics">
              <div>
                <strong>{firstPriorityPending.length}</strong>
                <span>revisar primero</span>
              </div>
              <div>
                <strong>{unverifiedJurisprudence.length}</strong>
                <span>casos por verificar</span>
              </div>
              <div>
                <strong>{healthIssueCount}</strong>
                <span>fuentes con observaciones</span>
              </div>
            </div>
          </section>

          <details className="admin-priority-help">
            <summary>¿Qué significa “Revisar primero”?</summary>
            <p>
              No significa “publicar” ni “urgente”. Solo indica que esa novedad reúne señales objetivas
              que conviene mirar antes: fuente regulatoria primaria, cambio normativo, sanción, fraude
              o impacto directo en compliance. Cata conserva siempre la decisión editorial.
            </p>
          </details>

          <section className="admin-review-control" aria-label="Control de revisión editorial">
            <div>
              <span>Tu punto de revisión</span>
              <strong>{displayDateTime(reviewState.lastReviewedAt)}</strong>
              <p>
                {effectiveStartedAt
                  ? `Tu etapa editorial comenzó ${displayDateTime(effectiveStartedAt)}. `
                  : "Tu etapa editorial comienza cuando terminás la guía. "}
                Marcar la revisión al día solo separa lo ya visto de lo nuevo. No aprueba, publica ni descarta nada.
              </p>
            </div>
            <form action={markActualidadReviewedAction}>
              <button className="admin-button is-neutral" type="submit">
                Marcar revisión al día
              </button>
            </form>
          </section>

          <nav className="admin-focus-tabs" aria-label="Orden de revisión">
            <Link
              className={activeFocus === "start" ? "is-active" : ""}
              href="/admin/actualidad?estado=pending&foco=start"
            >
              <span>Para empezar</span>
              <strong>{startItems.length}</strong>
            </Link>
            <Link
              className={activeFocus === "new" ? "is-active" : ""}
              href="/admin/actualidad?estado=pending&foco=new"
            >
              <span>Nuevas desde mi revisión</span>
              <strong>{newPending.length}</strong>
            </Link>
            <Link
              className={activeFocus === "high" ? "is-active" : ""}
              href="/admin/actualidad?estado=pending&foco=high"
            >
              <span>Revisar primero</span>
              <strong>{firstPriorityPending.length}</strong>
            </Link>
            <Link
              className={activeFocus === "all" ? "is-active" : ""}
              href="/admin/actualidad?estado=pending&foco=all"
            >
              <span>Todas desde mi inicio</span>
              <strong>{operationalPending.length}</strong>
            </Link>
          </nav>

          {onboardingCompleted && historicalPending.length ? (
            <section className={`admin-history-panel ${activeFocus === "history" ? "is-active" : ""}`}>
              <div>
                <span>Fuera de tu bandeja diaria</span>
                <strong>Histórico previo a tu inicio</strong>
                <p>
                  Son publicaciones recopiladas antes de que comenzaras a usar Actualidad.
                  No cuentan como nuevas ni pendientes de tu trabajo diario, pero siguen disponibles por trazabilidad.
                </p>
              </div>
              <div className="admin-history-action">
                <strong>{historicalPending.length}</strong>
                {activeFocus === "history" ? (
                  <Link href="/admin/actualidad?estado=pending&foco=start">
                    Volver a mi bandeja
                  </Link>
                ) : (
                  <Link href="/admin/actualidad?estado=pending&foco=history">
                    Consultar histórico
                  </Link>
                )}
              </div>
            </section>
          ) : null}

          <form className="admin-filter-bar" action="/admin/actualidad" method="get">
            <input type="hidden" name="estado" value="pending" />
            <input type="hidden" name="foco" value={activeFocus} />

            <label>
              <span>Buscar</span>
              <input
                type="search"
                name="q"
                defaultValue={activeQuery ?? ""}
                placeholder="Título, tema o fuente"
              />
            </label>

            <label>
              <span>Categoría</span>
              <select name="categoria" defaultValue={activeCategory ?? ""}>
                <option value="">Todas</option>
                {ACTUALIDAD_CATEGORIES.map((category) => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Fuente</span>
              <select name="fuente" defaultValue={activeSource ?? ""}>
                <option value="">Todas</option>
                {ACTUALIDAD_SOURCES.filter((source) => source.automation === "automatic").map((source) => (
                  <option value={source.key} key={source.key}>{source.name}</option>
                ))}
              </select>
            </label>

            <div className="admin-filter-actions">
              <button className="admin-button is-neutral" type="submit">Filtrar</button>
              {(activeQuery || activeCategory || activeSource) ? (
                <Link href={`/admin/actualidad?estado=pending&foco=${activeFocus}`}>Limpiar</Link>
              ) : null}
            </div>
          </form>
        </>
      ) : null}

      <section className="admin-collector-bar" aria-label="Recopilación automática">
        <div>
          <span>Radar automático</span>
          <p>
            {AUTOMATIC_SOURCE_COUNT} fuentes se revisan automáticamente · {WATCH_ONLY_SOURCE_COUNT} fuentes jurídicas o restringidas quedan en seguimiento controlado. La prioridad solo ordena la revisión; nunca publica por sí sola.
          </p>
        </div>
        <form action={collectActualidadNowAction}>
          <CollectNowButton />
        </form>
      </section>

      <details className={`admin-health-panel ${healthIssueCount ? "has-issues" : "is-healthy"}`}>
        <summary>
          <div>
            <span>Estado del radar</span>
            <strong>
              {sourceHealth.length
                ? `${healthOkCount} bien · ${healthIssueCount} con observaciones`
                : "Se completa en la próxima búsqueda"}
            </strong>
          </div>
          <small>
            {latestHealthCheck ? `Última revisión ${displayDateTime(latestHealthCheck)}` : "Sin historial todavía"}
          </small>
        </summary>

        <div className="admin-health-grid">
          {healthRows.map(({ source, health, stale }) => {
            const status = !health ? "unknown" : stale ? "stale" : health.status;
            const label =
              status === "ok"
                ? "Correcta"
                : status === "warning"
                  ? "Con observaciones"
                  : status === "error"
                    ? "Falló"
                    : status === "stale"
                      ? "Sin revisión reciente"
                      : "Sin historial";

            return (
              <article className={`admin-health-row is-${status}`} key={source.key}>
                <div>
                  <strong>{source.name}</strong>
                  <span>{label}</span>
                </div>
                <p>
                  {health
                    ? `${health.created} nuevas · ${health.existing} ya conocidas · ${health.skipped} omitidas`
                    : "Se registrará cuando vuelva a correr el radar."}
                </p>
                {health?.errorSummary ? <small>{health.errorSummary}</small> : null}
              </article>
            );
          })}
        </div>
      </details>

      <details className="admin-watch-panel">
        <summary>
          <span>Fuentes en seguimiento controlado</span>
          <strong>{WATCH_ONLY_SOURCE_COUNT}</strong>
        </summary>
        <div className="admin-watch-grid">
          {WATCH_ONLY_SOURCES.map((source) => (
            <article key={source.key}>
              <strong>{source.name}</strong>
              <p>{source.note ?? "Se habilitará cuando exista una vía estable y verificable."}</p>
            </article>
          ))}
        </div>
      </details>

      <details className="admin-audit-panel">
        <summary>
          <span>Actividad editorial compartida</span>
          <strong>{auditEntries.length}</strong>
        </summary>

        <div className="admin-audit-list">
          {auditEntries.length ? (
            auditEntries.map((entry) => (
              <article key={entry.id}>
                <div>
                  <strong>{AUDIT_ACTION_LABELS[entry.action]}</strong>
                  <span>{entry.actorLabel}</span>
                </div>
                {entry.detail ? <p>{entry.detail}</p> : null}
                <small>{displayDateTime(entry.createdAt)}</small>
              </article>
            ))
          ) : (
            <p className="admin-audit-empty">
              El historial empezará a registrarse con las próximas acciones editoriales.
            </p>
          )}
        </div>
      </details>

      <section className="admin-list-section">
        <div className="admin-list-head">
          <div>
            <p className="admin-eyebrow">{STATUS_META[activeStatus].label}</p>
            <h2>{items.length} {items.length === 1 ? "publicación" : "publicaciones"}</h2>
            {activeStatus === "pending" ? (
              <p className="admin-list-context">
                {activeFocus === "start"
                  ? "Una selección corta para empezar sin tener que resolver toda la bandeja."
                  : activeFocus === "new"
                    ? "Solo lo incorporado desde tu último punto de revisión."
                    : activeFocus === "high"
                      ? "Novedades con señales objetivas que conviene revisar antes."
                      : activeFocus === "history"
                        ? "Contenido recopilado antes de que comenzara tu etapa editorial. Está separado de tu bandeja diaria."
                        : "Todas las pendientes incorporadas desde que comenzaste a usar Actualidad."}
              </p>
            ) : null}
          </div>
          <Link className="admin-public-link" href="/actualidad" target="_blank">
            Ver Actualidad pública ↗
          </Link>
        </div>

        {activeStatus === "pending" ? (
          <PendingInbox items={focusedPending} lastReviewedAt={reviewState.lastReviewedAt} activeFocus={activeFocus} />
        ) : items.length ? (
          <div className="admin-news-list">
            {items.map((item) => (
              <ItemCard item={item} activeStatus={activeStatus} key={item.id} />
            ))}
          </div>
        ) : (
          <div className="admin-empty">{STATUS_META[activeStatus].empty}</div>
        )}
      </section>
    </main>
  );
}
