import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarkaritrack.in";
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                                     priority: 1.0, changeFrequency: "hourly"  },
    { url: `${BASE}/results`,                        priority: 0.9, changeFrequency: "hourly"  },
    { url: `${BASE}/admit-cards`,                    priority: 0.9, changeFrequency: "hourly"  },
    { url: `${BASE}/tools`,                          priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/tools/photo-signature-resizer`,  priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/tools/sarkari-age-calculator`,   priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/tools/smart-eligibility-engine`, priority: 0.8, changeFrequency: "monthly" },
  ];
  try {
    const [jobs, states, quals] = await Promise.all([
      prisma.job.findMany({ where: { status: { not: "DRAFT" } }, select: { slug: true, updatedAt: true, status: true }, take: 10000, orderBy: { updatedAt: "desc" } }),
      prisma.state.findMany({ select: { slug: true } }),
      prisma.qualification.findMany({ select: { slug: true } }),
    ]);
    return [
      ...staticPages,
      ...jobs.map((j) => ({ url: `${BASE}/jobs/${j.slug}`, lastModified: j.updatedAt, priority: j.status === "LIVE" ? 0.9 : 0.5, changeFrequency: "daily" as const })),
      ...states.map((s) => ({ url: `${BASE}/state/${s.slug}`, priority: 0.8, changeFrequency: "daily" as const })),
      ...quals.map((q) => ({ url: `${BASE}/qualification/${q.slug}`, priority: 0.7, changeFrequency: "daily" as const })),
    ];
  } catch { return staticPages; }
}
