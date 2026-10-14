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

const CNV_NEWS_URL = "https://www.argentina.gob.ar/CNV/noticias";
const SOURCE_NAME = "Comisión Nacional de Valores";
const MAX_ITEMS_PER_RUN = 24;

const ALLOWED_CATEGORIES = new Set<ActualidadCategory>([
  "Compliance y prevención de lavado de activos",
  "Fintech y medios de pago",
  "Prevención de fraude",
  "Integridad corporativa",
]);

type CNVCandidate = {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
};

export type CNVCollectionResult = {
  source: "cnv";
  checkedAt: string;
  found: number;
  created: number;
  existing: number;
  skipped: number;
  errors: string[];
};

function contextBefore(html: string, index: number, length = 1000) {
  return html.slice(Math.max(0, index - length), index);
}

function contextAfter(html: string, index: number, length = 2200) {
  return html.slice(index, Math.min(html.length, index + length));
}

function cleanTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseAnchorCandidate(
  html: string,
  match: RegExpMatchArray,
): CNVCandidate | null {
  const href = match[1] ?? "";
  const anchorHtml = match[2] ?? "";
  const index = match.index ?? 0;

  let url: string;
  try {
    url = absoluteOfficialUrl(href, CNV_NEWS_URL);
  } catch {
    return null;
  }

  const heading = extractHeadingText(anchorHtml);
  const anchorText = htmlToText(anchorHtml);
  let title = cleanTitle(heading);

  if (!title) {
    const withoutDate = anchorText.replace(
      /^\s*\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+20\d{2}\s*/i,
      "",
    );
    title = cleanTitle(withoutDate);
  }

  if (
    title.length < 10 ||
    /^(noticias|ver todo|anterior|siguiente)$/i.test(title)
  ) {
    return null;
  }

  const beforeText = htmlToText(contextBefore(html, index));
  const afterHtml = contextAfter(html, index + match[0].length);
  const afterText = htmlToText(afterHtml);

  const publishedAt =
    parseSpanishDateToIso(anchorText) ??
    parseSpanishDateToIso(beforeText.slice(-600)) ??
    parseSpanishDateToIso(afterText.slice(0, 600));

  if (!publishedAt) return null;

  const summary =
    extractParagraphText(anchorHtml) ||
    extractParagraphText(afterHtml) ||
    "";

  return {
    title: title.slice(0, 220),
    summary: summary.slice(0, 1200),
    url,
    publishedAt,
  };
}

export function parseCNVNewsList(html: string): CNVCandidate[] {
  const candidates: CNVCandidate[] = [];
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

export async function collectCNVNews(): Promise<CNVCollectionResult> {
  const checkedAt = new Date().toISOString();
  const result: CNVCollectionResult = {
    source: "cnv",
    checkedAt,
    found: 0,
    created: 0,
    existing: 0,
    skipped: 0,
    errors: [],
  };

  const { html } = await fetchOfficialHtml(CNV_NEWS_URL);
  const candidates = parseCNVNewsList(html);
  result.found = candidates.length;

  for (const candidate of candidates) {
    try {
      const categories = suggestActualidadCategories(
        `${candidate.title}. ${candidate.summary}`,
        "cnv",
      ).filter((category) => ALLOWED_CATEGORIES.has(category));

      if (!categories.length) {
        result.skipped += 1;
        continue;
      }

      const stored = await createActualidadItemIfNew({
        title: candidate.title,
        summary: candidate.summary,
        sourceKey: "cnv",
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
