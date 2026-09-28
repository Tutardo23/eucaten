"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { siteContent } from "@/content/site";

const whatsappNumber = siteContent.brand.phone.replace(/\D/g, "");
const whatsappBase = `https://wa.me/${whatsappNumber}`;
const whatsappHref = (message: string) => `${whatsappBase}?text=${encodeURIComponent(message)}`;
const generalWhatsappHref = whatsappHref("Hola, quisiera hacer una consulta a EUCATEN.");
const navItems = [
  { label: "Servicios", href: "#servicios", id: "servicios" },
  { label: "Acompañamiento", href: "#acompanamiento", id: "acompanamiento" },
  { label: "Nosotras", href: "#nosotras", id: "nosotras" },
  { label: "Contactar", href: "#contacto", id: "contacto" },
] as const;

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 12 12 4M6 4h6v6" />
    </svg>
  );
}

function SectionBridge({ variant }: { variant: "hero-services" | "services-accompaniment" | "accompaniment-team" | "team-contact" }) {
  const variants = {
    "hero-services": {
      className: "bridge-hero-services",
      paths: [
        "M0 56 C160 56 270 56 382 48 C500 40 620 40 742 48 C850 55 925 58 1000 58",
        "M0 62 C160 62 270 62 382 54 C500 46 620 46 742 54 C850 61 925 64 1000 64",
        "M0 68 C160 68 270 68 382 60 C500 52 620 52 742 60 C850 67 925 70 1000 70",
      ],
    },
    "services-accompaniment": {
      className: "bridge-services-accompaniment",
      paths: [
        "M0 58 C150 58 240 58 334 52 C452 44 560 38 656 40 C772 43 874 53 1000 60",
        "M0 64 C150 64 240 64 334 58 C452 50 560 44 656 46 C772 49 874 59 1000 66",
        "M0 70 C150 70 240 70 334 64 C452 56 560 50 656 52 C772 55 874 65 1000 72",
      ],
    },
    "accompaniment-team": {
      className: "bridge-accompaniment-team",
      paths: [
        "M0 60 C144 60 252 52 372 44 C486 38 612 38 726 46 C836 54 920 58 1000 58",
        "M0 66 C144 66 252 58 372 50 C486 44 612 44 726 52 C836 60 920 64 1000 64",
        "M0 72 C144 72 252 64 372 56 C486 50 612 50 726 58 C836 66 920 70 1000 70",
      ],
    },
    "team-contact": {
      className: "bridge-team-contact",
      paths: [
        "M0 58 C168 58 284 58 404 52 C518 46 628 42 724 44 C834 46 918 54 1000 60",
        "M0 64 C168 64 284 64 404 58 C518 52 628 48 724 50 C834 52 918 60 1000 66",
        "M0 70 C168 70 284 70 404 64 C518 58 628 54 724 56 C834 58 918 66 1000 72",
      ],
    },
  } as const;

  const config = variants[variant];

  return (
    <div className={`section-bridge ${config.className}`} aria-hidden="true">
      <svg viewBox="0 0 1000 76" preserveAspectRatio="none">
        <path className="bridge-line bridge-line-gold" d={config.paths[0]} />
        <path className="bridge-line bridge-line-navy" d={config.paths[1]} />
        <path className="bridge-line bridge-line-silver" d={config.paths[2]} />
      </svg>
    </div>
  );
}

function SectionEdgeLines({ variant }: { variant: "services" | "accompaniment" | "team" | "contact" }) {
  const leftPaths = [
    "M44 0 H10 C10 96 12 176 16 286 C20 408 26 496 22 614 C18 730 10 842 12 1000",
    "M44 0 H18 C18 104 22 196 28 316 C34 432 32 532 24 642 C16 758 14 870 18 1000",
    "M44 0 H28 C28 114 24 222 18 348 C12 470 12 584 18 704 C24 822 28 912 30 1000",
  ] as const;

  const rightPaths = [
    "M0 0 H34 C34 96 32 176 28 286 C24 408 18 496 22 614 C26 730 34 842 32 1000",
    "M0 0 H26 C26 104 22 196 16 316 C10 432 12 532 20 642 C28 758 30 870 26 1000",
    "M0 0 H16 C16 114 20 222 26 348 C32 470 32 584 26 704 C20 822 16 912 14 1000",
  ] as const;

  const paths = variant === "services" || variant === "team" ? leftPaths : rightPaths;

  return (
    <div className={`section-edge-lines section-edge-lines-${variant}`} aria-hidden="true">
      <svg viewBox="0 0 44 1000" preserveAspectRatio="none">
        <path className="section-edge-line section-edge-gold" d={paths[0]} />
        <path className="section-edge-line section-edge-navy" d={paths[1]} />
        <path className="section-edge-line section-edge-silver" d={paths[2]} />
      </svg>
    </div>
  );
}

