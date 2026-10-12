export const ACTUALIDAD_CATEGORIES = [
  "Compliance y prevención de lavado de activos",
  "Fintech y medios de pago",
  "Juegos de azar",
  "Prevención de fraude",
  "Integridad corporativa",
  "Jurisprudencia y litigios",
] as const;

export type ActualidadCategory = (typeof ACTUALIDAD_CATEGORIES)[number];

export const ACTUALIDAD_STATUSES = [
  "pending",
  "published",
  "rejected",
] as const;

export type ActualidadStatus = (typeof ACTUALIDAD_STATUSES)[number];

export const ACTUALIDAD_SOURCE_TYPES = [
  "official",
  "judicial",
  "international_organization",
  "specialized_media",
  "press",
] as const;

export type ActualidadSourceType = (typeof ACTUALIDAD_SOURCE_TYPES)[number];

export type ActualidadJurisprudence = {
  court?: string;
  caseName?: string;
  judgmentDate?: string;
  judgmentUrl?: string;
  judgmentVerified: boolean;
};

export type ActualidadItem = {
  id: string;
  slug: string;
  fingerprint: string;
  title: string;
  summary: string;
  sourceKey?: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: ActualidadSourceType;
  publishedAt: string;
  collectedAt: string;
  categories: ActualidadCategory[];
  status: ActualidadStatus;
  jurisprudence?: ActualidadJurisprudence;
  publishedBy?: string;
  webPublishedAt?: string;
  createdAt: string;
  updatedAt: string;
};
