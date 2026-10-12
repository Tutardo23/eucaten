import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedActualidadBySlug } from "@/lib/actualidad/repository";
import {
  ACTUALIDAD_SOURCE_TYPE_LABELS,
  formatActualidadDate,
} from "@/lib/actualidad/presentation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function descriptionFor(title: string, summary: string) {
  const value = summary.trim() || title.trim();
  return value.length > 160 ? `${value.slice(0, 157).trim()}...` : value;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedActualidadBySlug(slug);

  if (!item) {
    return {
      title: "Publicación no disponible",
      robots: { index: false, follow: false },
    };
  }

  const description = descriptionFor(item.title, item.summary);

  return {
    title: item.title,
    description,
    alternates: { canonical: `/actualidad/${item.slug}` },
    openGraph: {
      title: `${item.title} | EUCATEN`,
      description,
      url: `/actualidad/${item.slug}`,
      type: "article",
      publishedTime: item.publishedAt,
    },
  };
}

export default async function ActualidadDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await getPublishedActualidadBySlug(slug);

  if (!item) notFound();

  const jurisprudence = item.jurisprudence;
  const verified = jurisprudence?.judgmentVerified === true;

  return (
    <main className="updates-page updates-detail-page">
      <header className="updates-page-header">
        <div className="shell updates-page-nav">
          <a className="brand" href="/" aria-label="EUCATEN, volver al inicio">
            <Image
              className="brand-symbol"
              src="/brand/eucaten-isotipo.png"
              alt=""
              width={489}
              height={475}
              priority
            />
            <Image
              className="brand-wordmark"
              src="/brand/eucaten-wordmark-cream.png"
              alt="EUCATEN"
              width={567}
              height={80}
              priority
            />
          </a>
          <Link className="updates-back" href="/actualidad">Volver a Actualidad</Link>
        </div>
      </header>

      <article className="updates-detail">
        <div className="shell updates-detail-shell">
          <nav className="updates-breadcrumb" aria-label="Navegación contextual">
            <Link href="/">EUCATEN</Link>
            <span>/</span>
            <Link href="/actualidad">Actualidad</Link>
          </nav>

          <div className="updates-detail-grid">
            <div className="updates-detail-main">
              <div className="updates-card-topline">
                <span className="updates-source-kind">
                  {ACTUALIDAD_SOURCE_TYPE_LABELS[item.sourceType]}
                </span>
                {verified ? (
                  <span className="updates-verification is-verified">Sentencia verificada</span>
                ) : jurisprudence ? (
                  <span className="updates-verification">Sentencia no verificada</span>
                ) : null}
              </div>

              <p className="updates-detail-meta">
                <span>{formatActualidadDate(item.publishedAt)}</span>
                <span aria-hidden="true">·</span>
                <span>{item.sourceName}</span>
              </p>

              <h1>{item.title}</h1>

              {item.summary ? <p className="updates-detail-summary">{item.summary}</p> : null}

              <div className="updates-public-tags" aria-label="Categorías">
                {item.categories.map((category) => (
                  <span className="updates-public-tag" key={category}>{category}</span>
                ))}
              </div>

              {jurisprudence ? (
                <section className="updates-judgment" aria-labelledby="jurisprudencia-title">
                  <div>
                    <span className="updates-empty-index">Jurisprudencia</span>
                    <h2 id="jurisprudencia-title">Datos del fallo</h2>
                  </div>

                  <dl>
                    {jurisprudence.court ? (
                      <div><dt>Tribunal</dt><dd>{jurisprudence.court}</dd></div>
                    ) : null}
                    {jurisprudence.caseName ? (
                      <div><dt>Carátula</dt><dd>{jurisprudence.caseName}</dd></div>
                    ) : null}
                    {jurisprudence.judgmentDate ? (
                      <div><dt>Fecha de sentencia</dt><dd>{formatActualidadDate(jurisprudence.judgmentDate)}</dd></div>
                    ) : null}
                    <div>
                      <dt>Verificación</dt>
                      <dd>{verified ? "Sentencia original verificada" : "Sentencia original no verificada"}</dd>
                    </div>
                  </dl>

                  {!verified ? (
                    <p className="updates-judgment-note">
                      Esta publicación no presenta la sentencia como verificada mientras no exista un enlace judicial confirmado.
                    </p>
                  ) : null}
                </section>
              ) : null}
            </div>

            <aside className="updates-detail-aside" aria-label="Fuente de la publicación">
              <span className="updates-empty-index">Fuente</span>
              <strong>{item.sourceName}</strong>
              <p>
                EUCATEN presenta una síntesis editorial y remite siempre al contenido original.
              </p>
              <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                Ver publicación original ↗
              </a>
              {verified && jurisprudence?.judgmentUrl && jurisprudence.judgmentUrl !== item.sourceUrl ? (
                <a href={jurisprudence.judgmentUrl} target="_blank" rel="noreferrer">
                  Ver sentencia original ↗
                </a>
              ) : null}
            </aside>
          </div>

          <div className="updates-detail-footer">
            <Link href="/actualidad">← Volver a todas las publicaciones</Link>
          </div>
        </div>
      </article>
    </main>
  );
}
