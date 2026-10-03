"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { siteContent } from "@/content/site";

const whatsappNumber = siteContent.brand.phone.replace(/\D/g, "");
const whatsappBase = `https://wa.me/${whatsappNumber}`;
const whatsappHref = (message: string) => `${whatsappBase}?text=${encodeURIComponent(message)}`;
const generalWhatsappHref = whatsappHref("Hola, quisiera hacer una consulta a EUCATEN.");

const navItems = [
  { label: "Servicios", href: "#servicios", id: "servicios" },
  { label: "Acompañamiento", href: "#acompanamiento", id: "acompanamiento" },
  { label: "Nosotras", href: "#nosotras", id: "nosotras" },
  { label: "Actualidad", href: "/actualidad", id: "actualidad" },
  { label: "Contacto", href: "#contacto", id: "contacto" },
] as const;

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 12 12 4M6 4h6v6" />
    </svg>
  );
}

function shouldReduceMotion() {
  const forceMotion = new URLSearchParams(window.location.search).get("motion") === "1";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches && !forceMotion;
}

type SignatureTone = "gold" | "navy" | "silver";

type SignatureConfig = {
  bias: number;
  amplitude: number;
  phase: number;
};

/*
 * V11.11
 * Volvemos al movimiento REAL de V11.7/V11.8: en cada frame se modifica
 * el atributo `d` de los SVG paths con requestAnimationFrame.
 *
 * La diferencia es la geometría: ya no usamos perfiles irregulares ni
 * puntos que puedan formar picos. Las tres hebras salen de ondas largas y
 * continuas, separadas 120°, para que se trencen como la marca sin hacer
 * nudos extraños. El movimiento recorre verticalmente la curva, por eso se
 * ve claramente aunque el trazo mantenga siempre una forma limpia.
 */
const signatureConfig: Record<SignatureTone, SignatureConfig> = {
  gold: { bias: -3.5, amplitude: 12.4, phase: 0 },
  navy: { bias: 0, amplitude: 11.5, phase: (Math.PI * 2) / 3 },
  silver: { bias: 3.5, amplitude: 10.8, phase: (Math.PI * 4) / 3 },
};

const signatureY = [
  -80, -20, 40, 100, 160, 220, 280, 340, 400, 460,
  520, 580, 640, 700, 760, 820, 880, 940, 1000, 1080,
] as const;

function rounded(value: number) {
  return Number(value.toFixed(2));
}

