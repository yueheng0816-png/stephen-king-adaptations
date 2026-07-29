'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdaptationGrid } from '@/components/adaptation/adaptation-grid';
import { cn } from '@/lib/utils';
import type { Adaptation, Rating } from '@prisma/client';

type AdaptationWithRelations = Adaptation & {
  ratings: Rating[];
  streamingLinks: Array<{ platform: string }>;
  book: { title: string; slug: string } | null;
};

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'TV_SERIES', label: 'TV Series' },
  { value: 'MINISERIES', label: 'Miniseries' },
  { value: 'TV_MOVIE', label: 'TV Movies' },
];

const DECADES = [
  { value: '', label: 'All Years' },
  { value: '2020', label: '2020s' },
  { value: '2010', label: '2010s' },
  { value: '2000', label: '2000s' },
  { value: '1990', label: '1990s' },
  { value: '1980', label: '1980s' },
  { value: '1970', label: '1970s' },
];

const RATINGS = [
  { value: '', label: 'Any Rating' },
  { value: '8', label: '8+' },
  { value: '7', label: '7+' },
  { value: '6', label: '6+' },
  { value: '5', label: '5+' },
];

const SORTS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'year_desc', label: 'Newest' },
  { value: 'year_asc', label: 'Oldest' },
  { value: 'title', label: 'A–Z' },
];

function activeClass(selected: boolean) {
  return cn(
    'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
    selected
      ? 'bg-primary text-primary-foreground border-primary'
      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40',
  );
}

export function AdaptationsClient({
  adaptations,
}: {
  adaptations: AdaptationWithRelations[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type') || '';
  const decade = searchParams.get('decade') || '';
  const minRating = searchParams.get('minRating') || '';
  const sort = searchParams.get('sort') || 'rating';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/adaptations?${params.toString()}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    let result = [...adaptations];

    if (type) result = result.filter(a => a.type === type);

    if (decade) {
      const start = parseInt(decade);
      result = result.filter(
        a => a.releaseYear && a.releaseYear >= start && a.releaseYear < start + 10,
      );
    }

    if (minRating) {
      const min = parseFloat(minRating);
      result = result.filter(a => a.rating && a.rating >= min);
    }

    switch (sort) {
      case 'year_desc':
        result.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
        break;
      case 'year_asc':
        result.sort((a, b) => (a.releaseYear || 0) - (b.releaseYear || 0));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [adaptations, type, decade, minRating, sort]);

  return (
    <>
      {/* Filters */}
      <div className="space-y-3 mb-8">
        {/* Type */}
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam('type', value)}
              className={activeClass(type === value || (!type && value === ''))}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Decade */}
        <div className="flex flex-wrap gap-1.5">
          {DECADES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam('decade', value)}
              className={activeClass(decade === value || (!decade && value === ''))}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Rating + Sort + Count */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Rating:</span>
          {RATINGS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam('minRating', value)}
              className={activeClass(minRating === value || (!minRating && value === ''))}
            >
              {label}
            </button>
          ))}

          <span className="text-xs text-muted-foreground ml-4 mr-1">Sort:</span>
          {SORTS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam('sort', value)}
              className={activeClass(sort === value || (!sort && value === 'rating'))}
            >
              {label}
            </button>
          ))}

          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>

      <AdaptationGrid adaptations={filtered} />
    </>
  );
}
