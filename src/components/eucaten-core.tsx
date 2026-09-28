"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { siteContent } from "@/content/site";

const phoneHref = `tel:${siteContent.brand.phone.replace(/[^+\d]/g, "")}`;

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 11L11 3M5 3H11V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EucatenCore() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const regionPrefix = useId();

  return (
    <main className="eucaten-page">
      <header className="site-header">
        <div className="shell header-row">
          <a href="#inicio" className="brand" aria-label="EUCATEN, ir al inicio">
            <Image
              src="/brand/eucaten-isotipo.png"
              alt=""
              width={489}
              height={475}
              className="brand-symbol"
              priority
            />
            <Image
              src="/brand/eucaten-wordmark.png"
              alt="EUCATEN"
              width={567}
              height={80}
              className="brand-wordmark"
              priority
            />
          </a>

          <nav className="header-nav" aria-label="Navegación principal">
            <a href="#servicios">Servicios</a>
            <a href={phoneHref} aria-label={`Contactar por llamada al ${siteContent.brand.phone}`}>
              Contactar
            </a>
          </nav>
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{siteContent.hero.eyebrow}</p>
            <h1>{siteContent.hero.title}</h1>
            <p className="hero-lead">{siteContent.hero.lead}</p>
            <div className="hero-actions">
              <a href="#servicios" className="button button-primary">
                {siteContent.hero.primaryCta}
              </a>
              <a
                href={phoneHref}
                className="button button-link"
                aria-label={`Contactar por llamada al ${siteContent.brand.phone}`}
              >
                <span>{siteContent.hero.secondaryCta}</span>
                <ArrowIcon />
              </a>
            </div>
          </div>

          <div className="hero-art-wrap">
            <Image
              src="/brand/eucaten-hero-art.svg"
              alt="Composición abstracta de planos entrelazados en azul noche, bronce y plata."
              width={900}
              height={760}
              className="hero-art"
              priority
            />
          </div>
        </div>
      </section>

      <section className="services" id="servicios">
        <div className="shell services-grid">
          <div className="services-intro">
            <p className="section-label">{siteContent.servicesIntro.label}</p>
            <h2>{siteContent.servicesIntro.title}</h2>
            <p>{siteContent.servicesIntro.body}</p>
          </div>

          <div className="services-list" role="list">
            {siteContent.services.map((service, index) => {
              const expanded = openIndex === index;
              const panelId = `${regionPrefix}-panel-${index}`;
              const buttonId = `${regionPrefix}-trigger-${index}`;

              return (
                <article className={`service-item${expanded ? " is-open" : ""}`} key={service.number}>
                  <button
                    id={buttonId}
                    type="button"
                    className="service-trigger"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(expanded ? null : index)}
                  >
                    <span className="service-number">{service.number}</span>
                    <span className="service-heading">{service.title}</span>
                    <span className="service-icon" aria-hidden="true">
                      {expanded ? "−" : "+"}
                    </span>
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={`service-panel${expanded ? " is-open" : ""}`}
                  >
                    <div className="service-panel-inner">
                      <p>{service.body}</p>
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
