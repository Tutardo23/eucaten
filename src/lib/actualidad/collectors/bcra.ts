import type { ActualidadCategory } from "../types";
import { suggestActualidadCategories } from "../rules";
import { createActualidadItemIfNew } from "../repository";
import {
  absoluteOfficialUrl,
  extractHeadingText,
  extractParagraphText,
  fetchOfficialHtml,
  htmlToText,
  parseSpanishDateToIso,
} from "./http";

const BCRA_NEWS_URL = "https://www.bcra.gob.ar/noticias/";
const SOURCE_NAME = "Banco Central de la República Argentina";
const MAX_ITEMS_PER_RUN = 20;

const ALLOWED_CATEGORIES = new Set<ActualidadCategory>([
  "Compliance y prevención de lavado de activos",
  "Fintech y medios de pago",
  "Prevención de fraude",
]);

type BCRACandidate = {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
};

export type BCRACollectionResult = {
  source: "bcra";
  checkedAt: string;
  found: number;
  created: number;
  existing: number;
  skipped: number;
  errors: string[];
};

function contextBefore(html: string, index: number, length = 900) {
  return html.slice(Math.max(0, index - length), index);
}

function contextAfter(html: string, index: number, length = 1800) {
  return html.slice(index, Math.min(html.length, index + length));
}

function cleanTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseAnchorCandidate(
  html: string,
  match: RegExpMatchArray,
): BCRACandidate | null {
  const href = match[1] ?? "";
  const anchorHtml = match[2] ?? "";
  const index = match.index ?? 0;

  let url: string;
  try {
    url = absoluteOfficialUrl(href, BCRA_NEWS_URL);
  } catch {
    return null;
  }

  const heading = extractHeadingText(anchorHtml);
  const anchorText = htmlToText(anchorHtml);
  const title = cleanTitle(heading || anchorText);

  if (
    title.length < 10 ||
    title.toLowerCase() === "noticias" ||
    /^(anterior|siguiente|ver m[aá]s)$/i.test(title)
  ) {
    return null;
  }

  const beforeText = htmlToText(contextBefore(html, index));
  const afterHtml = contextAfter(html, index + match[0].length);
  const afterText = htmlToText(afterHtml);

  const publishedAt =
    parseSpanishDateToIso(beforeText.slice(-500)) ??
    parseSpanishDateToIso(anchorText) ??
    parseSpanishDateToIso(afterText.slice(0, 500));

  if (!publishedAt) return null;

  const summary =
    extractParagraphText(anchorHtml) ||
    extractParagraphText(afterHtml) ||
    "";

  return {
    title,
    summary: summary.slice(0, 1200),
    url,
    publishedAt,
  };
}

export function parseBCRANewsList(html: string): BCRACandidate[] {
  const candidates: BCRACandidate[] = [];
  const seen = new Set<string>();

  const anchorPattern =
    /<a\b[^>]*href=["']([^"']*\/noticias\/[^"'?#]+\/?(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const candidate = parseAnchorCandidate(html, match);
    if (!candidate || seen.has(candidate.url)) continue;

    seen.add(candidate.url);
    candidates.push(candidate);

    if (candidates.length >= MAX_ITEMS_PER_RUN) break;
  }

  return candidates;
}

export async function collectBCRANews(): Promise<BCRACollectionResult> {
  const checkedAt = new Date().toISOString();
  const result: BCRACollectionResult = {
    source: "bcra",
    checkedAt,
    found: 0,
    created: 0,
    existing: 0,
    skipped: 0,
    errors: [],
  };

  const { html } = await fetchOfficialHtml(BCRA_NEWS_URL);
  const candidates = parseBCRANewsList(html);
  result.found = candidates.length;

  for (const candidate of candidates) {
    try {
      const categories = suggestActualidadCategories(
        `${candidate.title}. ${candidate.summary}`,
        "bcra",
      ).filter((category) => ALLOWED_CATEGORIES.has(category));

      if (!categories.length) {
        result.skipped += 1;
        continue;
      }

      const stored = await createActualidadItemIfNew({
        title: candidate.title,
        summary: candidate.summary,
        sourceKey: "bcra",
        sourceName: SOURCE_NAME,
        sourceUrl: candidate.url,
        sourceType: "official",
        publishedAt: candidate.publishedAt,
        categories,
      });

      if (stored.created) result.created += 1;
      else result.existing += 1;
    } catch (error) {
      result.skipped += 1;
      result.errors.push(
        `${candidate.title}: ${error instanceof Error ? error.message : "error inesperado"}`,
      );
    }
  }

  return result;
}
