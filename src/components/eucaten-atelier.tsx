"use client";

import Image from "next/image";
import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { siteContent } from "@/content/site";

function RibbonComposition() {
  const ref = useRef<HTMLDivElement | null>(null);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty("--rx", x.toFixed(3));
    node.style.setProperty("--ry", y.toFixed(3));
  };

  return (
    <div
      ref={ref}
      className="ribbon-composition"
      onPointerMove={move}
      onPointerLeave={() => {
        const node = ref.current;
        if (!node) return;
        node.style.setProperty("--rx", "0");
        node.style.setProperty("--ry", "0");
      }}
      aria-hidden="true"
    >
      <div className="ribbon-caption ribbon-caption-a"><span>LEGAL</span><i /></div>
      <div className="ribbon-caption ribbon-caption-b"><span>REGULATORY</span><i /></div>
      <div className="ribbon-caption ribbon-caption-c"><span>COMPLIANCE</span><i /></div>

      <svg viewBox="0 0 760 620" role="presentation">
        <defs>
          <linearGradient id="goldMetal" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#6f4c17" />
            <stop offset=".16" stopColor="#c79848" />
            <stop offset=".42" stopColor="#f0d18d" />
            <stop offset=".64" stopColor="#9b6b25" />
            <stop offset=".84" stopColor="#dfbb70" />
            <stop offset="1" stopColor="#6f4c17" />
          </linearGradient>
          <linearGradient id="navyMetal" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#051123" />
            <stop offset=".27" stopColor="#18385f" />
            <stop offset=".52" stopColor="#071a34" />
            <stop offset=".76" stopColor="#294a6f" />
            <stop offset="1" stopColor="#071528" />
          </linearGradient>
          <linearGradient id="silverMetal" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#666b70" />
            <stop offset=".25" stopColor="#e8e9e7" />
            <stop offset=".48" stopColor="#8d9499" />
            <stop offset=".72" stopColor="#f5f4f1" />
            <stop offset="1" stopColor="#747a7f" />
          </linearGradient>
          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#08172a" floodOpacity=".14" />
          </filter>
        </defs>

        <g className="ribbon ribbon-gold" filter="url(#softShadow)">
          <path d="M-18 437 C115 329 192 392 286 456 C401 534 514 506 614 393 C671 329 706 254 789 218" />
        </g>
        <g className="ribbon ribbon-navy" filter="url(#softShadow)">
          <path d="M-24 176 C104 233 168 356 272 365 C399 376 427 224 546 193 C640 168 707 216 789 295" />
        </g>
        <g className="ribbon ribbon-silver" filter="url(#softShadow)">
          <path d="M84 -30 C140 82 246 127 337 207 C430 289 457 393 526 489 C583 568 663 619 724 661" />
        </g>
      </svg>

      <div className="composition-stamp">
        <Image src="/brand/eucaten-isotipo.png" alt="" width={68} height={66} priority />
      </div>
    </div>
  );
}

