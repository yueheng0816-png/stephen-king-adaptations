import type { Metadata } from 'next';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getAdaptationTypeLabel, formatRating } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Top Rated Stephen King Adaptations',
  description:
    'The best Stephen King movie and TV adaptations ranked by IMDb rating. From The Shawshank Redemption to The Shining.',
};

export default async function TopRatedPage() {
  const adaptations = await prisma.adaptation.findMany({
    where: { rating: { not: null } },
    orderBy: { rating: 'desc' },
    take: 50,
    include: {
      ratings: true,
      book: { select: { title: true, slug: true } },
      director: { select: { name: true, slug: true } },
    },
  });

  const imdbScore = (ratings: any[]) => {
    const r = ratings.find((r: any) => r.source === 'IMDB');
    return r ? `${r.score.toFixed(1)}` : '—';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        🏆 Top Rated Stephen King Adaptations
      </h1>
      <p className="text-muted-foreground mb-8">
        Ranked by IMDb rating. Click any title for details, streaming links, and book comparisons.
      </p>

      <div className="space-y-1">
        {adaptations.map((a, i) => (
          <Link
            key={a.id}
            href={`/adaptations/${a.slug}`}
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            {/* Rank */}
            <div className="w-10 text-center shrink-0">
              <span className={`
                text-lg font-bold
                ${i < 3 ? 'text-yellow-500' : i < 10 ? 'text-primary' : 'text-muted-foreground'}
              `}>
                {i + 1}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold group-hover:text-primary transition-colors truncate">
                  {a.title}
                </span>
                {a.titleCn && (
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {a.titleCn}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>{a.releaseYear}</span>
                <span>·</span>
                <span>{getAdaptationTypeLabel(a.type)}</span>
                {a.director && (
                  <>
                    <span>·</span>
                    <span>Dir. {a.director.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                {a.ratings.map((r: any) => (
                  <span key={r.source} className="flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: getSourceColor(r.source) }}
                    />
                    {formatRating(r.score, r.maxScore)}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 ml-4 font-bold text-lg">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                {a.rating?.toFixed(1)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getSourceColor(source: string): string {
  const colors: Record<string, string> = {
    IMDB: '#f5c518',
    ROTTEN_TOMATOES: '#fa320a',
    METACRITIC: '#ffcc00',
  };
  return colors[source] || '#888';
}
