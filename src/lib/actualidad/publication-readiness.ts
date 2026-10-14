import type { ActualidadItem } from "./types";

export type PublicationReadiness = {
  ready: boolean;
  blockers: string[];
  warnings: string[];
};

export function evaluatePublicationReadiness(
  item: ActualidadItem,
): PublicationReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (item.title.trim().length < 12) {
    blockers.push("Revisar el título.");
  }

  if (item.summary.trim().length < 40) {
    blockers.push("Agregar una descripción breve antes de publicar.");
  }

  if (!item.categories.length) {
    blockers.push("Asignar al menos una categoría.");
  }

  try {
    const url = new URL(item.sourceUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      blockers.push("Revisar el enlace de la fuente original.");
    }
  } catch {
    blockers.push("Revisar el enlace de la fuente original.");
  }

  const publishedAt = new Date(item.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) {
    blockers.push("Revisar la fecha de la publicación.");
  } else if (publishedAt.getTime() > Date.now() + 86_400_000) {
    blockers.push("La fecha de la fuente figura en el futuro.");
  }

  if (item.jurisprudence && !item.jurisprudence.judgmentVerified) {
    warnings.push(
      "Es una alerta jurisprudencial: el fallo original todavía no fue verificado.",
    );
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  };
}
