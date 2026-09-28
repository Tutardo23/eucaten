"use client";

import Image from "next/image";
import { PointerEvent, useEffect, useRef, useState } from "react";
import { siteContent } from "@/content/site";

function BrandMotion() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = wrapRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty("--px", x.toFixed(3));
    node.style.setProperty("--py", y.toFixed(3));
  };

  const resetPointer = () => {
    const node = wrapRef.current;
    if (!node) return;
    node.style.setProperty("--px", "0");
    node.style.setProperty("--py", "0");
  };

  return (
    <div
      ref={wrapRef}
      className="brand-motion"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-hidden="true"
    >
      <div className="brand-orbit brand-orbit-a" />
      <div className="brand-orbit brand-orbit-b" />

      <svg className="brand-ribbons" viewBox="0 0 720 590" role="presentation">
        <defs>
          <linearGradient id="eucatenGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#75501D" />
            <stop offset="0.2" stopColor="#D7AF63" />
            <stop offset="0.43" stopColor="#F2D796" />
            <stop offset="0.65" stopColor="#A8752B" />
            <stop offset="0.86" stopColor="#E4C47D" />
            <stop offset="1" stopColor="#7C571F" />
          </linearGradient>
          <linearGradient id="eucatenNavy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#071426" />
            <stop offset="0.28" stopColor="#26496F" />
            <stop offset="0.5" stopColor="#0A203C" />
            <stop offset="0.78" stopColor="#31557B" />
            <stop offset="1" stopColor="#08172B" />
          </linearGradient>
          <linearGradient id="eucatenSilver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#737A80" />
            <stop offset="0.24" stopColor="#ECEDEB" />
            <stop offset="0.47" stopColor="#979EA3" />
            <stop offset="0.72" stopColor="#F7F6F2" />
            <stop offset="1" stopColor="#777D82" />
          </linearGradient>
          <filter id="ribbonShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="18" stdDeviation="17" floodColor="#071426" floodOpacity="0.14" />
          </filter>
        </defs>

        <g className="ribbon-track ribbon-track-gold" filter="url(#ribbonShadow)">
          <path d="M-45 425 C96 311 189 369 289 438 C391 508 502 500 598 398 C657 335 694 259 772 216" />
        </g>
        <g className="ribbon-track ribbon-track-navy" filter="url(#ribbonShadow)">
          <path d="M-52 153 C78 199 153 333 265 350 C390 370 432 222 548 191 C642 165 708 211 778 278" />
        </g>
        <g className="ribbon-track ribbon-track-silver" filter="url(#ribbonShadow)">
          <path d="M80 -52 C132 69 237 111 326 194 C418 280 451 385 521 482 C575 558 648 611 713 656" />
        </g>
      </svg>

      <div className="brand-logo-stage">
        <span className="logo-halo" />
        <Image
          src="/brand/eucaten-isotipo.png"
          alt=""
          width={489}
          height={475}
          priority
          sizes="(max-width: 760px) 180px, 255px"
        />
      </div>

      <span className="motion-note motion-note-a">LEGAL</span>
      <span className="motion-note motion-note-b">REGULATORY</span>
      <span className="motion-note motion-note-c">COMPLIANCE</span>
    </div>
  );
}

export function EucatenFirstScreen() {
  const [activeService, setActiveService] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    const update = () => {
      const y = Math.min(window.scrollY, window.innerHeight);
      root.style.setProperty("--page-scroll", `${y}px`);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const service = siteContent.services[activeService];
  const phoneHref = `tel:${siteContent.brand.phone.replace(/[^+\d]/g, "")}`;

  return (
    <div ref={rootRef} className="eucaten-first">
      <header className="site-header">
        <a className="brand-lockup" href="#inicio" aria-label="EUCATEN — Inicio">
          <Image src="/brand/eucaten-isotipo.png" alt="" width={38} height={37} priority />
          <span>
            <strong>{siteContent.brand.name}</strong>
            <small>{siteContent.brand.descriptor}</small>
          </span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#servicios">Servicios</a>
          <a className="nav-contact" href={phoneHref}>Consultar <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <main>
        <section id="inicio" className="hero-section">
          <div className="hero-copy">
            <p className="hero-eyebrow"><span />{siteContent.hero.eyebrow}</p>
            <h1>{siteContent.hero.title}</h1>
            <p className="hero-lead">{siteContent.hero.lead}</p>
            <div className="hero-actions">
              <a className="button-primary" href="#servicios">Conocer los servicios <span aria-hidden="true">↓</span></a>
              <a className="button-text" href={phoneHref}>Consultar <span aria-hidden="true">↗</span></a>
            </div>
            <div className="hero-proof" aria-label="Áreas de trabajo">
              <span>Legal</span><i />
              <span>Regulatory</span><i />
              <span>Compliance</span>
            </div>
          </div>

          <div className="hero-visual">
            <BrandMotion />
          </div>
        </section>

        <section id="servicios" className="services-section">
          <div className="services-intro">
            <p className="section-label">Servicios <span>01—08</span></p>
            <h2>Soluciones legales y de cumplimiento normativo.</h2>
            <p>Ocho servicios con la misma jerarquía. Seleccioná uno para conocer su alcance.</p>
          </div>

          <div className="services-browser">
            <div className="services-list" role="list" aria-label="Servicios de EUCATEN">
              {siteContent.services.map((item, index) => {
                const active = activeService === index;
                return (
                  <div key={item.number} className={`service-item ${active ? "is-active" : ""}`} role="listitem">
                    <button
                      type="button"
                      className="service-row"
                      onMouseEnter={() => setActiveService(index)}
                      onFocus={() => setActiveService(index)}
                      onClick={() => setActiveService(index)}
                      aria-expanded={active}
                      aria-controls={`service-detail-${item.number}`}
                    >
                      <span className="service-number">{item.number}</span>
                      <strong>{item.title}</strong>
                      <span className="service-arrow" aria-hidden="true">{active ? "—" : "+"}</span>
                    </button>
                    <div
                      id={`service-detail-${item.number}`}
                      className="service-mobile-detail"
                      hidden={!active}
                    >
                      <p>{item.body}</p>
                      <a href={phoneHref}>Consultar sobre este servicio <span aria-hidden="true">↗</span></a>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="service-detail" aria-live="polite">
              <div className="service-detail-top">
                <span>{service.number} / 08</span>
                <span>EUCATEN</span>
              </div>
              <div className="service-detail-body" key={service.number}>
                <h3>{service.title}</h3>
                <p>{service.body}</p>
                <a href={phoneHref}>Consultar sobre este servicio <span aria-hidden="true">↗</span></a>
              </div>
              <div className="detail-mark" aria-hidden="true">
                <svg viewBox="0 0 180 180" role="presentation">
                  <path d="M18 108 C50 57 99 51 162 78" />
                  <path d="M26 73 C74 106 101 125 155 111" />
                  <path d="M69 18 C88 62 111 98 121 160" />
                </svg>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