function smoothSignaturePath(points: readonly (readonly [number, number])[]) {
  if (points.length < 2) return "";

  const [startX, startY] = points[0];
  const segments = [`M${rounded(startX)} ${rounded(startY)}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    segments.push(
      `C${rounded(cp1x)} ${rounded(cp1y)} ${rounded(cp2x)} ${rounded(cp2y)} ${rounded(p2[0])} ${rounded(p2[1])}`,
    );
  }

  return segments.join(" ");
}

function verticalSignaturePath(tone: SignatureTone, time: number) {
  const { bias, amplitude, phase } = signatureConfig[tone];
  const travel = time * 0.62;
  const minY = signatureY[0];
  const spanY = signatureY[signatureY.length - 1] - minY;

  const points = signatureY.map((y) => {
    const u = (y - minY) / spanY;

    // Onda principal: grande, lenta y continua. Es la que genera el
    // entrelazado visible y hace que los cruces recorran la sección.
    const primary = amplitude * Math.sin(
      u * Math.PI * 2 * 1.08 - travel + phase,
    );

    // Dos respiraciones de baja amplitud rompen la perfección matemática
    // sin introducir quiebres ni nudos.
    const secondary = 1.85 * Math.sin(
      u * Math.PI * 2 * 0.46 + travel * 0.36 + phase * 0.34,
    );
    const sharedSway = 1.45 * Math.sin(
      travel * 0.48 + u * Math.PI * 0.72,
    );

    const x = 31 + bias + primary + secondary + sharedSway;
    return [x, y] as const;
  });

  return smoothSignaturePath(points);
}

function journeyPath(baseY: number, phase: number, time: number) {
  const speed = 0.68;
  const a = Math.sin(time * speed + phase);
  const b = Math.sin(time * speed * 0.88 + phase + 1.55);
  const c = Math.sin(time * speed * 1.04 + phase + 3.1);
  const x1 = 285 + Math.sin(time * speed * 0.72 + phase) * 24;
  const x2 = 580 + Math.sin(time * speed * 0.81 + phase + 1.2) * 28;
  const x3 = 895 + Math.sin(time * speed * 0.76 + phase + 2.5) * 24;
  const y1 = baseY - 98 + a * 28;
  const y2 = baseY + 30 + b * 24;
  const y3 = baseY - 118 + c * 30;

  return [
    `M0 ${baseY}`,
    `C115 ${baseY} 150 ${y1} ${x1} ${y1}`,
    `C420 ${y1} 438 ${y2} ${x2} ${y2}`,
    `C720 ${y2} 754 ${y3} ${x3} ${y3}`,
    `C1030 ${y3} 1080 ${baseY - 22} 1200 ${baseY - 22}`,
  ].join(" ");
}

function SectionSignature({ side = "left" }: { side?: "left" | "right" }) {
  const goldRef = useRef<SVGPathElement>(null);
  const navyRef = useRef<SVGPathElement>(null);
  const silverRef = useRef<SVGPathElement>(null);
  const goldPulseRef = useRef<SVGPathElement>(null);
  const navyPulseRef = useRef<SVGPathElement>(null);
  const silverPulseRef = useRef<SVGPathElement>(null);

  const goldInitial = verticalSignaturePath("gold", 0);
  const navyInitial = verticalSignaturePath("navy", 0);
  const silverInitial = verticalSignaturePath("silver", 0);

  useEffect(() => {
    if (shouldReduceMotion()) return;

    let rafId = 0;
    const startedAt = performance.now();

    const frame = (now: number) => {
      const time = (now - startedAt) / 1000;
      const gold = verticalSignaturePath("gold", time);
      const navy = verticalSignaturePath("navy", time);
      const silver = verticalSignaturePath("silver", time);

      goldRef.current?.setAttribute("d", gold);
      navyRef.current?.setAttribute("d", navy);
      silverRef.current?.setAttribute("d", silver);
      goldPulseRef.current?.setAttribute("d", gold);
      navyPulseRef.current?.setAttribute("d", navy);
      silverPulseRef.current?.setAttribute("d", silver);

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className={`section-signature is-${side}`} aria-hidden="true">
      <svg viewBox="0 0 64 1000" preserveAspectRatio="none" className="section-signature-svg">
        <path ref={goldRef} className="signature-line signature-gold" d={goldInitial} />
        <path ref={navyRef} className="signature-line signature-navy" d={navyInitial} />
        <path ref={silverRef} className="signature-line signature-silver" d={silverInitial} />

        <path ref={goldPulseRef} className="signature-pulse pulse-gold" d={goldInitial} pathLength={1} />
        <path ref={navyPulseRef} className="signature-pulse pulse-navy" d={navyInitial} pathLength={1} />
        <path ref={silverPulseRef} className="signature-pulse pulse-silver" d={silverInitial} pathLength={1} />
      </svg>
    </div>
  );
}

function JourneyLines() {
  const goldRef = useRef<SVGPathElement>(null);
  const navyRef = useRef<SVGPathElement>(null);
  const silverRef = useRef<SVGPathElement>(null);
  const pulseRef = useRef<SVGPathElement>(null);

  const goldInitial = journeyPath(190, 0, 0);
  const navyInitial = journeyPath(204, 2.1, 0);
  const silverInitial = journeyPath(218, 4.2, 0);

  useEffect(() => {
    if (shouldReduceMotion()) return;

    let rafId = 0;
    const startedAt = performance.now();

    const frame = (now: number) => {
      const time = (now - startedAt) / 1000;
      const gold = journeyPath(190, 0, time);
      const navy = journeyPath(204, 2.1, time);
      const silver = journeyPath(218, 4.2, time);

      goldRef.current?.setAttribute("d", gold);
      navyRef.current?.setAttribute("d", navy);
      silverRef.current?.setAttribute("d", silver);
      pulseRef.current?.setAttribute("d", gold);

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <svg className="journey-lines" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
      <path ref={goldRef} className="journey-gold" d={goldInitial} pathLength={1} />
      <path ref={navyRef} className="journey-navy" d={navyInitial} pathLength={1} />
      <path ref={silverRef} className="journey-silver" d={silverInitial} pathLength={1} />
      <path ref={pulseRef} className="journey-pulse" d={goldInitial} pathLength={1} />
    </svg>
  );
}


export function EucatenHome() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const [menuOpen, setMenuOpen] = useState(false);
  const [typedEyebrow, setTypedEyebrow] = useState("");
  const [heroStage, setHeroStage] = useState(0);
  const [heroLogoReady, setHeroLogoReady] = useState(false);
  const [heroTypingDone, setHeroTypingDone] = useState(false);
  const idPrefix = useId();

  useEffect(() => {
    const sectionIds = ["inicio", "servicios", "acompanamiento", "nosotras", "actualidad-home", "contacto"];
    let rafId = 0;

    const updateScrollState = () => {
      rafId = 0;
      setScrolled(window.scrollY > 28);

      const marker = window.scrollY + Math.min(window.innerHeight * 0.34, 300);
      let current = "inicio";

      for (const id of sectionIds) {
        const node = document.getElementById(id);
        if (!node) continue;
        const top = node.getBoundingClientRect().top + window.scrollY;
        if (top <= marker) current = id;
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 12) {
        current = "contacto";
      }

      setActiveSection(current === "actualidad-home" ? "actualidad" : current);
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("eucaten-lenis-scroll", onScroll);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("eucaten-lenis-scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const fullText = siteContent.hero.eyebrow;
    const search = new URLSearchParams(window.location.search);
    const forceMotion = search.get("motion") === "1";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches && !forceMotion;

    if (reduceMotion) {
      setTypedEyebrow(fullText);
      setHeroTypingDone(true);
      setHeroStage(3);
      setHeroLogoReady(true);
      return;
    }

    let index = 0;
    let typingInterval = 0;
    const timers: number[] = [];

    const finishSequence = () => {
      setHeroTypingDone(true);
      setHeroLogoReady(true);
      timers.push(window.setTimeout(() => setHeroStage(1), 220));
      timers.push(window.setTimeout(() => setHeroStage(2), 620));
      timers.push(window.setTimeout(() => setHeroStage(3), 980));
    };

    timers.push(
      window.setTimeout(() => {
        typingInterval = window.setInterval(() => {
          index += 1;
          setTypedEyebrow(fullText.slice(0, index));

          if (index >= fullText.length) {
            window.clearInterval(typingInterval);
            typingInterval = 0;
            finishSequence();
          }
        }, 88);
      }, 320),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      if (typingInterval) window.clearInterval(typingInterval);
    };
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
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
            <Image className="brand-symbol" src="/brand/eucaten-isotipo.png" alt="" width={489} height={475} priority />
            <Image className="brand-wordmark" src="/brand/eucaten-wordmark-cream.png" alt="EUCATEN" width={567} height={80} priority />
          </a>

          <nav className="site-nav desktop-nav" aria-label="Navegación principal">
            {navItems.map((item) => (
              <a className={activeSection === item.id ? "is-active" : ""} href={item.href} key={item.id}>
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
            <div className="hero-copy hero-sequence">
              <p className={`eyebrow hero-typewriter-js${heroTypingDone ? " is-done" : ""}`} aria-label={siteContent.hero.eyebrow}>
                <span aria-hidden="true">{typedEyebrow}</span>
              </p>
              <h1 className={`hero-title-js${heroStage >= 1 ? " is-visible" : ""}`}>{siteContent.hero.title}</h1>
              <p className={`hero-lead hero-lead-js${heroStage >= 2 ? " is-visible" : ""}`}>{siteContent.hero.lead}</p>
              <div className={`hero-actions hero-actions-js${heroStage >= 3 ? " is-visible" : ""}`}>
                <a className="button button-primary" href="#servicios">{siteContent.hero.primaryCta}</a>
                <a className="button button-secondary" href={generalWhatsappHref} target="_blank" rel="noreferrer" aria-label="Contactar a EUCATEN por WhatsApp">
                  <span>{siteContent.hero.secondaryCta}</span><ArrowUpRight />
                </a>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-logo-stage">
                <Image src="/brand/eucaten-isotipo.png" alt="" width={489} height={475} className={`hero-isotipo hero-logo-once${heroLogoReady ? " is-visible" : ""}`} priority sizes="(max-width: 900px) 70vw, 34vw" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="services-section connected-section reveal-section" id="servicios" data-reveal>
        <SectionSignature side="left" />
        <div className="shell services-wrap">
          <header className="services-masthead">
            <div className="services-title-block"><p className="section-kicker">{siteContent.servicesIntro.label}</p><h2>{siteContent.servicesIntro.title}</h2></div>
            <div className="services-intro-block"><p>{siteContent.servicesIntro.body}</p><div className="services-count" aria-hidden="true"><span>08</span><small>áreas de práctica</small></div></div>
          </header>

          <div className="services-stage">
            <div className="services-side-rail" aria-hidden="true"><span>LEGAL</span><span>REGULATORY</span><span>COMPLIANCE</span></div>
            <div className="services-card" role="list">
              {siteContent.services.map((service, index) => {
                const isOpen = openIndex === index;
                const buttonId = `${idPrefix}-service-${index}-button`;
                const panelId = `${idPrefix}-service-${index}-panel`;
                return (
                  <article className={`service-item${isOpen ? " is-open" : ""}`} key={service.number} role="listitem">
                    <button id={buttonId} className="service-trigger" type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpenIndex(isOpen ? null : index)}>
                      <span className="service-number">{service.number}</span><span className="service-title">{service.title}</span><span className="service-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                    </button>
                    <div id={panelId} className={`service-panel${isOpen ? " is-open" : ""}`} role="region" aria-labelledby={buttonId} aria-hidden={!isOpen}>
                      <div className="service-panel-inner">
                        <p>{service.body}</p>
                        <a className="service-contact-link" href={whatsappHref(`Hola, quisiera consultar por el servicio: ${service.title}.`)} target="_blank" rel="noreferrer" aria-label={`Consultar por ${service.title} mediante WhatsApp`} tabIndex={isOpen ? 0 : -1}>
                          <span>Consultar por este servicio</span><ArrowUpRight />
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

      <section className="accompaniment-section connected-section reveal-section" id="acompanamiento" data-reveal>
        <SectionSignature side="right" />
        <div className="shell accompaniment-shell">
          <header className="accompaniment-intro">
            <p className="section-kicker">{siteContent.accompaniment.label}</p>
            <h2>{siteContent.accompaniment.title}</h2>
          </header>

          <div className="accompaniment-differential">
            <span className="differential-mark" aria-hidden="true">∞</span>
            <p>{siteContent.accompaniment.lead}</p>
          </div>

          <div className="accompaniment-map" aria-label="Etapas de acompañamiento">
            <JourneyLines />
            {siteContent.accompaniment.moments.map((moment, index) => (
              <article className={`accompaniment-point point-${index + 1}`} key={moment.number}>
                <span className="accompaniment-number" aria-hidden="true">{moment.number}</span>
                <div className="accompaniment-point-copy"><h3>{moment.title}</h3><p>{moment.body}</p></div>
              </article>
            ))}
          </div>

          <p className="accompaniment-note">{siteContent.accompaniment.note}</p>
        </div>
      </section>

      <section className="team-section connected-section reveal-section" id="nosotras" data-reveal>
        <SectionSignature side="left" />
        <div className="shell team-heading">
          <div><p className="section-kicker">{siteContent.team.label}</p><span className="team-heading-index">02 / perfiles</span></div>
          <h2>{siteContent.team.title}</h2>
        </div>

        <div className="shell team-list">
          {siteContent.team.people.map((person, index) => (
            <article className={`team-profile team-profile-${index + 1}`} key={person.name}>
              <div className="team-photo-wrap">
                <Image src={person.image} alt={`Retrato de ${person.name}`} width={person.imageWidth} height={person.imageHeight} className="team-photo" sizes="(max-width: 768px) 100vw, 48vw" />
                <span className="team-photo-number" aria-hidden="true">{person.number}</span>
              </div>
              <div className="team-copy-panel">
                <span className="team-watermark" aria-hidden="true">{person.number}</span>
                <p className="team-role">{person.role}</p>
                <h3>{person.name}</h3>
                <div className="team-bio">{person.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="updates-section connected-section reveal-section" id="actualidad-home" data-reveal>
        <SectionSignature side="right" />
        <div className="shell updates-shell">
          <div className="updates-copy">
            <p className="section-kicker">{siteContent.updates.label}</p>
            <h2>{siteContent.updates.title}</h2>
            <p>{siteContent.updates.body}</p>
          </div>
          <a className="updates-card" href="/actualidad">
            <span className="updates-card-index">EUCATEN / ACTUALIDAD</span>
            <strong>{siteContent.updates.emptyTitle}</strong>
            <span>{siteContent.updates.emptyBody}</span>
            <span className="updates-card-cta">{siteContent.updates.cta} <ArrowUpRight /></span>
          </a>
        </div>
      </section>

      <section className="contact-section connected-section reveal-section" id="contacto" data-reveal>
        <SectionSignature side="left" />
        <div className="shell contact-topline" aria-hidden="true">
          <span>{siteContent.contact.label}</span>
        </div>
        <div className="shell contact-shell">
          <div className="contact-brand-visual" aria-hidden="true">
            <Image src="/brand/eucaten-isotipo.png" alt="" width={489} height={475} className="contact-isotipo hero-isotipo-motion" sizes="(max-width: 760px) 42vw, 16vw" />
          </div>
          <div className="contact-copy">
            <h2>{siteContent.contact.title}</h2>
            <p>{siteContent.contact.lead}</p>
          </div>
          <a className="contact-call" href={generalWhatsappHref} target="_blank" rel="noreferrer" aria-label="Contactar a EUCATEN por WhatsApp">
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
          <nav className="footer-nav" aria-label="Navegación del pie">{siteContent.footer.navigation.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}</nav>
          <a className="footer-phone" href={generalWhatsappHref} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp para contactar a EUCATEN">WhatsApp · {siteContent.brand.phone}</a>
        </div>
      </footer>
    </main>
  );
}
