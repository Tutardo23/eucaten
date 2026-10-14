import type { ActualidadItem } from "./types";

export type EditorialPriorityLevel = "high" | "medium" | "normal";

export type EditorialPriority = {
  level: EditorialPriorityLevel;
  label: string;
  score: number;
  reasons: string[];
};

const CRITICAL_SOURCES = new Set([
  "uif",
  "bcra",
  "cnv",
  "boletin-oficial",
  "gafi",
  "gafilat",
]);

const NORMATIVE_TERMS = [
  "resolucion",
  "resolucion general",
  "comunicacion a",
  "normativa",
  "regulacion",
  "reglamentacion",
  "regimen",
  "deroga",
  "modifica",
  "sustituye",
  "entra en vigencia",
  "entrada en vigencia",
  "obligatorio",
  "sujetos obligados",
];

const ENFORCEMENT_TERMS = [
  "sancion",
  "sanciones",
  "multa",
  "multas",
  "sumario",
  "inhabilitacion",
  "incumplimiento",
  "fraude",
  "lavado de activos",
  "financiamiento del terrorismo",
  "operacion sospechosa",
  "operaciones sospechosas",
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function includesAny(value: string, terms: readonly string[]) {
  const normalized = normalize(value);
  return terms.some((term) => normalized.includes(normalize(term)));
}

function uniqueReasons(reasons: string[]) {
  return [...new Set(reasons)].slice(0, 3);
}

export function evaluateEditorialPriority(item: ActualidadItem): EditorialPriority {
  const searchable = `${item.title}. ${item.summary}`;
  const reasons: string[] = [];
  let score = 0;

  if (item.sourceType === "official") {
    score += 1;
    reasons.push("Fuente oficial");
  } else if (item.sourceType === "international_organization") {
    score += 1;
    reasons.push("Organismo internacional");
  }

  if (item.sourceKey && CRITICAL_SOURCES.has(item.sourceKey)) {
    score += 2;
    reasons.push("Fuente regulatoria prioritaria");
  }

  if (includesAny(searchable, NORMATIVE_TERMS)) {
    score += 2;
    reasons.push("Cambio normativo o regulatorio");
  }

  if (includesAny(searchable, ENFORCEMENT_TERMS)) {
    score += 2;
    reasons.push("Sanción, fraude o riesgo de cumplimiento");
  }

  if (
    item.categories.includes("Compliance y prevención de lavado de activos") ||
    item.categories.includes("Prevención de fraude")
  ) {
    score += 1;
  }

  if (item.jurisprudence?.judgmentVerified) {
    score += 3;
    reasons.push("Fallo judicial verificado");
  } else if (item.jurisprudence) {
    score += 1;
    reasons.push("Alerta jurisprudencial pendiente de verificación");
  }

  // "Revisar primero" queda deliberadamente reservado para señales realmente fuertes.
  // La prioridad ordena la lectura: nunca decide si una nota se publica.
  const level: EditorialPriorityLevel =
    score >= 6 ? "high" : score >= 3 ? "medium" : "normal";

  return {
    level,
    label:
      level === "high"
        ? "Revisar primero"
        : level === "medium"
          ? "Revisar después"
          : "Seguimiento",
    score,
    reasons: uniqueReasons(reasons.length ? reasons : ["Seguimiento sectorial"]),
  };
}

export function editorialPriorityRank(item: ActualidadItem) {
  const level = evaluateEditorialPriority(item).level;
  return level === "high" ? 0 : level === "medium" ? 1 : 2;
}
