import { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { SearchClient } from './search-client';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Search Stephen King Adaptations',
  description: 'Search for Stephen King movies, TV shows, books, and directors.',
};

export default async function SearchPage() {
  // Fetch all data at build time — no runtime DB access
  const adaptations = await prisma.adaptation.findMany({
    orderBy: { rating: 'desc' },
    include: {
      ratings: true,
      streamingLinks: { select: { platform: true } },
      book: { select: { title: true, slug: true } },
    },
  });

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground">Loading search...</p>
      </div>
    }>
      <SearchClient allItems={adaptations} />
    </Suspense>
  );
}
