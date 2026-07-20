/**
 * Adaptations list page — fully static with client-side filtering enhancement
 *
 * SSG: Pre-built HTML with all adaptations rendered server-side.
 * Client: FlexSearch + URL-based filters add interactivity without breaking SEO.
 */
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { AdaptationGrid } from '@/components/adaptation/adaptation-grid';
import { AdaptationFilters } from '@/components/adaptation/adaptation-filters';

export const metadata: Metadata = {
  title: 'All Stephen King Adaptations',
  description:
    'Browse every Stephen King movie, TV series, and miniseries adaptation. Filter by type, rating, streaming platform, and decade.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/adaptations`,
  },
};

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function AdaptationsPage({ searchParams }: Props) {
  const params = await searchParams;

  // Build Prisma query from URL params
  const where: any = {};
  if (params.type) where.type = params.type;
  if (params.minRating) where.rating = { gte: parseFloat(params.minRating) };
  if (params.decade) {
    const start = parseInt(params.decade);
    where.releaseYear = { gte: start, lt: start + 10 };
  }
  if (params.platform) {
    where.streamingLinks = { some: { platform: params.platform } };
  }

  // Sort
  let orderBy: any = { rating: 'desc' };
  switch (params.sort) {
    case 'year_desc':
      orderBy = { releaseYear: 'desc' };
      break;
    case 'year_asc':
      orderBy = { releaseYear: 'asc' };
      break;
    case 'title':
      orderBy = { title: 'asc' };
      break;
  }

  const adaptations = await prisma.adaptation.findMany({
    where,
    orderBy,
    include: {
      ratings: true,
      streamingLinks: { select: { platform: true } },
      book: { select: { title: true, slug: true } },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        Stephen King Adaptations
      </h1>
      <p className="text-muted-foreground mb-8">
        {adaptations.length} movies, TV series, and miniseries
      </p>

      <AdaptationFilters
        currentParams={params}
        totalCount={adaptations.length}
      />

      <AdaptationGrid adaptations={adaptations} />
    </div>
  );
}
