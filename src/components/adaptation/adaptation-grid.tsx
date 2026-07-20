import type { Adaptation, Rating } from '@prisma/client';
import { AdaptationCard } from './adaptation-card';

interface AdaptationGridItem extends Adaptation {
  ratings: Rating[];
  book?: { title: string; slug: string } | null;
  streamingLinks?: Array<{ platform: string }>;
}

interface AdaptationGridProps {
  adaptations: AdaptationGridItem[];
  columns?: 2 | 3 | 4 | 5;
}

export function AdaptationGrid({
  adaptations,
  columns = 4,
}: AdaptationGridProps) {
  if (adaptations.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-xl font-semibold mb-2">No adaptations found</p>
        <p className="text-muted-foreground">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  const gridCols = {
    2: 'grid-cols-2 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 sm:gap-6`}>
      {adaptations.map(adaptation => (
        <AdaptationCard key={adaptation.id} adaptation={adaptation} />
      ))}
    </div>
  );
}
