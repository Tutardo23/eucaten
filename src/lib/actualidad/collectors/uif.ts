import { suggestActualidadCategories } from "../rules";
import { createActualidadItemIfNew } from "../repository";
import {
  absoluteOfficialUrl,
  fetchOfficialHtml,
  htmlToText,
} from "./http";

const UIF_RESOLUTIONS_URL = "https://www.argentina.gob.ar/uif/normativa/resoluciones";
const SOURCE_NAME = "Unidad de Información Financiera";
const MAX_ITEMS_PER_RUN = 12;

type UIFCandidate = {
  resolution: string;
  year: number;
  title: string;
  summary: string;
  url: string;
};

export type UIFCollectionResult = {
  source: "uif";
  checkedAt: string;
  found: number;
  created: number;
  existing: number;
  skipped: number;
  errors: string[];
};

function cleanSummary(value: string, resolution: string) {
  return value
    .replace(new RegExp(`^Resoluci[oó]n\\s+UIF\\s+${resolution.replace("/", "\\/")}`, "i"), "")
    .replace(/^\s*[.\-–—:]\s*/, "")
    .trim();
}

export function parseUIFResolutionList(html: string): UIFCandidate[] {
  const candidates: UIFCandidate[] = [];
  const liPattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;

  for (const match of html.matchAll(liPattern)) {
    const liHtml = match[1] ?? "";
    const anchor = liHtml.match(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
    );

    if (!anchor) continue;

    const anchorText = htmlToText(anchor[2] ?? "");
    const resolutionMatch = anchorText.match(/^(\d{1,4})\/(20\d{2})$/);
    if (!resolutionMatch) continue;

    const resolution = `${resolutionMatch[1]}/${resolutionMatch[2]}`;
    const year = Number(resolutionMatch[2]);
    const fullText = htmlToText(liHtml);
    const summary = cleanSummary(fullText, resolution);

    let url: string;
    try {
      url = absoluteOfficialUrl(anchor[1], UIF_RESOLUTIONS_URL);
    } catch {
      continue;
    }

    candidates.push({
      resolution,
      year,
      title: `Resolución UIF ${resolution}`,
      summary,
      url,
    });
  }

  if (!candidates.length) return [];

  const latestYear = Math.max(...candidates.map((candidate) => candidate.year));

  return candidates
    .filter((candidate) => candidate.year === latestYear)
    .slice(0, MAX_ITEMS_PER_RUN);
}

function isoFromParts(year: string, month: string, day: string) {
  const value = new Date(`${year}-${month}-${day}T12:00:00-03:00`);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

function dateFromBoletinUrl(value: string) {
  const match = value.match(/\/(20\d{2})(\d{2})(\d{2})(?:[/?#]|$)/);
  return match ? isoFromParts(match[1], match[2], match[3]) : null;
}

function dateFromDetailText(text: string) {
  const publication = text.match(
    /(?:Publicada en el Bolet[ií]n Oficial:|Fecha de publicaci[oó]n)\s*(\d{2})[-/](\d{2})[-/](20\d{2})/i,
  );

  if (publication) {
    return isoFromParts(publication[3], publication[2], publication[1]);
  }

  const sanction = text.match(/Sanci[oó]n:\s*(\d{2})[-/](\d{2})[-/](20\d{2})/i);
  return sanction ? isoFromParts(sanction[3], sanction[2], sanction[1]) : null;
}

async function resolvePublishedAt(candidate: UIFCandidate) {
  const fromUrl = dateFromBoletinUrl(candidate.url);
  if (fromUrl) return fromUrl;

  const { html, finalUrl } = await fetchOfficialHtml(candidate.url);
  const fromRedirect = dateFromBoletinUrl(finalUrl);
  if (fromRedirect) return fromRedirect;

  return dateFromDetailText(htmlToText(html));
}

export async function collectUIFResolutions(): Promise<UIFCollectionResult> {
  const checkedAt = new Date().toISOString();
  const result: UIFCollectionResult = {
    source: "uif",
    checkedAt,
    found: 0,
    created: 0,
    existing: 0,
    skipped: 0,
    errors: [],
  };

  const { html } = await fetchOfficialHtml(UIF_RESOLUTIONS_URL);
  const candidates = parseUIFResolutionList(html);
  result.found = candidates.length;

  for (const candidate of candidates) {
    try {
      const publishedAt = await resolvePublishedAt(candidate);

      if (!publishedAt) {
        result.skipped += 1;
        result.errors.push(`${candidate.resolution}: no se pudo verificar la fecha oficial.`);
        continue;
      }

      const categories = suggestActualidadCategories(
        `${candidate.title}. ${candidate.summary}`,
        "uif",
      );

      const stored = await createActualidadItemIfNew({
        title: candidate.title,
        summary: candidate.summary,
        sourceKey: "uif",
        sourceName: SOURCE_NAME,
        sourceUrl: candidate.url,
        sourceType: "official",
        publishedAt,
        categories,
      });

      if (stored.created) result.created += 1;
      else result.existing += 1;
    } catch (error) {
      result.skipped += 1;
      result.errors.push(
        `${candidate.resolution}: ${error instanceof Error ? error.message : "error inesperado"}`,
      );
    }
  }

  return result;
}
