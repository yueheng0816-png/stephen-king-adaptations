import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://stephenkingadaptations.com';

  const [adaptations, books, people, platforms, decades] = await Promise.all([
    prisma.adaptation.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.book.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.person.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.streamingLink.findMany({
      select: { platform: true },
      distinct: ['platform'],
    }),
    prisma.adaptation.findMany({
      select: { releaseYear: true },
      where: { releaseYear: { not: null } },
      distinct: ['releaseYear'],
    }),
  ]);

  // Collect unique decades from adaptation release years
  const decadeSet = new Set<string>();
  for (const a of decades) {
    if (a.releaseYear) {
      decadeSet.add(`${Math.floor(a.releaseYear / 10) * 10}s`);
    }
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/adaptations`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/adaptations/top`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/books`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const adaptationPages: MetadataRoute.Sitemap = adaptations.map(a => ({
    url: `${BASE}/adaptations/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const bookPages: MetadataRoute.Sitemap = books.map(b => ({
    url: `${BASE}/books/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const peoplePages: MetadataRoute.Sitemap = people.map(p => ({
    url: `${BASE}/people/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const decadePages: MetadataRoute.Sitemap = Array.from(decadeSet).map(d => ({
    url: `${BASE}/adaptations/by-decade/${d}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const platformPages: MetadataRoute.Sitemap = platforms.map(p => ({
    url: `${BASE}/adaptations/by-platform/${p.platform.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...adaptationPages,
    ...bookPages,
    ...peoplePages,
    ...decadePages,
    ...platformPages,
  ];
}
