"use client";

import { useEffect, useMemo, useState } from "react";

export default function MotionTestPage() {
  const [lenisReady, setLenisReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [scroll, setScroll] = useState(0);
  const [velocity, setVelocity] = useState(0);

  const status = useMemo(() => (lenisReady ? "ACTIVO" : "ESPERANDO"), [lenisReady]);

  useEffect(() => {
    const html = document.documentElement;
    const refresh = () => {
      setLenisReady(html.dataset.eucatenLenis === "ready");
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };

    const onReady = () => refresh();
    const onScroll = (event: Event) => {
      const detail = (event as CustomEvent<{ scroll?: number; velocity?: number }>).detail;
      setScroll(detail?.scroll ?? Math.round(window.scrollY));
      setVelocity(detail?.velocity ?? 0);
    };

    refresh();
    window.addEventListener("eucaten-lenis-ready", onReady);
    window.addEventListener("eucaten-lenis-scroll", onScroll);

    return () => {
      window.removeEventListener("eucaten-lenis-ready", onReady);
      window.removeEventListener("eucaten-lenis-scroll", onScroll);
    };
  }, []);

  return (
    <main className="motion-test-page">
      <aside className="motion-test-status" aria-live="polite">
        <strong>Prueba de movimiento</strong>
        <span>Lenis: <b>{status}</b></span>
        <span>Reduced motion del sistema: <b>{reducedMotion === null ? "…" : reducedMotion ? "SÍ" : "NO"}</b></span>
        <span>Scroll: <b>{scroll}px</b></span>
        <span>Velocidad: <b>{velocity}</b></span>
      </aside>

      <section className="motion-test-hero">
        <p className="motion-test-type">EUCATEN · prueba visual</p>
        <h1>Si esta página se desplaza con inercia, Lenis está funcionando.</h1>
        <p>Use la rueda del mouse varias veces. El indicador de velocidad debe cambiar y el desplazamiento debe desacelerar progresivamente.</p>
        <a href="#prueba-2">Probar ancla</a>
      </section>

      <section className="motion-test-panel"><span>01</span><h2>Desplácese hacia abajo</h2></section>
      <section className="motion-test-panel motion-test-panel-alt" id="prueba-2"><span>02</span><h2>El salto a esta sección también debe ser suave</h2></section>
      <section className="motion-test-panel"><span>03</span><h2>Fin de la prueba</h2><a href="/?motion=1">Abrir la home forzando animaciones</a></section>
    </main>
  );
}
