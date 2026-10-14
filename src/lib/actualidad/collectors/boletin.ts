import type { ActualidadCategory } from "../types";
import { suggestActualidadCategories } from "../rules";
import { absoluteSourceUrl, fetchOfficialHtml, htmlToText, parseFlexibleDateToIso } from "./http";
import { hasAnyTerm, storeCandidates, type NewsCandidate, type SourceCollectionResult } from "./common";

const BOLETIN_URL = "https://www.boletinoficial.gob.ar/seccion/primera";

const RELEVANT_TERMS = [
  "unidad de informacion financiera", "uif", "banco central de la republica argentina", "bcra",
  "comision nacional de valores", "cnv", "inspeccion general de justicia", "igj",
  "oficina anticorrupcion", "agencia de acceso a la informacion publica", "aaip",
  "lavado de activos", "financiamiento del terrorismo", "beneficiario final", "sujeto obligado",
  "servicios de pago", "proveedor de servicios de pago", "psav", "activos virtuales",
  "fraude", "datos personales", "integridad", "juegos de azar", "apuestas",
];

function categoriesForNotice(text: string): ActualidadCategory[] {
  const categories = new Set<ActualidadCategory>(suggestActualidadCategories(text, "boletin-oficial"));
  const normalized = text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  if (normalized.includes("unidad de informacion financiera") || normalized.includes("uif")) {
    categories.add("Compliance y prevención de lavado de activos");
  }
  if (normalized.includes("banco central") || normalized.includes("bcra") || normalized.includes("comision nacional de valores") || normalized.includes("cnv")) {
    categories.add("Fintech y medios de pago");
  }
  if (normalized.includes("inspeccion general de justicia") || normalized.includes("oficina anticorrupcion") || normalized.includes("agencia de acceso a la informacion publica") || normalized.includes("aaip")) {
    categories.add("Integridad corporativa");
  }

  return [...categories];
}

export async function collectBoletinOficial(): Promise<SourceCollectionResult> {
  const { html } = await fetchOfficialHtml(BOLETIN_URL);
  const pageText = htmlToText(html);
  const editionDate =
    parseFlexibleDateToIso(pageText.match(/(?:Edici[oó]n|Bolet[ií]n Oficial)[^\n]{0,80}/i)?.[0] ?? "") ??
    parseFlexibleDateToIso(pageText.slice(0, 2000));

  if (!editionDate) {
    return {
      source: "boletin-oficial",
      checkedAt: new Date().toISOString(),
      found: 0,
      created: 0,
      existing: 0,
      skipped: 0,
      errors: ["No se pudo verificar la fecha de la edición del Boletín Oficial."],
    };
  }

  const candidates: NewsCandidate[] = [];
  const seen = new Set<string>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']*\/detalleAviso\/primera\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const title = htmlToText(match[2] ?? "").replace(/\s+/g, " ").trim();
    if (title.length < 8) continue;

    // Los "Avisos Oficiales" genéricos del BCRA no describen por sí solos una
    // novedad regulatoria útil para la bandeja editorial.
    if (/\bAviso Oficial\s*$/i.test(title)) continue;

    const searchable = title;
    if (!hasAnyTerm(searchable, RELEVANT_TERMS)) continue;

    let url: string;
    try {
      url = absoluteSourceUrl(match[1] ?? "", BOLETIN_URL);
    } catch {
      continue;
    }

    if (seen.has(url)) continue;
    seen.add(url);

    candidates.push({
      title: title.slice(0, 220),
      summary: "",
      url,
      publishedAt: editionDate,
      categories: categoriesForNotice(searchable),
    });

    if (candidates.length >= 20) break;
  }

  return storeCandidates({
    source: "boletin-oficial",
    sourceName: "Boletín Oficial de la República Argentina",
    sourceType: "official",
    candidates,
    recentDays: 4,
    relevanceTerms: RELEVANT_TERMS,
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Fintech y medios de pago",
      "Juegos de azar",
      "Prevención de fraude",
      "Integridad corporativa",
    ],
    maxItemsToProcess: 12,
  });
}
