import type { MetadataRoute } from "next";
import { listPublishedActualidad } from "@/lib/actualidad/repository";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://eucaten.vercel.app").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const items = await listPublishedActualidad(100);

  return [
    {
      url: `${base}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${base}/actualidad`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...items.map((item) => ({
      url: `${base}/actualidad/${item.slug}`,
      lastModified: item.webPublishedAt || item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
