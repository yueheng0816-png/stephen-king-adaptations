import Link from 'next/link';
import { Star, TrendingUp, Clock, Film, Tv, BookOpen } from 'lucide-react';
import { prisma } from '@/lib/db';
import { AdaptationGrid } from '@/components/adaptation/adaptation-grid';
import { SearchBar } from '@/components/search/search-bar';

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour for fresh streaming data

export default async function HomePage() {
  const [topRated, latest, stats] = await Promise.all([
    prisma.adaptation.findMany({
      where: { rating: { not: null } },
      orderBy: { rating: 'desc' },
      take: 8,
      include: {
        ratings: true,
        streamingLinks: { select: { platform: true } },
        book: { select: { title: true, slug: true } },
      },
    }),
    prisma.adaptation.findMany({
      where: { releaseYear: { gte: 2025 } },
      orderBy: { releaseYear: 'desc' },
      take: 8,
      include: {
        ratings: true,
        streamingLinks: { select: { platform: true } },
        book: { select: { title: true, slug: true } },
      },
    }),
    prisma.$transaction([
      prisma.adaptation.count(),
      prisma.book.count(),
      prisma.adaptation.count({ where: { type: { in: ['TV_SERIES', 'MINISERIES'] } } }),
      prisma.adaptation.count({ where: { type: 'MOVIE' } }),
    ]),
  ]);

  const [totalAdaptations, totalBooks, tvCount, movieCount] = stats;

  // For search: collect all adaptation titles for FlexSearch index
  const allForSearch = await prisma.adaptation.findMany({
    select: {
      slug: true,
      title: true,
      titleCn: true,
      releaseYear: true,
      type: true,
      overview: true,
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Stephen King{' '}
            <span className="text-primary">Adaptations</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Every Stephen King movie and TV adaptation — ratings, streaming
            availability, and how they compare to the books.
          </p>

          {/* Search */}
          <div className="max-w-lg mx-auto mb-8">
            <SearchBar items={allForSearch} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <StatCard
              icon={<Film className="w-5 h-5" />}
              value={totalAdaptations}
              label="Adaptations"
            />
            <StatCard
              icon={<BookOpen className="w-5 h-5" />}
              value={totalBooks}
              label="Books Adapted"
            />
            <StatCard
              icon={<Tv className="w-5 h-5" />}
              value={tvCount}
              label="TV & Miniseries"
            />
            <StatCard
              icon={<Star className="w-5 h-5" />}
              value={movieCount}
              label="Movies"
            />
          </div>
        </div>
      </section>

      {/* Top Rated */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">Top Rated</h2>
          </div>
          <Link
            href="/adaptations/top"
            className="text-sm text-primary hover:underline font-medium"
          >
            View Top 50 →
          </Link>
        </div>
        <AdaptationGrid adaptations={topRated} columns={4} />
      </section>

      {/* Latest */}
      {latest.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Latest Adaptations</h2>
            </div>
            <Link
              href="/adaptations?sort=year_desc"
              className="text-sm text-primary hover:underline font-medium"
            >
              All Recent →
            </Link>
          </div>
          <AdaptationGrid adaptations={latest} columns={4} />
        </section>
      )}

      {/* Browse by decade */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Browse by Decade</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { decade: '2020s', start: 2020 },
            { decade: '2010s', start: 2010 },
            { decade: '2000s', start: 2000 },
            { decade: '1990s', start: 1990 },
            { decade: '1980s', start: 1980 },
            { decade: '1970s', start: 1970 },
          ].map(({ decade, start }) => (
            <Link
              key={decade}
              href={`/adaptations/by-decade/${decade}`}
              className="flex items-center justify-center px-4 py-6 rounded-xl border bg-card
                         hover:border-primary/50 hover:bg-muted/50 transition-all
                         text-lg font-semibold text-muted-foreground hover:text-foreground"
            >
              {decade}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Stat card for the hero section */
function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl bg-card border">
      <div className="text-muted-foreground mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
