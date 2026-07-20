'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdaptationGrid } from '@/components/adaptation/adaptation-grid';
import type { Adaptation, Rating } from '@prisma/client';

type AdaptationWithRelations = Adaptation & {
  ratings: Rating[];
  streamingLinks: Array<{ platform: string }>;
  book: { title: string; slug: string } | null;
};

export function SearchClient({
  allItems,
}: {
  allItems: AdaptationWithRelations[];
}) {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const results = useMemo(() => {
    if (!q || q.length < 2) return [];
    const lower = q.toLowerCase();
    return allItems
      .filter(
        a =>
          a.title?.toLowerCase().includes(lower) ||
          a.titleCn?.toLowerCase().includes(lower) ||
          a.overview?.toLowerCase().includes(lower) ||
          a.overviewCn?.toLowerCase().includes(lower),
      )
      .slice(0, 30);
  }, [allItems, q]);

  if (!q || q.length < 2) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground">
          Use the search bar in the header to find Stephen King adaptations, books, and directors.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Search: &ldquo;{q}&rdquo;</h1>
      <p className="text-muted-foreground mb-8">
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </p>

      {results.length > 0 ? (
        <AdaptationGrid adaptations={results} />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">🤷</p>
          <p>
            No results for &ldquo;{q}&rdquo;. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}
