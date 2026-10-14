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
      "lavado de dinero",
      "anti-money laundering",
      "money laundering",
      "aml/cft",
      "aml",
      "ala/cft",
      "ala/cft/cfp",
      "pla",
      "pla/ft",
      "financiamiento del terrorismo",
      "terrorist financing",
      "financiamiento de la proliferacion",
      "sujeto obligado",
      "sujetos obligados",
      "debida diligencia",
      "due diligence",
      "beneficiario final",
      "beneficial ownership",
      "operacion sospechosa",
      "operaciones sospechosas",
      "reporte de operacion sospechosa",
      "oficial de cumplimiento",
      "sanciones financieras",
      "financial sanctions",
      "enfoque basado en riesgos",
      "risk-based approach",
      "uif",
      "fatf",
      "gafi",
      "gafilat",
      "compliance",
    ],
  },
  {
    category: "Fintech y medios de pago",
    terms: [
      "fintech",
      "psp",
      "pspcp",
      "psav",
      "vasp",
      "proveedor de servicios de pago",
      "proveedores de servicios de pago",
      "proveedor de servicios de activos virtuales",
      "proveedores de servicios de activos virtuales",
      "activo virtual",
      "activos virtuales",
      "virtual asset",
      "virtual assets",
      "criptoactivo",
      "criptoactivos",
      "cripto",
      "crypto",
      "stablecoin",
      "stablecoins",
      "tokenizacion",
      "tokenización",
      "open finance",
      "open banking",
      "billetera digital",
      "billeteras digitales",
      "billetera virtual",
      "billeteras virtuales",
      "medio de pago",
      "medios de pago",
      "payment",
      "payments",
      "pago con transferencia",
      "pagos con transferencia",
      "transferencia inmediata",
      "transferencias inmediatas",
      "cobro con transferencia",
      "transferencia",
      "transferencias",
      "cvu",
      "cbu",
      "qr interoperable",
      "interoperabilidad",
      "adquirencia",
    ],
  },
  {
    category: "Juegos de azar",
    terms: [
      "juego de azar",
      "juegos de azar",
      "juego online",
      "juego ilegal",
      "juego clandestino",
      "juego responsable",
      "juego problemático",
      "juego problematico",
      "gaming",
      "igaming",
      "gambling",
      "casino",
      "casinos",
      "bingo",
      "bingos",
      "apuesta",
      "apuestas",
      "betting",
      "sports betting",
      "loteria",
      "lotería",
      "loterias",
      "loterías",
      "autoexclusion",
      "autoexclusión",
      "ludopatia",
      "ludopatía",
    ],
  },
  {
    category: "Prevención de fraude",
    terms: [
      "fraude",
      "fraud",
      "ciberfraude",
      "estafa",
      "estafas",
      "defraudacion",
      "defraudación",
      "scam",
      "autenticacion",
      "autenticación",
      "phishing",
      "suplantacion",
      "suplantación",
      "ingenieria social",
      "ingeniería social",
      "ciberdelincuencia",
      "cibercrimen",
      "operacion desconocida",
      "operaciones desconocidas",
      "fake news",
      "plataforma de inversion falsa",
      "plataforma de inversión falsa",
    ],
  },
  {
    category: "Integridad corporativa",
    terms: [
      "integridad",
      "anticorrupcion",
      "anticorrupción",
      "corrupcion",
      "corrupción",
      "soborno",
      "bribery",
      "codigo de conducta",
      "código de conducta",
      "canal de denuncias",
      "programa de integridad",
      "programas de integridad",
      "gobierno corporativo",
      "conflicto de interes",
      "conflictos de interes",
      "conflicto de interés",
      "conflictos de interés",
      "hechos relevantes",
      "transparencia",
      "etica publica",
      "ética pública",
      "rite",
      "responsabilidad penal de las personas juridicas",
      "responsabilidad penal de las personas jurídicas",
      "contrataciones publicas",
      "contrataciones públicas",
      "proteccion de datos personales",
      "protección de datos personales",
      "datos personales",
      "privacidad",
      "seguridad de la informacion",
      "seguridad de la información",
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
      "juzgado",
      "camara",
      "cámara",
      "casacion",
      "casación",
      "corte suprema",
      "jurisprudencia",
      "litigio",
      "litigios",
      "medida cautelar",
      "condena",
      "condenaron",
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

  if (source === "uif" || source === "gafi" || source === "gafilat") {
    matches.add("Compliance y prevención de lavado de activos");
  }

  if (source === "camara-fintech" || source === "iproup") {
    if (
      normalized.includes("fintech") ||
      normalized.includes("pago") ||
      normalized.includes("billetera") ||
      normalized.includes("cripto") ||
      normalized.includes("token") ||
      normalized.includes("credito") ||
      normalized.includes("banco central") ||
      normalized.includes("bcra")
    ) {
      matches.add("Fintech y medios de pago");
    }
  }

  if (
    source === "alea" ||
    source === "lotba" ||
    source === "iplyc-ba" ||
    source === "yogonet" ||
    source === "gm-news" ||
    source === "sbc-noticias" ||
    source === "cascba"
  ) {
    if (
      normalized.includes("juego") ||
      normalized.includes("apuesta") ||
      normalized.includes("casino") ||
      normalized.includes("gaming") ||
      normalized.includes("loteria")
    ) {
      matches.add("Juegos de azar");
    }
  }

  if (source === "oficina-anticorrupcion" || source === "igj" || source === "aaip") {
    if (normalized.includes("integridad") || normalized.includes("corrup") || normalized.includes("sociedad") || normalized.includes("datos") || normalized.includes("privacidad") || normalized.includes("transparencia")) {
      matches.add("Integridad corporativa");
    }
  }

  if (source === "csjn" || source === "cij" || source === "saij" || source === "scba") {
    matches.add("Jurisprudencia y litigios");
  }

  return ACTUALIDAD_CATEGORIES.filter((category) => matches.has(category));
}
