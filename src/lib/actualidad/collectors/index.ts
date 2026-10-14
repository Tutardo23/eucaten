import { isActualidadDatabaseConfigured } from "../db";
import { recordActualidadSourceHealth } from "../source-health";
import type { ActualidadSourceKey } from "../sources";
import { collectUIFResolutions } from "./uif";
import { collectBCRANews } from "./bcra";
import { collectCNVNews } from "./cnv";
import { collectBoletinOficial } from "./boletin";
import { collectGAFINews, collectGAFILATNews } from "./international";
import {
  collectAAIPNews,
  collectIGJNews,
  collectMinisterioSeguridadNews,
  collectOficinaAnticorrupcionNews,
} from "./argentina-gob";
import {
  collectALEANews,
  collectCamaraFintechNews,
  collectIPLyCBANews,
  collectLOTBANews,
} from "./sector";
import {
  collectGMNews,
  collectIProUPNews,
  collectSBCNoticias,
  collectYogonetNews,
} from "./media";
import { collectFiscalesNews } from "./fiscales";
import type { SourceCollectionResult } from "./common";

export type ActualidadCollectionResult = {
  startedAt: string;
  finishedAt: string;
  sources: SourceCollectionResult[];
  totals: {
    found: number;
    created: number;
    existing: number;
    skipped: number;
    failedSources: number;
  };
};

type Collector = {
  source: ActualidadSourceKey;
  run: () => Promise<SourceCollectionResult>;
};

const WAVES: readonly (readonly Collector[])[] = [
  [
    { source: "uif", run: collectUIFResolutions },
    { source: "bcra", run: collectBCRANews },
    { source: "cnv", run: collectCNVNews },
    { source: "boletin-oficial", run: collectBoletinOficial },
    { source: "gafi", run: collectGAFINews },
    { source: "gafilat", run: collectGAFILATNews },
  ],
  [
    { source: "oficina-anticorrupcion", run: collectOficinaAnticorrupcionNews },
    { source: "aaip", run: collectAAIPNews },
    { source: "igj", run: collectIGJNews },
    { source: "ministerio-seguridad", run: collectMinisterioSeguridadNews },
    { source: "fiscales", run: collectFiscalesNews },
    { source: "camara-fintech", run: collectCamaraFintechNews },
  ],
  [
    { source: "iproup", run: collectIProUPNews },
    { source: "alea", run: collectALEANews },
    { source: "lotba", run: collectLOTBANews },
    { source: "iplyc-ba", run: collectIPLyCBANews },
    { source: "yogonet", run: collectYogonetNews },
    { source: "gm-news", run: collectGMNews },
    { source: "sbc-noticias", run: collectSBCNoticias },
  ],
] as const;

async function runCollectorSafely(collector: Collector): Promise<SourceCollectionResult> {
  try {
    return await collector.run();
  } catch (error) {
    return {
      source: collector.source,
      checkedAt: new Date().toISOString(),
      found: 0,
      created: 0,
      existing: 0,
      skipped: 0,
      errors: [
        error instanceof Error
          ? error.message
          : "La fuente falló con un error inesperado.",
      ],
    };
  }
}

export async function collectActualidadSources(): Promise<ActualidadCollectionResult> {
  if (!isActualidadDatabaseConfigured()) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  const startedAt = new Date().toISOString();
  const sources: SourceCollectionResult[] = [];

  // Trabajamos por tandas para no disparar demasiadas conexiones externas a la vez.
  // Dentro de cada tanda las fuentes están aisladas: una caída nunca detiene a las demás.
  for (const wave of WAVES) {
    const results = await Promise.all(wave.map((collector) => runCollectorSafely(collector)));
    sources.push(...results);
  }

  const totals = sources.reduce(
    (accumulator, source) => ({
      found: accumulator.found + source.found,
      created: accumulator.created + source.created,
      existing: accumulator.existing + source.existing,
      skipped: accumulator.skipped + source.skipped,
      failedSources: accumulator.failedSources + (source.errors.length > 0 && source.found === 0 ? 1 : 0),
    }),
    { found: 0, created: 0, existing: 0, skipped: 0, failedSources: 0 },
  );

  const finishedAt = new Date().toISOString();

  // El estado de las fuentes es auxiliar: si Neon no pudiera registrar este
  // diagnóstico, la recopilación principal igual debe considerarse válida.
  try {
    await recordActualidadSourceHealth(sources);
  } catch (error) {
    console.error("[actualidad:source-health]", error);
  }

  return {
    startedAt,
    finishedAt,
    sources,
    totals,
  };
}
