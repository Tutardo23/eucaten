"use client";

import Lenis from "lenis";
import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const forceMotion = search.get("motion") === "1" || window.location.pathname === "/motion-test";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.documentElement.dataset.eucatenMotionPreference = reducedMotion ? "reduce" : "full";
    document.documentElement.dataset.eucatenMotionForced = forceMotion ? "true" : "false";

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1,
      syncTouch: false,
      autoRaf: true,
      respectReducedMotion: forceMotion ? false : true,
    });

    document.documentElement.dataset.eucatenLenis = "ready";

    const notify = (event: { animatedScroll?: number; velocity?: number }) => {
      const detail = {
        scroll: Math.round(event.animatedScroll ?? window.scrollY),
        velocity: Number((event.velocity ?? 0).toFixed(3)),
      };
      window.dispatchEvent(new CustomEvent("eucaten-lenis-scroll", { detail }));
    };

    lenis.on("scroll", notify);

    const onAnchorClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const destination = document.querySelector<HTMLElement>(href);
      if (!destination) return;

      event.preventDefault();
      lenis.scrollTo(destination, {
        offset: -76,
        duration: 1.05,
      });
      window.history.replaceState(null, "", href);
    };

    document.addEventListener("click", onAnchorClick);

    // Initial event lets the diagnostic page know the provider mounted.
    window.dispatchEvent(
      new CustomEvent("eucaten-lenis-ready", {
        detail: { reducedMotion, forceMotion },
      }),
    );

    return () => {
      document.removeEventListener("click", onAnchorClick);
      lenis.off("scroll", notify);
      lenis.destroy();
      delete document.documentElement.dataset.eucatenLenis;
    };
  }, []);

  return null;
}
