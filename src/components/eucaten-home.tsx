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
  return <div className={`section-seam section-seam-${variant}`} aria-hidden="true" />;
}

function SectionEdgeLines({ variant }: { variant: "services" | "accompaniment" | "team" | "contact" }) {
  const isRight = variant === "accompaniment" || variant === "contact";

  return (
    <div className={`section-signature section-signature-${variant}${isRight ? " is-right" : " is-left"}`} aria-hidden="true">
      <svg viewBox="0 0 64 1000" preserveAspectRatio="none" className="section-signature-svg">
        <path className="signature-terminal" d="M2 0 H62" />
        <path className="signature-terminal signature-terminal-bottom" d="M2 1000 H62" />

        <path
          className="signature-line signature-gold"
          d="M14 0 C14 120 14 210 17 285 C20 340 42 365 45 430 C48 500 19 535 16 605 C13 680 37 710 41 775 C45 845 44 915 44 1000"
        />
        <path
          className="signature-line signature-navy"
          d="M31 0 C31 120 31 210 31 285 C31 340 20 370 20 430 C20 500 44 535 44 605 C44 680 24 710 24 775 C24 845 31 915 31 1000"
        />
        <path
          className="signature-line signature-silver"
          d="M48 0 C48 120 48 210 45 285 C42 340 30 365 31 430 C32 500 28 535 32 605 C36 680 19 710 20 775 C21 845 18 915 18 1000"
        />
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
