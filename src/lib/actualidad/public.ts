import type {
  ActualidadCategory,
  ActualidadItem,
  ActualidadJurisprudence,
  ActualidadSourceType,
} from "./types";

export type ActualidadPublicItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: ActualidadSourceType;
  publishedAt: string;
  categories: ActualidadCategory[];
  jurisprudence?: ActualidadJurisprudence;
};

export function toActualidadPublicItem(
  item: ActualidadItem,
): ActualidadPublicItem {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    sourceType: item.sourceType,
    publishedAt: item.publishedAt,
    categories: item.categories,
    jurisprudence: item.jurisprudence,
  };
}
