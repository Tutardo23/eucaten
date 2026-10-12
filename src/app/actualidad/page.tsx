import type { Metadata } from "next";
import Image from "next/image";
import { siteContent } from "@/content/site";
import { listPublishedActualidad } from "@/lib/actualidad/repository";
import { toActualidadPublicItem } from "@/lib/actualidad/public";
import { ActualidadBrowser } from "./actualidad-browser";

export const metadata: Metadata = {
  title: "Actualidad",
  description:
    "Actualidad jurídica y regulatoria seleccionada por EUCATEN sobre compliance, fintech, fraude, integridad, juegos de azar y jurisprudencia.",
  alternates: { canonical: "/actualidad" },
  openGraph: {
    title: "Actualidad | EUCATEN",
    description:
      "Información jurídica y regulatoria relevante para las actividades de nuestros clientes.",
    url: "/actualidad",
  },
};

export const dynamic = "force-dynamic";

export default async function ActualidadPage() {
  const items = (await listPublishedActualidad(60)).map(toActualidadPublicItem);

  return (
    <main className="updates-page">
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
          <a className="updates-back" href="/">Volver al inicio</a>
        </div>
      </header>

      <section className="updates-page-hero">
        <div className="shell updates-page-hero-grid">
          <div className="updates-page-intro">
            <p className="eyebrow">EUCATEN / ACTUALIDAD</p>
            <h1>Actualidad</h1>
            <p className="updates-page-lead">
              Información jurídica y regulatoria relevante para las actividades de nuestros clientes.
            </p>
            <p className="updates-page-support">
              Aquí encontrará contenidos de interés que le permitirán mantenerse actualizado en cuestiones de compliance.
            </p>
          </div>
          <Image
            src="/brand/eucaten-isotipo.png"
            alt=""
            width={489}
            height={475}
            className="updates-page-symbol hero-isotipo-motion"
            priority
          />
        </div>
      </section>

      <section className="updates-page-content">
        {items.length === 0 ? (
          <div className="shell updates-empty-state">
            <span className="updates-empty-index">01 / publicaciones</span>
            <h2>{siteContent.updates.emptyTitle}</h2>
            <p>{siteContent.updates.emptyBody}</p>
            <a href="/">Volver a EUCATEN</a>
          </div>
        ) : (
          <div className="shell">
            <div className="updates-public-head">
              <div>
                <span className="updates-empty-index">01 / publicaciones</span>
                <h2>Selección editorial</h2>
              </div>
              <p>
                Novedades seleccionadas por su relevancia jurídica, regulatoria o empresarial.
              </p>
            </div>

            <ActualidadBrowser items={items} />
          </div>
        )}
      </section>
    </main>
  );
}
