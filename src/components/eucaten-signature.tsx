"use client";

import Image from "next/image";
import { useState } from "react";
import { siteContent } from "@/content/site";

const phoneHref = `tel:${siteContent.brand.phone.replace(/[^+\d]/g, "")}`;

export function EucatenSignature() {
  const [openService, setOpenService] = useState<number | null>(null);

  const toggleService = (index: number) => {
    setOpenService((current) => (current === index ? null : index));
  };

  return (
    <main className="eucaten-foundation">
      <header className="site-header">
        <div className="site-shell header-inner">
          <a className="brand-lockup" href="#inicio" aria-label="EUCATEN — Inicio">
            <Image
              className="brand-symbol"
              src="/brand/eucaten-isotipo.png"
              alt=""
              width={489}
              height={475}
              priority
              sizes="42px"
            />
            <Image
              className="brand-wordmark"
              src="/brand/eucaten-wordmark.png"
              alt="EUCATEN"
              width={650}
              height={111}
              priority
              sizes="180px"
            />
          </a>

          <nav className="site-nav" aria-label="Navegación principal">
            <a href="#servicios">Servicios</a>
            <a className="nav-contact" href={phoneHref}>Contactar</a>
          </nav>
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="site-shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{siteContent.hero.eyebrow}</p>
            <h1>{siteContent.hero.title}</h1>
            <p className="hero-lead">{siteContent.hero.lead}</p>

            <div className="hero-actions">
              <a className="button button-primary" href="#servicios">Ver servicios</a>
              <a className="button button-secondary" href={phoneHref}>Contactar</a>
            </div>
          </div>

          <aside className="hero-note" aria-label="Forma de acompañamiento">
            <span className="hero-note-rule" aria-hidden="true" />
            <p>Asesoramiento integral o intervenciones puntuales, según la etapa y necesidad de cada organización.</p>
          </aside>
        </div>
      </section>

      <section className="services-section" id="servicios">
        <div className="site-shell services-shell">
          <header className="services-header">
            <p className="section-kicker">Servicios 01—08</p>
            <h2>Nuestros servicios</h2>
            <p>Estructuramos, gestionamos y acompañamos.</p>
          </header>

          <div className="services-list">
            {siteContent.services.map((service, index) => {
              const isOpen = openService === index;
              const panelId = `service-panel-${service.number}`;
              const buttonId = `service-button-${service.number}`;

              return (
                <article className={`service-item${isOpen ? " is-open" : ""}`} key={service.number}>
                  <button
                    id={buttonId}
                    className="service-trigger"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleService(index)}
                  >
                    <span className="service-number">{service.number}</span>
                    <span className="service-title">{service.title}</span>
                    <span className="service-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                  </button>

                  <div
                    id={panelId}
                    className="service-panel"
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                  >
                    <div className="service-panel-inner">
                      <p>{service.body}</p>
                      <a href={phoneHref}>Consultar sobre este servicio <span aria-hidden="true">↗</span></a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
