import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || process.env.NEXT_PUBLIC_INDEXING_ENABLED !== "true") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/admin/", "/api/"] },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
