import type { ActualidadJurisprudence } from "../types";
import { fetchOfficialHtml, htmlToText } from "./http";
import { hasAnyTerm, parseLinkedCards, storeCandidates, type NewsCandidate, type SourceCollectionResult } from "./common";

const FISCALES_URL = "https://www.fiscales.gob.ar/ciberdelincuencia/";
const RELEVANCE_TERMS = [
  "fraude", "estafa", "defraudacion", "phishing", "suplantacion", "ingenieria social",
  "lavado", "activos virtuales", "cripto", "billetera", "plataforma", "ciberdelincuencia",
  "juego ilegal", "apuestas ilegales",
];

function firstUsefulParagraph(html: string) {
  for (const match of html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = htmlToText(match[1] ?? "").replace(/\s+/g, " ").trim();
    if (text.length >= 70 && !/^foto:/i.test(text)) return text.slice(0, 1200);
  }
  return "";
}

function unverifiedJurisprudence(text: string): ActualidadJurisprudence | undefined {
  if (!/(sentencia|fallo|tribunal|juzgado|c[aá]mara|casaci[oó]n|condena|condenad|juicio)/i.test(text)) {
    return undefined;
  }

  const court = text.match(/((?:Tribunal|Juzgado|C[aá]mara)[^.\n]{4,120})/i)?.[1]?.trim();

  return {
    court,
    judgmentVerified: false,
  };
}

export async function collectFiscalesNews(): Promise<SourceCollectionResult> {
  const { html } = await fetchOfficialHtml(FISCALES_URL);
  const list = parseLinkedCards(html, FISCALES_URL, {
    maxItems: 18,
    urlMatches: (value) => {
      const parsed = new URL(value);
      return parsed.hostname.endsWith("fiscales.gob.ar") && parsed.pathname.includes("/ciberdelincuencia/") && value !== FISCALES_URL;
    },
    rejectTitles: ["Ciberdelincuencia", "Ver más"],
  }).filter((candidate) => hasAnyTerm(`${candidate.title}. ${candidate.summary}`, RELEVANCE_TERMS));

  const detailed = await Promise.all(
    list.slice(0, 8).map(async (candidate): Promise<NewsCandidate> => {
      try {
        const detail = await fetchOfficialHtml(candidate.url);
        const text = htmlToText(detail.html);
        const title = htmlToText(detail.html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || candidate.title;
        const summary = firstUsefulParagraph(detail.html) || candidate.summary;
        return {
          title: title.slice(0, 220),
          summary,
          url: candidate.url,
          // Conservamos la fecha de la tarjeta/listado oficial. No inferimos la fecha
          // de una sentencia a partir de la fecha de publicación periodística.
          publishedAt: candidate.publishedAt,
          jurisprudence: unverifiedJurisprudence(`${title}. ${summary}. ${text.slice(0, 5000)}`),
        };
      } catch {
        return candidate;
      }
    }),
  );

  return storeCandidates({
    source: "fiscales",
    sourceName: "Ministerio Público Fiscal / Fiscales.gob.ar",
    sourceType: "official",
    candidates: detailed,
    recentDays: 90,
    relevanceTerms: RELEVANCE_TERMS,
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Fintech y medios de pago",
      "Juegos de azar",
      "Prevención de fraude",
      "Jurisprudencia y litigios",
    ],
    maxItemsToProcess: 8,
  });
}
