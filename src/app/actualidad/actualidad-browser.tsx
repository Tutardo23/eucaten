"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ACTUALIDAD_CATEGORIES,
  type ActualidadCategory,
} from "@/lib/actualidad/types";
import type { ActualidadPublicItem } from "@/lib/actualidad/public";
import {
  ACTUALIDAD_SOURCE_TYPE_LABELS,
  formatActualidadDate,
} from "@/lib/actualidad/presentation";

type Filter = "Todas" | ActualidadCategory;

export function ActualidadBrowser({
  items,
}: {
  items: ActualidadPublicItem[];
}) {
  const [filter, setFilter] = useState<Filter>("Todas");

  const visibleItems = useMemo(() => {
    if (filter === "Todas") return items;
    return items.filter((item) => item.categories.includes(filter));
  }, [filter, items]);

  return (
    <div className="updates-browser">
      <div className="updates-filter-wrap" aria-label="Filtrar Actualidad por categoría">
        <div className="updates-filters" role="group" aria-label="Categorías">
          <button
            className={filter === "Todas" ? "is-active" : ""}
            type="button"
            aria-pressed={filter === "Todas"}
            onClick={() => setFilter("Todas")}
          >
            Todo
          </button>
          {ACTUALIDAD_CATEGORIES.map((category) => (
            <button
              className={filter === category ? "is-active" : ""}
              type="button"
              aria-pressed={filter === category}
              onClick={() => setFilter(category)}
              key={category}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="updates-results-head" aria-live="polite">
        <span>
          {visibleItems.length} {visibleItems.length === 1 ? "publicación" : "publicaciones"}
        </span>
        {filter !== "Todas" ? <strong>{filter}</strong> : null}
      </div>

      {visibleItems.length === 0 ? (
        <div className="updates-filter-empty">
          <span>Sin publicaciones en esta categoría por el momento.</span>
          <button type="button" onClick={() => setFilter("Todas")}>Ver todas</button>
        </div>
      ) : (
        <div className="updates-public-grid">
          {visibleItems.map((item, index) => {
            const verified = item.jurisprudence?.judgmentVerified === true;
            const isJurisprudence = Boolean(item.jurisprudence);

            return (
              <article
                className={`updates-public-card${index === 0 && filter === "Todas" ? " is-featured" : ""}`}
                key={item.id}
              >
                <div className="updates-card-topline">
                  <span className="updates-source-kind">
                    {ACTUALIDAD_SOURCE_TYPE_LABELS[item.sourceType]}
                  </span>
                  {verified ? (
                    <span className="updates-verification is-verified">Sentencia verificada</span>
                  ) : isJurisprudence ? (
                    <span className="updates-verification">Sentencia no verificada</span>
                  ) : null}
                </div>

                <div className="updates-public-meta">
                  <span>{formatActualidadDate(item.publishedAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.sourceName}</span>
                </div>

                <h2>
                  <Link href={`/actualidad/${item.slug}`}>{item.title}</Link>
                </h2>

                {item.summary ? <p>{item.summary}</p> : null}

                <div className="updates-public-tags" aria-label="Categorías">
                  {item.categories.map((category) => (
                    <span className="updates-public-tag" key={category}>
                      {category}
                    </span>
                  ))}
                </div>

                <div className="updates-card-actions">
                  <Link className="updates-read-more" href={`/actualidad/${item.slug}`}>
                    Ver detalle <span aria-hidden="true">→</span>
                  </Link>
                  <a
                    className="updates-public-source"
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fuente original ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