function JourneyLines() {
  return (
    <svg className="journey-lines" viewBox="0 0 1000 260" preserveAspectRatio="none" aria-hidden="true">
      <path className="journey-gold" d="M0 170 C160 170 175 50 330 50 C485 50 480 205 655 205 C805 205 835 92 1000 92" />
      <path className="journey-navy" d="M0 184 C155 184 190 66 338 66 C490 66 500 219 663 219 C820 219 845 108 1000 108" />
      <path className="journey-silver" d="M0 198 C160 198 205 82 346 82 C500 82 515 233 671 233 C830 233 855 124 1000 124" />
    </svg>
  );
}

export function EucatenHome() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const [menuOpen, setMenuOpen] = useState(false);
  const idPrefix = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["inicio", "servicios", "acompanamiento", "nosotras", "contacto"];
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-24% 0px -58% 0px", threshold: [0.08, 0.2, 0.45] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="eucaten-page">
      <header className={`site-header${scrolled ? " is-scrolled" : ""}${menuOpen ? " menu-open" : ""}`}>
        <div className="shell header-inner">
          <a className="brand" href="#inicio" aria-label="EUCATEN, ir al inicio" onClick={closeMenu}>
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

          <nav className="site-nav desktop-nav" aria-label="Navegación principal">
            {navItems.map((item) => (
              <a
                className={activeSection === item.id ? "is-active" : ""}
                href={item.href}
                key={item.id}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>

        <div className="mobile-navigation" id="mobile-navigation" aria-hidden={!menuOpen}>
          <nav className="shell mobile-nav" aria-label="Navegación móvil">
            {navItems.map((item, index) => (
              <a
                className={activeSection === item.id ? "is-active" : ""}
                href={item.href}
                onClick={closeMenu}
                tabIndex={menuOpen ? 0 : -1}
                key={item.id}
              >
                <span className="mobile-nav-number">0{index + 1}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="hero-shell">
        <section className="hero" id="inicio">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">{siteContent.hero.eyebrow}</p>
              <h1>{siteContent.hero.title}</h1>
              <p className="hero-lead">{siteContent.hero.lead}</p>

              <div className="hero-actions">
                <a className="button button-primary" href="#servicios">
                  {siteContent.hero.primaryCta}
                </a>
                <a
                  className="button button-secondary"
                  href={generalWhatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Contactar a EUCATEN por WhatsApp"
                >
                  <span>{siteContent.hero.secondaryCta}</span>
                  <ArrowUpRight />
                </a>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-logo-stage">
                <Image
                  src="/brand/eucaten-isotipo.png"
                  alt=""
                  width={489}
                  height={475}
                  className="hero-isotipo"
                  priority
                  sizes="(max-width: 900px) 70vw, 34vw"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <SectionBridge variant="hero-services" />

      <section className="services-section connected-section" id="servicios">
        <SectionEdgeLines variant="services" />
        <div className="shell services-wrap">
          <header className="services-masthead">
            <div className="services-title-block">
              <p className="section-kicker">{siteContent.servicesIntro.label}</p>
              <h2>{siteContent.servicesIntro.title}</h2>
            </div>
            <div className="services-intro-block">
              <p>{siteContent.servicesIntro.body}</p>
              <div className="services-count" aria-hidden="true">
                <span>08</span>
                <small>áreas de práctica</small>
              </div>
            </div>
          </header>

          <div className="services-stage">
            <div className="services-side-rail" aria-hidden="true">
              <span>LEGAL</span>
              <span>REGULATORY</span>
              <span>COMPLIANCE</span>
            </div>

            <div className="services-card" role="list">
              {siteContent.services.map((service, index) => {
                const isOpen = openIndex === index;
                const buttonId = `${idPrefix}-service-${index}-button`;
                const panelId = `${idPrefix}-service-${index}-panel`;

                return (
                  <article
                    className={`service-item${isOpen ? " is-open" : ""}`}
                    key={service.number}
                    role="listitem"
                  >
                    <button
                      id={buttonId}
                      className="service-trigger"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                    >
                      <span className="service-number">{service.number}</span>
                      <span className="service-title">{service.title}</span>
                      <span className="service-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                    </button>

                    <div
                      id={panelId}
                      className={`service-panel${isOpen ? " is-open" : ""}`}
                      role="region"
                      aria-labelledby={buttonId}
                      aria-hidden={!isOpen}
                    >
                      <div className="service-panel-inner">
                        <p>{service.body}</p>
                        <a
                          className="service-contact-link"
                          href={whatsappHref(`Hola, quisiera consultar por el servicio: ${service.title}.`)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Consultar por ${service.title} mediante WhatsApp`}
                          tabIndex={isOpen ? 0 : -1}
                        >
                          <span>Consultar por este servicio</span>
                          <ArrowUpRight />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <SectionBridge variant="services-accompaniment" />

      <section className="accompaniment-section connected-section" id="acompanamiento">
        <SectionEdgeLines variant="accompaniment" />
        <div className="shell accompaniment-shell">
          <header className="accompaniment-intro">
            <p className="section-kicker">{siteContent.accompaniment.label}</p>
            <h2>{siteContent.accompaniment.title}</h2>
            <p>{siteContent.accompaniment.lead}</p>
          </header>

          <div className="accompaniment-map" aria-label="Momentos de acompañamiento">
            <JourneyLines />
            {siteContent.accompaniment.moments.map((moment, index) => (
              <article className={`accompaniment-point point-${index + 1}`} key={moment.number}>
                <span className="accompaniment-number" aria-hidden="true">{moment.number}</span>
                <div className="accompaniment-point-copy">
                  <h3>{moment.title}</h3>
                  <p>{moment.body}</p>
                </div>
              </article>
            ))}
          </div>

          <p className="accompaniment-note">{siteContent.accompaniment.note}</p>
        </div>
      </section>

      <SectionBridge variant="accompaniment-team" />

      <section className="team-section connected-section" id="nosotras">
        <SectionEdgeLines variant="team" />
        <div className="shell team-heading">
          <div>
            <p className="section-kicker">{siteContent.team.label}</p>
            <span className="team-heading-index">02 / perfiles</span>
          </div>
          <h2>{siteContent.team.title}</h2>
        </div>

        <div className="shell team-list">
          {siteContent.team.people.map((person, index) => (
            <article className={`team-profile team-profile-${index + 1}`} key={person.name}>
              <div className="team-photo-wrap">
                <Image
                  src={person.image}
                  alt={`Retrato de ${person.name}`}
                  width={person.imageWidth}
                  height={person.imageHeight}
                  className="team-photo"
                  sizes="(max-width: 768px) 100vw, 48vw"
                />
                <span className="team-photo-number" aria-hidden="true">{person.number}</span>
              </div>

              <div className="team-copy-panel">
                <span className="team-watermark" aria-hidden="true">{person.number}</span>
                <p className="team-role">{person.role}</p>
                <h3>{person.name}</h3>
                <div className="team-bio">
                  {person.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SectionBridge variant="team-contact" />

      <section className="contact-section connected-section" id="contacto">
        <SectionEdgeLines variant="contact" />
        <div className="shell contact-shell">
          <div className="contact-copy">
            <p className="contact-kicker">{siteContent.contact.label}</p>
            <h2>{siteContent.contact.title}</h2>
            <p>{siteContent.contact.lead}</p>
          </div>

          <a
            className="contact-call"
            href={generalWhatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Contactar a EUCATEN por WhatsApp"
          >
            <span className="contact-call-meta">Escribir por WhatsApp</span>
            <span className="contact-call-number">{siteContent.brand.phone}</span>
            <span className="contact-call-icon"><ArrowUpRight /></span>
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell footer-main">
          <a className="footer-brand" href="#inicio" aria-label="EUCATEN, volver al inicio">
            <Image className="footer-symbol" src="/brand/eucaten-isotipo.png" alt="" width={489} height={475} />
            <Image className="footer-wordmark" src="/brand/eucaten-wordmark-cream.png" alt="EUCATEN" width={567} height={80} />
          </a>

          <nav className="footer-nav" aria-label="Navegación del pie">
            {siteContent.footer.navigation.map((item) => (
              <a href={item.href} key={item.href}>{item.label}</a>
            ))}
          </nav>

          <a
            className="footer-phone"
            href={generalWhatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir WhatsApp para contactar a EUCATEN"
          >
            WhatsApp · {siteContent.brand.phone}
          </a>
        </div>
      </footer>
    </main>
  );
}
