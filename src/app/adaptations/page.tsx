/**
 * Adaptations list page — fully static SSG with client-side filtering
 *
 * All 88 adaptations are fetched at build time. Filtering by type, decade,
 * platform, rating, and sort is handled client-side without server round-trips.
 */
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { AdaptationsClient } from './adaptations-client';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'All Stephen King Adaptations',
  description:
    'Browse every Stephen King movie, TV series, and miniseries adaptation. Filter by type, rating, streaming platform, and decade.',
};

export default async function AdaptationsPage() {
  const adaptations = await prisma.adaptation.findMany({
    orderBy: { rating: 'desc' },
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

      <Suspense fallback={<div className="text-muted-foreground">Loading filters...</div>}>
        <AdaptationsClient adaptations={adaptations} />
      </Suspense>
    </div>
  );
}
