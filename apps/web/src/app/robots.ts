import { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarkaritrack.in";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] }],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
