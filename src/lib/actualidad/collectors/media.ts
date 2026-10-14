import { absoluteSourceUrl, fetchOfficialHtml, fetchSourceText, htmlToText, parseFlexibleDateToIso } from "./http";
import { parseLinkedCards, storeCandidates, type NewsCandidate, type SourceCollectionResult } from "./common";

const FINTECH_MEDIA_TERMS = [
  "bcra", "cnv", "uif", "regul", "norma", "psp", "psav",
  "activos virtuales", "billetera", "pagos", "transferencia", "qr", "fraude",
  "estafa", "phishing", "lavado", "compliance", "ciberseguridad", "open finance",
  "proteccion de datos", "protección de datos",
];

const GAMBLING_MEDIA_TERMS = [
  "regul", "ley", "proyecto", "licencia", "ilegal", "clandestino", "bloqueo",
  "publicidad", "menores", "juego responsable", "ludopatia", "impuesto", "sancion",
  "compliance", "lavado", "uif", "gafi", "fraude", "autenticacion biometrica",
];

function xmlValue(block: string, tag: string) {
  const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(pattern);
  if (!match) return "";
  return htmlToText(match[1].replace(/^<!\[CDATA\[|\]\]>$/g, ""));
}

function parseRSS(xml: string, baseUrl: string, maxItems = 20): NewsCandidate[] {
  const items: NewsCandidate[] = [];
  const seen = new Set<string>();

  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = match[1] ?? "";
    const title = xmlValue(block, "title").trim();
    const linkRaw = xmlValue(block, "link").trim();
    const summary = xmlValue(block, "description").trim().slice(0, 1200);
    const dateRaw = xmlValue(block, "pubDate").trim() || xmlValue(block, "date").trim();

    if (!title || !linkRaw || !dateRaw) continue;

    let url: string;
    try {
      url = absoluteSourceUrl(linkRaw, baseUrl);
    } catch {
      continue;
    }

    if (seen.has(url)) continue;

    const native = new Date(dateRaw);
    const publishedAt = !Number.isNaN(native.getTime())
      ? native.toISOString()
      : parseFlexibleDateToIso(dateRaw);

    if (!publishedAt) continue;

    seen.add(url);
    items.push({ title: title.slice(0, 220), summary, url, publishedAt });
    if (items.length >= maxItems) break;
  }

  return items;
}

export async function collectIProUPNews(): Promise<SourceCollectionResult> {
  const feeds = [
    "https://www.iproup.com/rss/finanzas",
    "https://www.iproup.com/rss/economia-digital",
  ] as const;

  const responses = await Promise.all(feeds.map((feed) => fetchSourceText(feed)));
  const seen = new Set<string>();
  const candidates: NewsCandidate[] = [];

  for (let index = 0; index < responses.length; index += 1) {
    for (const candidate of parseRSS(responses[index].text, feeds[index], 16)) {
      if (seen.has(candidate.url)) continue;
      seen.add(candidate.url);
      candidates.push(candidate);
    }
  }

  candidates.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return storeCandidates({
    source: "iproup",
    sourceName: "iProUP",
    sourceType: "specialized_media",
    candidates,
    recentDays: 30,
    relevanceTerms: FINTECH_MEDIA_TERMS,
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Fintech y medios de pago",
      "Prevención de fraude",
      "Integridad corporativa",
    ],
    maxItemsToProcess: 10,
  });
}

async function collectGamblingMedia(config: {
  source: "yogonet" | "gm-news" | "sbc-noticias";
  sourceName: string;
  url: string;
  recentDays: number;
  maxItems: number;
  requireArgentina?: boolean;
}): Promise<SourceCollectionResult> {
  const { html } = await fetchOfficialHtml(config.url);
  let candidates = parseLinkedCards(html, config.url, {
    maxItems: 36,
    urlMatches: (value) => {
      const parsed = new URL(value);
      return value !== config.url && !parsed.pathname.includes("/tag/") && !parsed.pathname.includes("/author/");
    },
    rejectTitles: ["Argentina", "Noticias", "Leer más", "Ver más", "Cargar Más"],
  });

  if (config.requireArgentina) {
    candidates = candidates.filter((candidate) =>
      /\bargentina\b|buenos aires|caba|mendoza|salta|c[oó]rdoba|tucum[aá]n|santa fe|chaco|misiones|neuqu[eé]n|r[ií]o negro|san juan|la pampa/i.test(
        `${candidate.title}. ${candidate.summary}`,
      ),
    );
  }

  return storeCandidates({
    source: config.source,
    sourceName: config.sourceName,
    sourceType: "specialized_media",
    candidates,
    recentDays: config.recentDays,
    relevanceTerms: GAMBLING_MEDIA_TERMS,
    defaultCategories: ["Juegos de azar"],
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Juegos de azar",
      "Prevención de fraude",
      "Integridad corporativa",
      "Jurisprudencia y litigios",
    ],
    maxItemsToProcess: config.maxItems,
  });
}

export function collectYogonetNews() {
  return collectGamblingMedia({
    source: "yogonet",
    sourceName: "Yogonet Latinoamérica",
    url: "https://www.yogonet.com/latinoamerica/paises/5-argentina",
    recentDays: 35,
    maxItems: 10,
  });
}

export function collectGMNews() {
  return collectGamblingMedia({
    source: "gm-news",
    sourceName: "G&M News",
    url: "https://g-mnews.com/es/",
    recentDays: 45,
    maxItems: 8,
    requireArgentina: true,
  });
}

export function collectSBCNoticias() {
  return collectGamblingMedia({
    source: "sbc-noticias",
    sourceName: "SBC Noticias",
    url: "https://sbcnoticias.com/category/region/argentina/",
    recentDays: 45,
    maxItems: 10,
  });
}
