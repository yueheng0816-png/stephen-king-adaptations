import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { AdaptationGrid } from '@/components/adaptation/adaptation-grid';

export const metadata: Metadata = {
  title: 'Search Stephen King Adaptations',
  description: 'Search for Stephen King movies, TV shows, books, and directors.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

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

  const adaptations = await prisma.adaptation.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { titleCn: { contains: q } },
        { overview: { contains: q } },
        { overviewCn: { contains: q } },
      ],
    },
    include: {
      ratings: true,
      streamingLinks: { select: { platform: true } },
      book: { select: { title: true, slug: true } },
    },
    take: 30,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">
        Search: &ldquo;{q}&rdquo;
      </h1>
      <p className="text-muted-foreground mb-8">
        {adaptations.length} {adaptations.length === 1 ? 'result' : 'results'}
      </p>

      {adaptations.length > 0 ? (
        <AdaptationGrid adaptations={adaptations} />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">🤷</p>
          <p>No results for &ldquo;{q}&rdquo;. Try a different search term.</p>
        </div>
      )}
    </div>
  );
}
