import type { MetadataRoute } from "next";
import { getPublishedPaths } from "@/lib/published-content";

const publicPaths = ["", "/about", "/resources", "/tools", "/blueprint", "/pricing", "/coaching", "/contact", "/privacy", "/terms", "/refund-policy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || process.env.NEXT_PUBLIC_INDEXING_ENABLED !== "true") return [];
  const paths = await getPublishedPaths();
  const contentPaths = paths.flatMap((path) => [`/resources/${path.slug}`, ...path.lessons.map((lesson) => `/resources/${path.slug}/${lesson.slug}`)]);
  return [...publicPaths, ...contentPaths].map((path) => ({ url: new URL(path, siteUrl).toString(), changeFrequency: "monthly", priority: path === "" ? 1 : 0.6 }));
}
