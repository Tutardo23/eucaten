import { createActualidadItemIfNew } from "../repository";
import { suggestActualidadCategories } from "../rules";
import type { ActualidadSourceKey } from "../sources";
import type {
  ActualidadCategory,
  ActualidadJurisprudence,
  ActualidadSourceType,
} from "../types";
import {
  absoluteSourceUrl,
  extractHeadingText,
  extractParagraphText,
  htmlToText,
  parseFlexibleDateToIso,
} from "./http";

export type NewsCandidate = {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  categories?: ActualidadCategory[];
  jurisprudence?: ActualidadJurisprudence;
};

export type SourceCollectionResult = {
  source: ActualidadSourceKey;
  checkedAt: string;
  found: number;
  created: number;
  existing: number;
  skipped: number;
  errors: string[];
};

export function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function hasAnyTerm(value: string, terms: readonly string[]) {
  if (!terms.length) return true;
  const normalized = normalizeForMatch(value);
  return terms.some((term) => normalized.includes(normalizeForMatch(term)));
}

export function isWithinDays(isoDate: string, days: number) {
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return false;
  return time >= Date.now() - days * 86_400_000;
}

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripLeadingDate(value: string) {
  return value
    .replace(/^\s*\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+20\d{2}\s*/i, "")
    .replace(/^\s*\d{1,2}[-/]\d{1,2}[-/]20\d{2}\s*/i, "")
    .replace(/^\s*20\d{2}[-/]\d{1,2}[-/]\d{1,2}\s*/i, "")
    .replace(/^\s*[a-záéíóúñ]+\s+\d{1,2},?\s+20\d{2}\s*/i, "")
    .replace(/^\s*\d{1,2}\s+[a-záéíóúñ]+\s+20\d{2}\s*/i, "")
    .trim();
}

export function parseLinkedCards(
  html: string,
  baseUrl: string,
  options: {
    maxItems?: number;
    urlMatches?: (url: string) => boolean;
    rejectTitles?: readonly string[];
  } = {},
): NewsCandidate[] {
  const maxItems = options.maxItems ?? 20;
  const candidates: NewsCandidate[] = [];
  const seen = new Set<string>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1] ?? "";
    const anchorHtml = match[2] ?? "";
    const index = match.index ?? 0;

    let url: string;
    try {
      url = absoluteSourceUrl(href, baseUrl);
    } catch {
      continue;
    }

    if (url === baseUrl || seen.has(url)) continue;
    if (options.urlMatches && !options.urlMatches(url)) continue;

    const anchorText = htmlToText(anchorHtml);
    const beforeText = htmlToText(html.slice(Math.max(0, index - 900), index));
    const afterHtml = html.slice(index + match[0].length, Math.min(html.length, index + match[0].length + 1800));
    const afterText = htmlToText(afterHtml);

    const publishedAt =
      parseFlexibleDateToIso(anchorText) ??
      parseFlexibleDateToIso(beforeText.slice(-650)) ??
      parseFlexibleDateToIso(afterText.slice(0, 650));

    if (!publishedAt) continue;

    const heading = extractHeadingText(anchorHtml);
    const lines = anchorText
      .split("\n")
      .map(cleanLine)
      .filter(Boolean)
      .map(stripLeadingDate)
      .filter((line) => line.length >= 8);

    const title = cleanLine(heading || lines[0] || "");
    if (!title || title.length < 8) continue;
    if (options.rejectTitles?.some((value) => normalizeForMatch(title) === normalizeForMatch(value))) continue;

    const summary = cleanLine(
      extractParagraphText(anchorHtml) ||
      extractParagraphText(afterHtml) ||
      "",
    ).slice(0, 1200);

    seen.add(url);
    candidates.push({
      title: title.slice(0, 220),
      summary,
      url,
      publishedAt,
    });

    if (candidates.length >= maxItems) break;
  }

  return candidates;
}

export async function storeCandidates(config: {
  source: ActualidadSourceKey;
  sourceName: string;
  sourceType: ActualidadSourceType;
  candidates: NewsCandidate[];
  recentDays: number;
  relevanceTerms?: readonly string[];
  excludeTerms?: readonly string[];
  defaultCategories?: readonly ActualidadCategory[];
  allowedCategories?: readonly ActualidadCategory[];
  maxItemsToProcess?: number;
}): Promise<SourceCollectionResult> {
  const result: SourceCollectionResult = {
    source: config.source,
    checkedAt: new Date().toISOString(),
    found: config.candidates.length,
    created: 0,
    existing: 0,
    skipped: 0,
    errors: [],
  };

  const allowed = config.allowedCategories
    ? new Set<ActualidadCategory>(config.allowedCategories)
    : null;

  const items = config.candidates.slice(0, config.maxItemsToProcess ?? config.candidates.length);

  for (const candidate of items) {
    try {
      if (!isWithinDays(candidate.publishedAt, config.recentDays)) {
        result.skipped += 1;
        continue;
      }

      const searchable = `${candidate.title}. ${candidate.summary}`;
      if (config.relevanceTerms?.length && !hasAnyTerm(searchable, config.relevanceTerms)) {
        result.skipped += 1;
        continue;
      }

      if (config.excludeTerms?.length && hasAnyTerm(searchable, config.excludeTerms)) {
        result.skipped += 1;
        continue;
      }

      const categories = new Set<ActualidadCategory>([
        ...suggestActualidadCategories(searchable, config.source),
        ...(candidate.categories ?? []),
        ...(config.defaultCategories ?? []),
      ]);

      const finalCategories = [...categories].filter((category) => !allowed || allowed.has(category));

      if (!finalCategories.length) {
        result.skipped += 1;
        continue;
      }

      const stored = await createActualidadItemIfNew({
        title: candidate.title,
        summary: candidate.summary,
        sourceKey: config.source,
        sourceName: config.sourceName,
        sourceUrl: candidate.url,
        sourceType: config.sourceType,
        publishedAt: candidate.publishedAt,
        categories: finalCategories,
        jurisprudence: candidate.jurisprudence,
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
