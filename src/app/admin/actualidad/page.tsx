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
import {
  createActualidadAction,
  setActualidadStatusAction,
  updateActualidadAction,
} from "./actions";
import "./admin.css";

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

function StatusAction({
  item,
  status,
  label,
  tone,
  returnStatus,
}: {
  item: ActualidadItem;
  status: ActualidadStatus;
  label: string;
  tone?: "primary" | "danger" | "neutral";
  returnStatus: ActualidadStatus;
}) {
  return (
    <form action={setActualidadStatusAction}>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="returnStatus" value={returnStatus} />
      <button className={`admin-button ${tone ? `is-${tone}` : ""}`} type="submit">
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

function ItemCard({ item, activeStatus }: { item: ActualidadItem; activeStatus: ActualidadStatus }) {
  return (
    <article className="admin-news-card">
      <div className="admin-news-head">
        <div>
          <div className="admin-news-meta">
            <span>{displayDate(item.publishedAt)}</span>
            <span>{item.sourceName}</span>
            <span>{SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType}</span>
          </div>
          <h2>{item.title}</h2>
        </div>
        <span className={`admin-status is-${item.status}`}>{STATUS_META[item.status].label}</span>
      </div>

      {item.summary ? <p className="admin-news-summary">{item.summary}</p> : null}

      <div className="admin-news-tags">
        {item.categories.map((category) => (
          <span key={category}>{category}</span>
        ))}
      </div>

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
            />
          ) : null}

          {item.status !== "pending" ? (
            <StatusAction
              item={item}
              status="pending"
              label="Volver a pendientes"
              tone="neutral"
              returnStatus={activeStatus}
            />
          ) : null}

          {item.status !== "rejected" ? (
            <StatusAction
              item={item}
              status="rejected"
              label="Descartar"
              tone="danger"
              returnStatus={activeStatus}
            />
          ) : null}
        </div>
      </div>

      <details className="admin-edit-panel">
        <summary>Editar publicación</summary>
        <PublicationForm item={item} />
      </details>
    </article>
  );
}

type PageProps = {
  searchParams: Promise<{
    estado?: string;
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
            El panel está bloqueado hasta que existan las claves de Clerk y al menos un usuario o correo autorizado.
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

  const [pending, published, rejected] = await Promise.all([
    listActualidadByStatus("pending", 200),
    listActualidadByStatus("published", 200),
    listActualidadByStatus("rejected", 200),
  ]);

  const groups: Record<ActualidadStatus, ActualidadItem[]> = {
    pending,
    published,
    rejected,
  };

  const items = groups[activeStatus];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">EUCATEN / ACTUALIDAD</p>
          <h1>Revisión editorial</h1>
          <p className="admin-header-copy">
            Revisá, corregí y decidí qué contenido aparece públicamente en el sitio.
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
          <span>Pendientes</span>
          <strong>{pending.length}</strong>
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

      <details className="admin-create-panel">
        <summary>Nueva publicación manual</summary>
        <p>
          Útil para cargar una novedad puntual o probar el circuito. Siempre se crea como pendiente.
        </p>
        <PublicationForm />
      </details>

      <section className="admin-list-section">
        <div className="admin-list-head">
          <div>
            <p className="admin-eyebrow">{STATUS_META[activeStatus].label}</p>
            <h2>{items.length} {items.length === 1 ? "publicación" : "publicaciones"}</h2>
          </div>
          <Link className="admin-public-link" href="/actualidad" target="_blank">
            Ver Actualidad pública ↗
          </Link>
        </div>

        {items.length ? (
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
