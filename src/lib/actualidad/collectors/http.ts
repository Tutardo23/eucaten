const TRUSTED_SOURCE_HOSTS = new Set([
  "argentina.gob.ar",
  "www.argentina.gob.ar",
  "boletinoficial.gob.ar",
  "www.boletinoficial.gob.ar",
  "nuevaweb.boletinoficial.gob.ar",
  "bcra.gob.ar",
  "www.bcra.gob.ar",
  "fatf-gafi.org",
  "www.fatf-gafi.org",
  "gafilat.org",
  "www.gafilat.org",
  "camarafintech.org",
  "www.camarafintech.org",
  "iproup.com",
  "www.iproup.com",
  "fiscales.gob.ar",
  "www.fiscales.gob.ar",
  "alea.org.ar",
  "www.alea.org.ar",
  "loteria.gba.gob.ar",
  "www.loteria.gba.gob.ar",
  "loteriadelaciudad.gob.ar",
  "www.loteriadelaciudad.gob.ar",
  "lotba.loteriadelaciudad.gob.ar",
  "yogonet.com",
  "www.yogonet.com",
  "g-mnews.com",
  "www.g-mnews.com",
  "sbcnoticias.com",
  "www.sbcnoticias.com",
  "eljuegolegal.com",
  "www.eljuegolegal.com",
  "csjn.gov.ar",
  "www.csjn.gov.ar",
  "sjconsulta.csjn.gov.ar",
  "sjservicios.csjn.gov.ar",
]);

export function assertAllowedSourceUrl(value: string) {
  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new Error("La fuente debe usar HTTPS.");
  }

  if (!TRUSTED_SOURCE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Host no permitido para Actualidad: ${url.hostname}`);
  }

  return url;
}

export const assertAllowedOfficialUrl = assertAllowedSourceUrl;

export async function fetchSourceText(value: string, timeoutMs = 10_000) {
  const url = assertAllowedSourceUrl(value);

  const response = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml,text/xml,application/rss+xml;q=0.9,*/*;q=0.5",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.7",
      "User-Agent": "EUCATEN-Actualidad/1.0 (+https://eucaten.vercel.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`La fuente respondió HTTP ${response.status}.`);
  }

  assertAllowedSourceUrl(response.url);

  const text = await response.text();
  if (!text.trim()) throw new Error("La fuente devolvió contenido vacío.");

  return {
    text,
    finalUrl: response.url,
    contentType: response.headers.get("content-type") ?? "",
  };
}

export async function fetchOfficialHtml(value: string, timeoutMs = 10_000) {
  const response = await fetchSourceText(value, timeoutMs);
  const contentType = response.contentType.toLowerCase();

  if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error("La fuente no devolvió HTML.");
  }

  return { html: response.text, finalUrl: response.finalUrl };
}

function decodeNumericEntity(match: string, hex: string | undefined, value: string) {
  const codePoint = Number.parseInt(value, hex ? 16 : 10);
  if (!Number.isFinite(codePoint)) return match;

  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return match;
  }
}

export function htmlToText(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<(?:br|\/p|\/li|\/h[1-6]|\/div|\/article|\/time)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(x)?([0-9a-f]+);/gi, decodeNumericEntity)
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function absoluteSourceUrl(href: string, base: string) {
  const resolved = new URL(href, base).toString();
  assertAllowedSourceUrl(resolved);
  return resolved;
}

export const absoluteOfficialUrl = absoluteSourceUrl;

const SPANISH_MONTHS: Record<string, string> = {
  enero: "01", ene: "01",
  febrero: "02", feb: "02",
  marzo: "03", mar: "03",
  abril: "04", abr: "04",
  mayo: "05", may: "05",
  junio: "06", jun: "06",
  julio: "07", jul: "07",
  agosto: "08", ago: "08",
  septiembre: "09", setiembre: "09", sep: "09", sept: "09",
  octubre: "10", oct: "10",
  noviembre: "11", nov: "11",
  diciembre: "12", dic: "12",
};

const ENGLISH_MONTHS: Record<string, string> = {
  january: "01", jan: "01",
  february: "02", feb: "02",
  march: "03", mar: "03",
  april: "04", apr: "04",
  may: "05",
  june: "06", jun: "06",
  july: "07", jul: "07",
  august: "08", aug: "08",
  september: "09", sep: "09", sept: "09",
  october: "10", oct: "10",
  november: "11", nov: "11",
  december: "12", dec: "12",
};

function normalizeDateText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function isoFromParts(year: string | number, month: string | number, day: string | number) {
  const y = String(year);
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const parsed = new Date(`${y}-${m}-${d}T12:00:00-03:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function parseFlexibleDateToIso(value: string, fallbackYear = new Date().getFullYear()) {
  const normalized = normalizeDateText(value);

  let match = normalized.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (match) return isoFromParts(match[1], match[2], match[3]);

  match = normalized.match(/\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b/);
  if (match) return isoFromParts(match[3], match[2], match[1]);

  match = normalized.match(/\b(\d{1,2})(?:\s+(?:al|y)\s+\d{1,2})?\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(20\d{2})|,?\s+(20\d{2}))?\b/);
  if (match) return isoFromParts(match[3] ?? match[4] ?? fallbackYear, SPANISH_MONTHS[match[2]], match[1]);

  match = normalized.match(/\b(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|sept|oct|nov|dic)(?:\s+(20\d{2}))?\b/);
  if (match) return isoFromParts(match[3] ?? fallbackYear, SPANISH_MONTHS[match[2]], match[1]);

  match = normalized.match(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|sept|oct|nov|dic)\s+(\d{1,2}),?\s+(20\d{2})\b/);
  if (match) return isoFromParts(match[3], SPANISH_MONTHS[match[1]], match[2]);

  match = normalized.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december),?\s+(20\d{2})\b/);
  if (match) return isoFromParts(match[3], ENGLISH_MONTHS[match[2]], match[1]);

  match = normalized.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(20\d{2})\b/);
  if (match) return isoFromParts(match[3], ENGLISH_MONTHS[match[1]], match[2]);

  return null;
}

export function extractHeadingText(value: string) {
  const match = value.match(/<h[1-5]\b[^>]*>([\s\S]*?)<\/h[1-5]>/i);
  return match ? htmlToText(match[1]) : "";
}

export function extractParagraphText(value: string) {
  const matches = value.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);

  for (const match of matches) {
    const text = htmlToText(match[1] ?? "");
    if (text.length >= 25) return text;
  }

  return "";
}

// Compatibilidad con los conectores BCRA/CNV incorporados en la etapa anterior.
export const parseSpanishDateToIso = parseFlexibleDateToIso;
