import type { ActualidadCategory } from "../types";
import type { ActualidadSourceKey } from "../sources";
import { fetchOfficialHtml } from "./http";
import { parseLinkedCards, storeCandidates, type SourceCollectionResult } from "./common";

type ArgentinaGovCollector = {
  source: ActualidadSourceKey;
  sourceName: string;
  url: string;
  pathFragment: string;
  recentDays: number;
  maxItems: number;
  maxProcess: number;
  relevanceTerms: readonly string[];
  excludeTerms?: readonly string[];
  defaultCategories?: readonly ActualidadCategory[];
  allowedCategories: readonly ActualidadCategory[];
};

const CONFIGS: readonly ArgentinaGovCollector[] = [
  {
    source: "oficina-anticorrupcion",
    sourceName: "Oficina Anticorrupción",
    url: "https://www.argentina.gob.ar/anticorrupcion/noticias",
    pathFragment: "/anticorrupcion/",
    recentDays: 120,
    maxItems: 20,
    maxProcess: 10,
    relevanceTerms: [
      "integridad", "corrup", "soborno", "etica", "transparencia", "rite",
      "programa de integridad", "contratacion", "conflicto de interes",
      "declaracion jurada", "responsabilidad penal", "compliance",
    ],
    excludeTerms: [
      "participó", "participo", "disertó", "diserto", "taller", "capacitación",
      "capacitacion", "visita in situ", "reunión plenaria", "reunion plenaria",
    ],
    defaultCategories: ["Integridad corporativa"],
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Integridad corporativa",
    ],
  },
  {
    source: "aaip",
    sourceName: "Agencia de Acceso a la Información Pública",
    url: "https://www.argentina.gob.ar/aaip/noticias",
    pathFragment: "/aaip/",
    recentDays: 120,
    maxItems: 20,
    maxProcess: 10,
    relevanceTerms: [
      "datos personales", "proteccion de datos", "privacidad", "seguridad",
      "incidente", "filtracion", "sancion", "investigacion", "fraude",
      "suplantacion", "inteligencia artificial",
    ],
    allowedCategories: ["Prevención de fraude", "Integridad corporativa"],
  },
  {
    source: "igj",
    sourceName: "Inspección General de Justicia",
    url: "https://www.argentina.gob.ar/justicia/igj/noticias",
    pathFragment: "/justicia/igj/",
    recentDays: 120,
    maxItems: 20,
    maxProcess: 10,
    relevanceTerms: [
      "resolucion", "sociedad", "sociedades", "registro publico", "administrador",
      "administradores", "directorio", "estados contables", "beneficiario final",
      "inscripcion", "fiscalizacion", "capital", "objeto social", "asamblea",
      "gobierno corporativo", "transparencia",
    ],
    excludeTerms: [
      "participó", "participo", "recibió a estudiantes", "recibio a estudiantes",
      "sistema de turnos", "amcham summit",
    ],
    defaultCategories: ["Integridad corporativa"],
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Integridad corporativa",
    ],
  },
  {
    source: "ministerio-seguridad",
    sourceName: "Ministerio de Seguridad Nacional",
    url: "https://www.argentina.gob.ar/seguridad/noticias",
    pathFragment: "/seguridad/",
    recentDays: 75,
    maxItems: 24,
    maxProcess: 10,
    relevanceTerms: [
      "fraude", "estafa", "ciber", "phishing", "suplantacion", "lavado",
      "activos virtuales", "cripto", "juego ilegal", "apuestas ilegales",
      "casino ilegal", "delito economico", "delitos economicos",
    ],
    allowedCategories: [
      "Compliance y prevención de lavado de activos",
      "Juegos de azar",
      "Prevención de fraude",
    ],
  },
] as const;

async function collectArgentinaGov(config: ArgentinaGovCollector): Promise<SourceCollectionResult> {
  const { html } = await fetchOfficialHtml(config.url);
  const candidates = parseLinkedCards(html, config.url, {
    maxItems: config.maxItems,
    urlMatches: (url) => {
      const parsed = new URL(url);
      return parsed.hostname.endsWith("argentina.gob.ar") && parsed.pathname.includes(config.pathFragment) && parsed.pathname !== new URL(config.url).pathname;
    },
    rejectTitles: ["Noticias", "Ver todas las noticias", "Argentina.gob.ar"],
  });

  return storeCandidates({
    source: config.source,
    sourceName: config.sourceName,
    sourceType: "official",
    candidates,
    recentDays: config.recentDays,
    relevanceTerms: config.relevanceTerms,
    excludeTerms: config.excludeTerms,
    defaultCategories: config.defaultCategories,
    allowedCategories: config.allowedCategories,
    maxItemsToProcess: config.maxProcess,
  });
}

export function collectOficinaAnticorrupcionNews() {
  return collectArgentinaGov(CONFIGS[0]);
}

export function collectAAIPNews() {
  return collectArgentinaGov(CONFIGS[1]);
}

export function collectIGJNews() {
  return collectArgentinaGov(CONFIGS[2]);
}

export function collectMinisterioSeguridadNews() {
  return collectArgentinaGov(CONFIGS[3]);
}
