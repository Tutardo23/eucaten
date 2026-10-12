const ALLOWED_OFFICIAL_HOSTS = new Set([
  "argentina.gob.ar",
  "www.argentina.gob.ar",
  "boletinoficial.gob.ar",
  "www.boletinoficial.gob.ar",
]);

export function assertAllowedOfficialUrl(value: string) {
  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new Error("La fuente oficial debe usar HTTPS.");
  }

  if (!ALLOWED_OFFICIAL_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Host oficial no permitido: ${url.hostname}`);
  }

  return url;
}

export async function fetchOfficialHtml(value: string, timeoutMs = 15_000) {
  const url = assertAllowedOfficialUrl(value);

  const response = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "es-AR,es;q=0.9",
      "User-Agent": "EUCATEN-Actualidad/1.0 (+https://eucaten.vercel.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`La fuente respondió HTTP ${response.status}.`);
  }

  assertAllowedOfficialUrl(response.url);

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error("La fuente no devolvió HTML.");
  }

  const html = await response.text();
  if (!html.trim()) throw new Error("La fuente devolvió contenido vacío.");

  return { html, finalUrl: response.url };
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
    .replace(/<(?:br|\/p|\/li|\/h[1-6])\b[^>]*>/gi, "\n")
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

export function absoluteOfficialUrl(href: string, base: string) {
  const resolved = new URL(href, base).toString();
  assertAllowedOfficialUrl(resolved);
  return resolved;
}
