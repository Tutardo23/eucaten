import {
  ACTUALIDAD_CATEGORIES,
  type ActualidadCategory,
} from "./types";
import type { ActualidadSourceKey } from "./sources";

type CategoryRule = {
  category: ActualidadCategory;
  terms: readonly string[];
};

const CATEGORY_RULES: readonly CategoryRule[] = [
  {
    category: "Compliance y prevención de lavado de activos",
    terms: [
      "lavado de activos",
      "pla",
      "pla/ft",
      "financiamiento del terrorismo",
      "sujeto obligado",
      "sujetos obligados",
      "debida diligencia",
      "beneficiario final",
      "operacion sospechosa",
      "operaciones sospechosas",
      "uif",
    ],
  },
  {
    category: "Fintech y medios de pago",
    terms: [
      "fintech",
      "psp",
      "proveedor de servicios de pago",
      "proveedores de servicios de pago",
      "billetera digital",
      "billeteras digitales",
      "medio de pago",
      "medios de pago",
      "transferencia",
      "transferencias",
      "cvu",
      "interoperabilidad",
    ],
  },
  {
    category: "Juegos de azar",
    terms: [
      "juego de azar",
      "juegos de azar",
      "casino",
      "casinos",
      "apuesta",
      "apuestas",
      "loteria",
      "loterias",
    ],
  },
  {
    category: "Prevención de fraude",
    terms: [
      "fraude",
      "autenticacion",
      "phishing",
      "suplantacion",
      "ingenieria social",
      "operacion desconocida",
      "operaciones desconocidas",
    ],
  },
  {
    category: "Integridad corporativa",
    terms: [
      "integridad",
      "anticorrupcion",
      "corrupcion",
      "codigo de conducta",
      "canal de denuncias",
      "programa de integridad",
      "programas de integridad",
    ],
  },
  {
    category: "Jurisprudencia y litigios",
    terms: [
      "sentencia",
      "sentencias",
      "fallo",
      "fallos",
      "tribunal",
      "camara",
      "corte suprema",
      "jurisprudencia",
      "litigio",
      "litigios",
    ],
  },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function suggestActualidadCategories(
  text: string,
  source?: ActualidadSourceKey,
): ActualidadCategory[] {
  const normalized = normalizeText(text);
  const matches = new Set<ActualidadCategory>();

  for (const rule of CATEGORY_RULES) {
    if (rule.terms.some((term) => normalized.includes(normalizeText(term)))) {
      matches.add(rule.category);
    }
  }

  if (source === "uif") {
    matches.add("Compliance y prevención de lavado de activos");
  }

  if (source === "csjn") {
    matches.add("Jurisprudencia y litigios");
  }

  return ACTUALIDAD_CATEGORIES.filter((category) => matches.has(category));
}
