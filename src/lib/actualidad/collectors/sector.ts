import { fetchOfficialHtml } from "./http";
import { parseLinkedCards, storeCandidates, type SourceCollectionResult } from "./common";

const FINTECH_TERMS = [
  "regul", "bcra", "cnv", "uif", "psp", "psav", "activos virtuales",
  "pago", "billetera", "transferencia", "qr", "interoperabilidad", "adquirencia",
  "credito", "open finance", "token", "fraude", "compliance", "lavado",
];

const GAMBLING_REGULATORY_TERMS = [
  "regul", "ley", "proyecto", "resolucion", "licencia", "fiscalizacion", "control",
  "juego ilegal", "apuestas ilegales", "clandestino", "bloqueo", "publicidad",
  "menores", "ludopatia", "juego responsable", "juego problem", "autoexclusion",
  "lavado", "uif", "gafi", "compliance", "prevencion", "sancion", "impuesto",
];

export async function collectCamaraFintechNews(): Promise<SourceCollectionResult> {
  const url = "https://camarafintech.org/blog/";
  const { html } = await fetchOfficialHtml(url);
  const candidates = parseLinkedCards(html, url, {
    maxItems: 24,
    urlMatches: (value) => {
      const parsed = new URL(value);
      return parsed.hostname.endsWith("camarafintech.org") && parsed.pathname !== "/blog/";
    },
    rejectTitles: ["Blog", "Leer más", "Ver más"],
  });

  return storeCandidates({
    source: "camara-fintech",
    sourceName: "Cámara Argentina Fintech",
    sourceType: "specialized_media",
    candidates,
    recentDays: 150,
    relevanceTerms: FINTECH_TERMS,
    defaultCategories: ["Fintech y medios de pago"],
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Fintech y medios de pago",
      "Prevención de fraude",
      "Integridad corporativa",
    ],
    maxItemsToProcess: 10,
  });
}

export async function collectALEANews(): Promise<SourceCollectionResult> {
  const url = "https://www.alea.org.ar/noticias";
  const { html } = await fetchOfficialHtml(url);
  const candidates = parseLinkedCards(html, url, {
    maxItems: 24,
    urlMatches: (value) => new URL(value).hostname.endsWith("alea.org.ar") && value !== url,
    rejectTitles: ["Noticias", "Ver más"],
  });

  return storeCandidates({
    source: "alea",
    sourceName: "ALEA",
    sourceType: "specialized_media",
    candidates,
    recentDays: 120,
    relevanceTerms: GAMBLING_REGULATORY_TERMS,
    defaultCategories: ["Juegos de azar"],
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Juegos de azar",
      "Prevención de fraude",
      "Integridad corporativa",
    ],
    maxItemsToProcess: 10,
  });
}

export async function collectIPLyCBANews(): Promise<SourceCollectionResult> {
  const url = "https://loteria.gba.gob.ar/institucional/noticias";
  const { html } = await fetchOfficialHtml(url);
  const candidates = parseLinkedCards(html, url, {
    maxItems: 24,
    urlMatches: (value) => new URL(value).hostname.endsWith("loteria.gba.gob.ar") && value !== url,
    rejectTitles: ["Noticias", "Ver más"],
  });

  return storeCandidates({
    source: "iplyc-ba",
    sourceName: "Instituto Provincial de Lotería y Casinos de Buenos Aires",
    sourceType: "official",
    candidates,
    recentDays: 90,
    relevanceTerms: GAMBLING_REGULATORY_TERMS,
    defaultCategories: ["Juegos de azar"],
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Juegos de azar",
      "Prevención de fraude",
    ],
    maxItemsToProcess: 10,
  });
}

export async function collectLOTBANews(): Promise<SourceCollectionResult> {
  const url = "https://www.loteriadelaciudad.gob.ar/juegos/";
  const { html } = await fetchOfficialHtml(url);
  const candidates = parseLinkedCards(html, url, {
    maxItems: 28,
    urlMatches: (value) => {
      const parsed = new URL(value);
      return parsed.hostname.endsWith("loteriadelaciudad.gob.ar") && value !== url;
    },
    rejectTitles: ["Juegos", "Noticias", "Ver más"],
  });

  return storeCandidates({
    source: "lotba",
    sourceName: "Lotería de la Ciudad de Buenos Aires (LOTBA)",
    sourceType: "official",
    candidates,
    recentDays: 120,
    relevanceTerms: GAMBLING_REGULATORY_TERMS,
    defaultCategories: ["Juegos de azar"],
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Juegos de azar",
      "Prevención de fraude",
    ],
    maxItemsToProcess: 10,
  });
}
