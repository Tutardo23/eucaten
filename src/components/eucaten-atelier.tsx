"use client";

import { EucatenHome } from "@/components/eucaten-home";

/**
 * Compatibilidad con variantes antiguas del proyecto.
 *
 * La versión "atelier" dependía de una estructura vieja de siteContent
 * (journey, hero.signals, services[].short, brand.tagline, etc.).
 * La home vigente vive en EucatenHome y usa el schema actual de site.ts.
 */
export function EucatenAtelier() {
  return <EucatenHome />;
}

export default EucatenAtelier;