export function EucatenAtelier() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeJourney, setActiveJourney] = useState(1);
  const [activeService, setActiveService] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.dataset.ready = "true";

    const reveal = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    reveal.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const serviceColumns = useMemo(
    () => siteContent.services.map((_, index) => (index === activeService ? "4.6fr" : ".72fr")).join(" "),
    [activeService]
  );

  const stage = siteContent.journey[activeJourney];

  return (
    <div ref={rootRef} className="eucaten-v5">
      <header className="atelier-header">
        <a className="atelier-brand" href="#inicio" aria-label="EUCATEN — Inicio">
          <Image src="/brand/eucaten-isotipo.png" alt="" width={34} height={33} priority />
          <span>
            <strong>{siteContent.brand.name}</strong>
            <small>{siteContent.brand.descriptor}</small>
          </span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#acompanamiento">Cómo trabajamos</a>
          <a href="#soluciones">Soluciones</a>
          <a className="header-contact" href={`tel:${siteContent.brand.phone.replace(/[^+\d]/g, "")}`}>Hablemos <span>↗</span></a>
        </nav>
      </header>

      <main>
        <section id="inicio" className="atelier-hero">
          <div className="hero-gridline hero-gridline-a" aria-hidden="true" />
          <div className="hero-gridline hero-gridline-b" aria-hidden="true" />
          <div className="hero-copy" data-reveal>
            <div className="hero-eyebrow"><span>01</span>{siteContent.hero.eyebrow}</div>
            <h1>{siteContent.hero.title}</h1>
            <p>{siteContent.hero.lead}</p>
            <div className="hero-actions">
              <a href="#soluciones" className="action-primary">Explorar soluciones <span>↘</span></a>
              <a href="#acompanamiento" className="action-link">Nuestro enfoque</a>
            </div>
          </div>

          <div className="hero-art" data-reveal>
            <RibbonComposition />
          </div>

          <div className="hero-signal" aria-hidden="true">
            <div className="signal-track">
              {[...siteContent.hero.signals, ...siteContent.hero.signals].map((signal, index) => (
                <span key={`${signal}-${index}`}>{signal}<i /></span>
              ))}
            </div>
          </div>
        </section>

        <section id="acompanamiento" className="continuum-section">
          <div className="continuum-copy" data-reveal>
            <div className="section-kicker"><span>02</span>Acompañamiento integral</div>
            <h2>No llegamos solamente cuando hay un problema.</h2>
            <p>
              EUCATEN puede acompañar todo el ciclo de una empresa o sumarse en una etapa puntual. La misma mirada conecta lo societario, lo regulatorio y el cumplimiento diario.
            </p>
            <div className="continuum-readout" key={stage.number}>
              <span>{stage.number} — {stage.kicker}</span>
              <strong>{stage.title}</strong>
              <p>{stage.body}</p>
            </div>
          </div>

          <div className="continuum-rail" data-reveal>
            <svg className="rail-line" viewBox="0 0 850 260" preserveAspectRatio="none" aria-hidden="true">
              <path d="M20 196 C168 196 173 59 350 84 C502 105 519 213 676 164 C746 142 779 79 830 60" />
            </svg>
            <div className={`rail-glow rail-glow-${activeJourney + 1}`} />
            {siteContent.journey.map((item, index) => (
              <button
                key={item.number}
                type="button"
                className={`rail-node rail-node-${index + 1} ${activeJourney === index ? "is-active" : ""}`}
                onMouseEnter={() => setActiveJourney(index)}
                onFocus={() => setActiveJourney(index)}
                onClick={() => setActiveJourney(index)}
                aria-pressed={activeJourney === index}
              >
                <span>{item.number}</span>
                <strong>{item.title}</strong>
              </button>
            ))}
            <div className="rail-caption">Estructuramos · Gestionamos · Acompañamos</div>
          </div>
        </section>

        <section id="soluciones" className="solutions-section">
          <div className="solutions-heading" data-reveal>
            <div className="section-kicker section-kicker-light"><span>03</span>Soluciones</div>
            <h2>Ocho áreas. Una misma forma de trabajar.</h2>
            <p>Elegí una para ver el alcance. Todas tienen la misma jerarquía dentro de la propuesta de EUCATEN.</p>
          </div>

          <div
            className="service-folds"
            style={{ gridTemplateColumns: serviceColumns }}
            data-reveal
          >
            {siteContent.services.map((service, index) => {
              const active = activeService === index;
              return (
                <button
                  key={service.number}
                  type="button"
                  className={`service-fold ${active ? "is-active" : ""}`}
                  onMouseEnter={() => setActiveService(index)}
                  onFocus={() => setActiveService(index)}
                  onClick={() => setActiveService(index)}
                  aria-expanded={active}
                >
                  <div className="fold-topline">
                    <span>{service.number}</span>
                    <i>{active ? "ABIERTO" : "VER"}</i>
                  </div>
                  <div className="fold-collapsed">
                    <strong>{service.short}</strong>
                  </div>
                  <div className="fold-expanded">
                    <span className="fold-index">{service.number} / 08</span>
                    <h3>{service.title}</h3>
                    <p>{service.body}</p>
                    <span className="fold-foot">Legal · Regulatory · Compliance</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="closing-section" data-reveal>
          <div>
            <span>Estudio Jurídico & Consultoría</span>
            <h2>{siteContent.brand.tagline}</h2>
          </div>
          <a href={`tel:${siteContent.brand.phone.replace(/[^+\d]/g, "")}`}>Hablemos <span>↗</span></a>
        </section>
      </main>
    </div>
  );
}
