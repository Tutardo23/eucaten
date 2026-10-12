import { createHash, randomUUID } from "node:crypto";
import {
  ACTUALIDAD_CATEGORIES,
  ACTUALIDAD_SOURCE_TYPES,
  type ActualidadCategory,
  type ActualidadSourceType,
} from "./types";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function createActualidadId() {
  return randomUUID();
}

export function createActualidadSlug(title: string, fallbackId?: string) {
  const normalized = normalizeText(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return normalized || `actualidad-${fallbackId ?? randomUUID()}`;
}

export function createActualidadFingerprint(input: {
  sourceUrl: string;
  sourceName: string;
  title: string;
  publishedAt: string;
}) {
  const basis = [
    normalizeText(input.sourceUrl),
    normalizeText(input.sourceName),
    normalizeText(input.title),
    new Date(input.publishedAt).toISOString().slice(0, 10),
  ].join("|");

  return createHash("sha256").update(basis).digest("hex");
}

export function assertActualidadCategories(
  categories: readonly string[],
): asserts categories is readonly ActualidadCategory[] {
  const allowed = new Set<string>(ACTUALIDAD_CATEGORIES);
  const invalid = categories.filter((category) => !allowed.has(category));

  if (invalid.length) {
    throw new Error(`Categorías inválidas: ${invalid.join(", ")}`);
  }
}

export function assertActualidadSourceType(
  value: string,
): asserts value is ActualidadSourceType {
  if (!(ACTUALIDAD_SOURCE_TYPES as readonly string[]).includes(value)) {
    throw new Error(`Tipo de fuente inválido: ${value}`);
  }
}

export function assertHttpUrl(value: string, fieldName: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${fieldName} debe ser una URL válida.`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${fieldName} debe usar http o https.`);
  }
}
