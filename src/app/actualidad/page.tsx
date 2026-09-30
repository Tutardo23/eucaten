import type { Metadata } from "next";
import Image from "next/image";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Actualidad",
  description: "Notas, novedades regulatorias e información de interés de EUCATEN.",
  alternates: { canonical: "/actualidad" },
  openGraph: {
    title: "Actualidad | EUCATEN",
    description: "Notas, novedades regulatorias e información de interés de EUCATEN.",
    url: "/actualidad",
  },
};

export default function ActualidadPage() {
  return (
    <main className="updates-page">
      <header className="updates-page-header">
        <div className="shell updates-page-nav">
          <a className="brand" href="/" aria-label="EUCATEN, volver al inicio">
            <Image className="brand-symbol" src="/brand/eucaten-isotipo.png" alt="" width={489} height={475} priority />
            <Image className="brand-wordmark" src="/brand/eucaten-wordmark-cream.png" alt="EUCATEN" width={567} height={80} priority />
          </a>
          <a className="updates-back" href="/">Volver al inicio</a>
        </div>
      </header>

      <section className="updates-page-hero">
        <div className="shell updates-page-hero-grid">
          <div>
            <p className="eyebrow">{siteContent.updates.label}</p>
            <h1>{siteContent.updates.title}</h1>
            <p>{siteContent.updates.body}</p>
          </div>
          <Image src="/brand/eucaten-isotipo.png" alt="" width={489} height={475} className="updates-page-symbol hero-isotipo-motion" priority />
        </div>
      </section>

      <section className="updates-page-content">
        <div className="shell updates-empty-state">
          <span className="updates-empty-index">01 / publicaciones</span>
          <h2>{siteContent.updates.emptyTitle}</h2>
          <p>{siteContent.updates.emptyBody}</p>
          <a href="/">Volver a EUCATEN</a>
        </div>
      </section>
    </main>
  );
}
