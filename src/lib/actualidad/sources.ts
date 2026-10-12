import type { ActualidadSourceType } from "./types";

export type ActualidadSourceKey =
  | "uif"
  | "bcra"
  | "cnv"
  | "boletin-oficial"
  | "csjn"
  | "gafi"
  | "gafilat";

export type ActualidadSourceDefinition = {
  key: ActualidadSourceKey;
  name: string;
  sourceType: ActualidadSourceType;
  enabled: boolean;
};

export const ACTUALIDAD_SOURCES: readonly ActualidadSourceDefinition[] = [
  {
    key: "uif",
    name: "Unidad de Información Financiera",
    sourceType: "official",
    enabled: true,
  },
  {
    key: "bcra",
    name: "Banco Central de la República Argentina",
    sourceType: "official",
    enabled: true,
  },
  {
    key: "cnv",
    name: "Comisión Nacional de Valores",
    sourceType: "official",
    enabled: true,
  },
  {
    key: "boletin-oficial",
    name: "Boletín Oficial de la República Argentina",
    sourceType: "official",
    enabled: true,
  },
  {
    key: "csjn",
    name: "Corte Suprema de Justicia de la Nación",
    sourceType: "judicial",
    enabled: true,
  },
  {
    key: "gafi",
    name: "GAFI / FATF",
    sourceType: "international_organization",
    enabled: true,
  },
  {
    key: "gafilat",
    name: "GAFILAT",
    sourceType: "international_organization",
    enabled: true,
  },
] as const;
