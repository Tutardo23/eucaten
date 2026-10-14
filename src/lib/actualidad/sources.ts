import type { ActualidadSourceType } from "./types";

export type ActualidadSourceKey =
  | "uif"
  | "bcra"
  | "cnv"
  | "boletin-oficial"
  | "gafi"
  | "gafilat"
  | "camara-fintech"
  | "iproup"
  | "oficina-anticorrupcion"
  | "aaip"
  | "igj"
  | "ministerio-seguridad"
  | "fiscales"
  | "alea"
  | "lotba"
  | "iplyc-ba"
  | "yogonet"
  | "gm-news"
  | "sbc-noticias"
  | "reguladores-provinciales"
  | "cascba"
  | "csjn"
  | "cij"
  | "saij"
  | "scba"
  | "diario-judicial"
  | "microjuris";

export type ActualidadSourceDefinition = {
  key: ActualidadSourceKey;
  name: string;
  sourceType: ActualidadSourceType;
  enabled: boolean;
  automation: "automatic" | "watch_only";
  note?: string;
  displayTypeLabel?: string;
};

export const ACTUALIDAD_SOURCES: readonly ActualidadSourceDefinition[] = [
  { key: "uif", name: "Unidad de Información Financiera", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "bcra", name: "Banco Central de la República Argentina", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "cnv", name: "Comisión Nacional de Valores", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "boletin-oficial", name: "Boletín Oficial de la República Argentina", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "gafi", name: "GAFI / FATF", sourceType: "international_organization", enabled: true, automation: "automatic" },
  { key: "gafilat", name: "GAFILAT", sourceType: "international_organization", enabled: true, automation: "automatic" },
  { key: "camara-fintech", name: "Cámara Argentina Fintech", sourceType: "specialized_media", enabled: true, automation: "automatic", displayTypeLabel: "Organización sectorial" },
  { key: "iproup", name: "iProUP", sourceType: "specialized_media", enabled: true, automation: "automatic" },
  { key: "oficina-anticorrupcion", name: "Oficina Anticorrupción", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "aaip", name: "Agencia de Acceso a la Información Pública", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "igj", name: "Inspección General de Justicia", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "ministerio-seguridad", name: "Ministerio de Seguridad Nacional", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "fiscales", name: "Ministerio Público Fiscal / Fiscales.gob.ar", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "alea", name: "ALEA", sourceType: "specialized_media", enabled: true, automation: "automatic", displayTypeLabel: "Organización sectorial" },
  { key: "lotba", name: "Lotería de la Ciudad de Buenos Aires (LOTBA)", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "iplyc-ba", name: "Instituto Provincial de Lotería y Casinos de Buenos Aires", sourceType: "official", enabled: true, automation: "automatic" },
  { key: "yogonet", name: "Yogonet Latinoamérica", sourceType: "specialized_media", enabled: true, automation: "automatic" },
  { key: "gm-news", name: "G&M News", sourceType: "specialized_media", enabled: true, automation: "automatic" },
  { key: "sbc-noticias", name: "SBC Noticias", sourceType: "specialized_media", enabled: true, automation: "automatic" },

  // Fuentes pedidas por Cata que deliberadamente NO se automatizan todavía.
  // No queremos saltar CAPTCHAs, paywalls o publicar jurisprudencia sin poder
  // verificar el fallo original y sus metadatos jurídicos.
  { key: "reguladores-provinciales", name: "Reguladores provinciales de juego", sourceType: "official", enabled: false, automation: "watch_only", note: "Cobertura transversal mediante ALEA, LOTBA, IPLyC PBA y medios sectoriales; los conectores provinciales se habilitan individualmente solo tras verificar un feed estable." },
  { key: "cascba", name: "CASCBA / Juego Legal", sourceType: "specialized_media", enabled: false, automation: "watch_only", displayTypeLabel: "Organización sectorial", note: "Sin feed de novedades fechado y estable." },
  { key: "csjn", name: "Corte Suprema de Justicia de la Nación", sourceType: "judicial", enabled: false, automation: "watch_only", note: "Requiere conector caso-a-caso para verificar sentencia, carátula, tribunal y fecha." },
  { key: "cij", name: "Centro de Información Judicial / Archivo CIJ", sourceType: "judicial", enabled: false, automation: "watch_only", note: "No se automatiza cuando el acceso requiere controles anti-bot/CAPTCHA." },
  { key: "saij", name: "SAIJ", sourceType: "judicial", enabled: false, automation: "watch_only", note: "Pendiente de conector de jurisprudencia verificable." },
  { key: "scba", name: "Suprema Corte de Justicia de Buenos Aires", sourceType: "judicial", enabled: false, automation: "watch_only", note: "Pendiente de conector de jurisprudencia verificable." },
  { key: "diario-judicial", name: "Diario Judicial", sourceType: "press", enabled: false, automation: "watch_only", note: "Puede servir como alerta, pero no como verificación de sentencia." },
  { key: "microjuris", name: "Microjuris Argentina", sourceType: "press", enabled: false, automation: "watch_only", note: "Sujeto a condiciones de acceso y reutilización." },
] as const;
