import { isActualidadDatabaseConfigured } from "../db";
import { collectUIFResolutions, type UIFCollectionResult } from "./uif";

export type ActualidadCollectionResult = {
  startedAt: string;
  finishedAt: string;
  sources: UIFCollectionResult[];
  totals: {
    found: number;
    created: number;
    existing: number;
    skipped: number;
  };
};

export async function collectActualidadSources(): Promise<ActualidadCollectionResult> {
  if (!isActualidadDatabaseConfigured()) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  const startedAt = new Date().toISOString();
  const sources: UIFCollectionResult[] = [];

  // Etapa 5: una sola fuente real y controlada. El registro queda preparado
  // para sumar BCRA, CNV y otras fuentes sin mezclar su lógica.
  sources.push(await collectUIFResolutions());

  const totals = sources.reduce(
    (accumulator, source) => ({
      found: accumulator.found + source.found,
      created: accumulator.created + source.created,
      existing: accumulator.existing + source.existing,
      skipped: accumulator.skipped + source.skipped,
    }),
    { found: 0, created: 0, existing: 0, skipped: 0 },
  );

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    sources,
    totals,
  };
}
