import { fetchOfficialHtml } from "./http";
import { parseLinkedCards, storeCandidates, type SourceCollectionResult } from "./common";

const FATF_URL = "https://www.fatf-gafi.org/en/the-fatf/news.html";
const GAFILAT_URL = "https://gafilat.org/index.php/es/noticias";

const INTERNATIONAL_RELEVANCE = [
  "money laundering", "terrorist financing", "proliferation financing", "aml", "cft",
  "fatf standards", "recommendation", "mutual evaluation", "follow-up", "grey list",
  "high-risk", "monitoring", "virtual asset", "vasp", "beneficial ownership",
  "risk-based", "gaming", "gambling", "fraud", "sanction", "plenary",
  "lavado", "financiamiento del terrorismo", "evaluacion mutua", "seguimiento",
  "activos virtuales", "beneficiario final", "riesgo", "recomendacion", "estandares",
  "recuperacion de activos", "recuperación de activos", "decomiso", "inteligencia financiera",
];

export async function collectGAFINews(): Promise<SourceCollectionResult> {
  const { html } = await fetchOfficialHtml(FATF_URL);
  const candidates = parseLinkedCards(html, FATF_URL, {
    maxItems: 24,
    urlMatches: (url) => {
      const parsed = new URL(url);
      return parsed.hostname.endsWith("fatf-gafi.org") && parsed.pathname !== "/en/the-fatf/news.html";
    },
    rejectTitles: ["News", "All publications", "More news"],
  });

  return storeCandidates({
    source: "gafi",
    sourceName: "GAFI / FATF",
    sourceType: "international_organization",
    candidates,
    recentDays: 180,
    relevanceTerms: INTERNATIONAL_RELEVANCE,
    defaultCategories: ["Compliance y prevención de lavado de activos"],
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Fintech y medios de pago",
      "Juegos de azar",
      "Prevención de fraude",
    ],
    maxItemsToProcess: 12,
  });
}

export async function collectGAFILATNews(): Promise<SourceCollectionResult> {
  const { html } = await fetchOfficialHtml(GAFILAT_URL);
  const candidates = parseLinkedCards(html, GAFILAT_URL, {
    maxItems: 24,
    urlMatches: (url) => {
      const parsed = new URL(url);
      return parsed.hostname.endsWith("gafilat.org") && url !== GAFILAT_URL;
    },
    rejectTitles: ["Noticias", "GAFILAT"],
  });

  return storeCandidates({
    source: "gafilat",
    sourceName: "GAFILAT",
    sourceType: "international_organization",
    candidates,
    recentDays: 180,
    relevanceTerms: INTERNATIONAL_RELEVANCE,
    defaultCategories: ["Compliance y prevención de lavado de activos"],
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Fintech y medios de pago",
      "Juegos de azar",
      "Prevención de fraude",
    ],
    maxItemsToProcess: 12,
  });
}
