import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { AdaptationGrid } from '@/components/adaptation/adaptation-grid';

const VALID_DECADES = ['2020s', '2010s', '2000s', '1990s', '1980s', '1970s'];

export async function generateStaticParams() {
  return VALID_DECADES.map(decade => ({ decade }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ decade: string }>;
}): Promise<Metadata> {
  const { decade } = await params;
  return {
    title: `Stephen King Adaptations — ${decade}`,
    description: `All Stephen King movie and TV adaptations from the ${decade}. Browse by year and rating.`,
  };
}

export default async function ByDecadePage({
  params,
}: {
  params: Promise<{ decade: string }>;
}) {
  const { decade } = await params;

  if (!VALID_DECADES.includes(decade)) notFound();

  const startYear = parseInt(decade);
  const endYear = startYear + 9;

  const adaptations = await prisma.adaptation.findMany({
    where: {
      releaseYear: { gte: startYear, lte: endYear },
    },
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
        {decade} Stephen King Adaptations
      </h1>
      <p className="text-muted-foreground mb-8">
        {adaptations.length} {adaptations.length === 1 ? 'adaptation' : 'adaptations'} from {startYear}–{endYear}
      </p>

      <AdaptationGrid adaptations={adaptations} />

      {adaptations.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">📅</p>
          <p>No adaptations found for this decade yet.</p>
        </div>
      )}
    </div>
  );
}
