"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { siteContent } from "@/content/site";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function sectionProgress(el: HTMLElement | null, viewport: number) {
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const distance = Math.max(1, rect.height - viewport);
  return clamp01(-rect.top / distance);
}

export function EucatenExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const principlesRef = useRef<HTMLElement>(null);
  const areasRef = useRef<HTMLElement>(null);
  const dossierRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.dataset.enhanced = "true";
    let raf = 0;
    let lastY = window.scrollY;
    let velocity = 0;

    const update = () => {
      raf = 0;
      const viewport = window.innerHeight;
      const y = window.scrollY;
      velocity = velocity * 0.82 + (y - lastY) * 0.18;
      lastY = y;

      const heroP = sectionProgress(heroRef.current, viewport);
      const principleP = sectionProgress(principlesRef.current, viewport);
      const areasP = sectionProgress(areasRef.current, viewport);
      const dossierP = sectionProgress(dossierRef.current, viewport);

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewport);
      root.style.setProperty("--page-progress", `${clamp01(y / maxScroll)}`);
      root.style.setProperty("--scroll-velocity", `${Math.max(-80, Math.min(80, velocity))}`);

      root.style.setProperty("--hero-copy-y", `${-68 * heroP}px`);
      root.style.setProperty("--hero-copy-opacity", `${1 - heroP * 0.58}`);
      root.style.setProperty("--hero-brand-scale", `${1 - heroP * 0.08}`);
      root.style.setProperty("--hero-mark-y", `${38 * heroP}px`);
      root.style.setProperty("--hero-mark-scale", `${1 + heroP * 0.12}`);
      root.style.setProperty("--hero-mark-img-y", `${-24 * heroP}px`);
      root.style.setProperty("--hero-mark-img-rot", `${5 * heroP}deg`);
      root.style.setProperty("--hero-halo-scale", `${0.8 + heroP * 0.35}`);
      root.style.setProperty("--label-gold-x", `${26 * heroP}px`);
      root.style.setProperty("--label-navy-x", `${-36 * heroP}px`);
      root.style.setProperty("--label-silver-y", `${-18 * heroP}px`);
      root.style.setProperty("--ribbon-dash", `${0.38 - heroP * 0.35}`);
      root.style.setProperty("--ribbon-gold-x", `${-70 * heroP}px`);
      root.style.setProperty("--ribbon-gold-y", `${45 * heroP}px`);
      root.style.setProperty("--ribbon-gold-r", `${-3 * heroP}deg`);
      root.style.setProperty("--ribbon-navy-x", `${55 * heroP}px`);
      root.style.setProperty("--ribbon-navy-y", `${-20 * heroP}px`);
      root.style.setProperty("--ribbon-navy-r", `${4 * heroP}deg`);
      root.style.setProperty("--ribbon-silver-x", `${-30 * heroP}px`);
      root.style.setProperty("--ribbon-silver-y", `${-40 * heroP}px`);

      const principleScenes = root.querySelectorAll<HTMLElement>("[data-principle-scene]");
      principleScenes.forEach((scene, index) => {
        const start = index / principleScenes.length;
        const end = (index + 1) / principleScenes.length;
        const center = (start + end) / 2;
        const local = clamp01(1 - Math.abs(principleP - center) / (1 / principleScenes.length));
        scene.style.opacity = `${local}`;
        scene.style.setProperty("--scene-bg-opacity", `${0.08 + local * 0.08}`);
        scene.style.transform = `scale(${0.92 + local * 0.08}) translateY(${(1 - local) * 45}px)`;
        scene.dataset.active = local > 0.52 ? "true" : "false";
        const number = scene.querySelector<HTMLElement>(".principle-number");
        const line = scene.querySelector<HTMLElement>(".principle-line");
        const orbit = scene.querySelector<HTMLElement>(".principle-orbit");
        if (number) number.style.transform = `translateX(${(1 - local) * -70}px)`;
        if (line) line.style.width = `${70 + local * 150}px`;
        if (orbit) orbit.style.transform = `rotate(${local * 65}deg) scale(${0.7 + local * 0.3})`;
      });
      root.style.setProperty("--meter-1", `${clamp01(principleP * 3)}`);
      root.style.setProperty("--meter-2", `${clamp01((principleP - 1 / 3) * 3)}`);
      root.style.setProperty("--meter-3", `${clamp01((principleP - 2 / 3) * 3)}`);

      root.style.setProperty("--areas-x", `${-areasP * 3 * window.innerWidth}px`);
      const cards = root.querySelectorAll<HTMLElement>("[data-area-card]");
      cards.forEach((card, index) => {
        const count = Math.max(1, cards.length - 1);
        const center = index / count;
        const local = clamp01(1 - Math.abs(areasP - center) / 0.34);
        card.style.setProperty("--card-opacity", `${0.35 + local * 0.65}`);
        card.style.setProperty("--card-y", `${(1 - local) * 50}px`);
        card.style.setProperty("--card-rot", `${(1 - local) * 12}deg`);
        card.style.setProperty("--card-scale", `${0.85 + local * 0.15}`);
      });

      root.style.setProperty("--doc-back-x", `${-70 * dossierP}px`);
      root.style.setProperty("--doc-back-y", `${30 * dossierP}px`);
      root.style.setProperty("--doc-back-r", `${-9 - dossierP * 4}deg`);
      root.style.setProperty("--doc-mid-x", `${75 * dossierP}px`);
      root.style.setProperty("--doc-mid-y", `${-25 * dossierP}px`);
      root.style.setProperty("--doc-mid-r", `${7 + dossierP * 5}deg`);
      root.style.setProperty("--doc-front-y", `${-50 * dossierP}px`);
      root.style.setProperty("--doc-front-r", `${-1 + dossierP * 2}deg`);
      root.style.setProperty("--dossier-rx", `${-3 * dossierP}deg`);
      root.style.setProperty("--dossier-ry", `${5 * dossierP}deg`);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.setAttribute("data-visible", "true");
        });
      },
      { threshold: 0.16 }
    );
    root.querySelectorAll("[data-reveal]").forEach((node) => revealObserver.observe(node));

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      revealObserver.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>("[data-logo-tilt]");
    if (!target) return;

    const move = (event: PointerEvent) => {
      const rect = target.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      target.style.setProperty("--tilt-x-deg", `${x * 8}deg`);
      target.style.setProperty("--tilt-y-deg", `${y * -7}deg`);
    };
    const leave = () => {
      target.style.setProperty("--tilt-x-deg", "0deg");
      target.style.setProperty("--tilt-y-deg", "0deg");
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerleave", leave);
    return () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerleave", leave);
    };
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    let down = false;
    let startX = 0;
    let startLeft = 0;

    const pointerDown = (event: PointerEvent) => {
      down = true;
      startX = event.clientX;
      startLeft = el.scrollLeft;
      el.setPointerCapture(event.pointerId);
      el.dataset.dragging = "true";
    };
    const pointerMove = (event: PointerEvent) => {
      if (!down) return;
      el.scrollLeft = startLeft - (event.clientX - startX);
    };
    const pointerUp = (event: PointerEvent) => {
      down = false;
      el.dataset.dragging = "false";
      if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    };

    el.addEventListener("pointerdown", pointerDown);
    el.addEventListener("pointermove", pointerMove);
    el.addEventListener("pointerup", pointerUp);
    el.addEventListener("pointercancel", pointerUp);
    return () => {
      el.removeEventListener("pointerdown", pointerDown);
      el.removeEventListener("pointermove", pointerMove);
      el.removeEventListener("pointerup", pointerUp);
      el.removeEventListener("pointercancel", pointerUp);
    };
  }, []);

  return (
    <div ref={rootRef} className="eucaten-site">
      <div className="page-progress" aria-hidden="true"><i /><i /><i /></div>

      <header className="site-header">
        <a href="#inicio" className="brand-lockup" aria-label="EUCATEN, inicio">
          <Image src="/brand/eucaten-isotipo.png" alt="" width={44} height={43} priority />
          <span><strong>{siteContent.brand.name}</strong><small>{siteContent.brand.descriptor}</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {siteContent.navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <a className="header-contact" href="#contacto">Contacto <span>↗</span></a>
        <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((v) => !v)}>
          <span /> <span />
          <em className="sr-only">Abrir menú</em>
        </button>
        <div id="mobile-menu" className="mobile-menu" data-open={menuOpen ? "true" : "false"}>
          {siteContent.navigation.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
          <a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
        </div>
      </header>

      <main>
        <section id="inicio" className="hero" ref={heroRef}>
          <div className="hero-sticky">
            <svg className="hero-ribbons" viewBox="0 0 1200 900" aria-hidden="true">
              <path pathLength="1" className="ribbon-path ribbon-path--gold" d="M-40 590 C190 470 210 210 470 240 C720 270 740 690 1030 610 C1160 572 1200 500 1260 430" />
              <path pathLength="1" className="ribbon-path ribbon-path--navy" d="M-60 330 C180 470 300 420 410 200 C560 -60 830 160 785 410 C750 610 925 760 1280 640" />
              <path pathLength="1" className="ribbon-path ribbon-path--silver" d="M180 -40 C260 190 520 220 505 460 C492 670 630 820 860 750 C1080 680 1080 360 1260 300" />
            </svg>

            <div className="hero-grid shell">
              <div className="hero-copy">
                <p className="eyebrow">{siteContent.hero.eyebrow}</p>
                <div className="hero-brand-word">EUCATEN</div>
                <h1>{siteContent.hero.title}</h1>
                <p className="hero-body">{siteContent.hero.body}</p>
                <div className="hero-actions">
                  <a className="button button--dark" href="#contacto">{siteContent.hero.primaryCta}<span>↗</span></a>
                  <a className="text-link" href="#areas">{siteContent.hero.secondaryCta}<span>↓</span></a>
                </div>
              </div>

              <div className="hero-mark-wrap" data-logo-tilt>
                <div className="hero-mark-halo" />
                <Image className="hero-mark" src="/brand/eucaten-isotipo.png" alt="Isotipo tridimensional de EUCATEN" width={489} height={475} priority />
                <div className="hero-mark-label hero-mark-label--gold"><span>01</span> Prestigio / valor</div>
                <div className="hero-mark-label hero-mark-label--navy"><span>02</span> Rigor / confianza</div>
                <div className="hero-mark-label hero-mark-label--silver"><span>03</span> Ética / claridad</div>
              </div>
            </div>

            <div className="hero-bottom shell">
              <span>{siteContent.brand.descriptor}</span>
              <strong>{siteContent.brand.tagline}</strong>
              <span>Scroll para explorar ↓</span>
            </div>
          </div>
        </section>

        <section className="intro shell" data-reveal>
          <div className="section-index">01 / IDENTIDAD</div>
          <div className="intro-copy">
            <p>La identidad de EUCATEN parte de tres caminos que se entrelazan y avanzan hacia un mismo objetivo.</p>
            <p className="intro-note">[ Acá podés reemplazar esta explicación por una idea propia del estudio sobre cómo se combinan las distintas miradas y especialidades. ]</p>
          </div>
        </section>

        <section id="enfoque" className="principles" ref={principlesRef}>
          <div className="principles-sticky">
            <div className="principles-heading shell">
              <div className="section-index">02 / ENFOQUE</div>
              <p>Una misma identidad.<br />Tres atributos.</p>
            </div>
            <div className="principles-scenes">
              {siteContent.principles.map((item) => (
                <article key={item.number} data-principle-scene className={`principle-scene principle-scene--${item.color}`}>
                  <div className="principle-number">{item.number}</div>
                  <div className="principle-content">
                    <span className="principle-line" />
                    <h2>{item.title}</h2>
                    <p>{item.body}</p>
                  </div>
                  <div className="principle-orbit" aria-hidden="true"><i /><i /><i /></div>
                </article>
              ))}
            </div>
            <div className="principles-meter" aria-hidden="true"><span /><span /><span /></div>
          </div>
        </section>

        <section id="areas" className="areas" ref={areasRef}>
          <div className="areas-sticky">
            <div className="areas-head shell">
              <div><span className="section-index">03 / ÁREAS</span><h2>Qué puede mostrar<br />la página.</h2></div>
              <p>[ Podés cambiar, sacar o sumar áreas. La estructura está pensada para que cada una tenga espacio y personalidad propia. ]</p>
            </div>
            <div className="areas-track">
              {siteContent.areas.map((area, index) => (
                <article key={area.number} className={`area-card area-card--${index + 1}`} data-area-card>
                  <div className="area-card__meta"><span>{area.number}</span><small>{area.kicker}</small></div>
                  <div className="area-card__body">
                    <h3>{area.title}</h3>
                    <p>{area.body}</p>
                    <span className="area-note">{area.note}</span>
                  </div>
                  <div className="area-card__visual" aria-hidden="true"><i /><i /><i /></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dossier shell" ref={dossierRef} data-reveal>
          <div className="dossier-copy">
            <span className="section-index">04 / FORMA DE TRABAJO</span>
            <p className="eyebrow">{siteContent.dossier.kicker}</p>
            <h2>{siteContent.dossier.title}</h2>
            <p>{siteContent.dossier.body}</p>
          </div>
          <div className="dossier-visual" data-tilt-card>
            <div className="document document--back"><span>EUCATEN</span><b>Legal / Compliance</b></div>
            <div className="document document--middle"><small>01</small><h3>[ Diagnóstico / memo / informe ]</h3><p>[ Acá puede verse una pieza real, un resumen ejecutivo o una guía. ]</p></div>
            <div className="document document--front"><span>CONFIDENCIAL</span><h3>[ Título de documento ]</h3><div className="doc-lines"><i/><i/><i/><i/></div><strong>EUCATEN</strong></div>
          </div>
        </section>

        <section className="approach shell" data-reveal>
          <div className="approach-head">
            <span className="section-index">05 / PROCESO</span>
            <h2>[ Acá podés explicar cómo trabajan ]</h2>
          </div>
          <div className="approach-grid">
            {siteContent.approach.map((step) => (
              <article key={step.n}><span>{step.n}</span><h3>{step.title}</h3><p>{step.text}</p></article>
            ))}
          </div>
        </section>

        <section id="perspectivas" className="insights">
          <div className="insights-head shell" data-reveal>
            <div><span className="section-index">06 / PERSPECTIVAS</span><h2>Contenido para que EUCATEN también pueda ser una referencia.</h2></div>
            <p>[ Acá pueden aparecer análisis, novedades regulatorias, guías, preguntas frecuentes o recursos propios. ]</p>
          </div>
          <div className="insights-carousel" ref={carouselRef} aria-label="Perspectivas y contenidos">
            {siteContent.insights.map((item, index) => (
              <article key={index} className={`insight-card insight-card--${(index % 3) + 1}`}>
                <div className="insight-cover"><span>{String(index + 1).padStart(2, "0")}</span><strong>EUCATEN</strong><i /></div>
                <div className="insight-copy"><small>{item.category}</small><h3>{item.title}</h3><p>{item.meta}</p></div>
              </article>
            ))}
            <div className="carousel-spacer" aria-hidden="true" />
          </div>
          <div className="carousel-hint shell">← Arrastrá para explorar →</div>
        </section>

        <section id="nosotros" className="team shell">
          <div className="team-head" data-reveal>
            <span className="section-index">07 / NOSOTROS</span>
            <h2>Tres caminos que se encuentran en una misma firma.</h2>
            <p>[ Acá podés presentar a los tres socios con foto, experiencia, especialidad y un perfil breve. ]</p>
          </div>
          <div className="team-grid">
            {siteContent.team.map((person) => (
              <article key={person.n} className={`person-card person-card--${person.color}`} data-reveal>
                <div className="person-photo"><span>ACÁ VA FOTO</span></div>
                <div className="person-copy"><span>{person.n}</span><h3>{person.name}</h3><p>{person.role}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section id="contacto" className="contact">
          <div className="contact-ribbon" aria-hidden="true"><i/><i/><i/></div>
          <div className="contact-inner shell" data-reveal>
            <span className="section-index">08 / CONTACTO</span>
            <h2>{siteContent.contact.title}</h2>
            <p>{siteContent.contact.body}</p>
            <div className="contact-data"><a href="mailto:contacto@eucaten.com">{siteContent.contact.email}</a><span>{siteContent.contact.phone}</span></div>
          </div>
        </section>
      </main>

      <footer className="site-footer shell">
        <div className="footer-brand"><Image src="/brand/eucaten-isotipo.png" alt="" width={34} height={33}/><span><strong>EUCATEN</strong><small>{siteContent.brand.descriptor}</small></span></div>
        <p>{siteContent.brand.tagline}</p>
        <a href="#inicio">Volver arriba ↑</a>
      </footer>
    </div>
  );
}
