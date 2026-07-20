'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Film, Tv, Star, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdaptationFiltersProps {
  currentParams: { [key: string]: string | undefined };
  totalCount: number;
}

const TYPES = [
  { value: '', label: 'All Types', icon: null },
  { value: 'MOVIE', label: 'Movies', icon: Film },
  { value: 'TV_SERIES', label: 'TV Series', icon: Tv },
  { value: 'MINISERIES', label: 'Miniseries', icon: Tv },
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
  { value: '8', label: '8+ / 10' },
  { value: '7', label: '7+ / 10' },
  { value: '6', label: '6+ / 10' },
  { value: '5', label: '5+ / 10' },
];

const SORTS = [
  { value: 'rating', label: 'Top Rated', icon: Star },
  { value: 'year_desc', label: 'Newest First', icon: Calendar },
  { value: 'year_asc', label: 'Oldest First', icon: Calendar },
  { value: 'title', label: 'A–Z', icon: null },
];

export function AdaptationFilters({
  currentParams,
  totalCount,
}: AdaptationFiltersProps) {
  const router = useRouter();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams();
    // Preserve all current params except the one being changed
    Object.entries(currentParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/adaptations?${params.toString()}`);
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => updateParam('type', value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
              currentParams.type === value || (!currentParams.type && value === '')
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Decade + Rating + Sort row */}
      <div className="flex flex-wrap gap-3">
        {/* Decade */}
        <select
          value={currentParams.decade || ''}
          onChange={e => updateParam('decade', e.target.value)}
          className="px-3 py-1.5 rounded-lg border bg-background text-sm"
        >
          {DECADES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Min Rating */}
        <select
          value={currentParams.minRating || ''}
          onChange={e => updateParam('minRating', e.target.value)}
          className="px-3 py-1.5 rounded-lg border bg-background text-sm"
        >
          {RATINGS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentParams.sort || 'rating'}
          onChange={e => updateParam('sort', e.target.value)}
          className="px-3 py-1.5 rounded-lg border bg-background text-sm"
        >
          {SORTS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Result count */}
        <span className="self-center text-sm text-muted-foreground ml-auto">
          {totalCount} {totalCount === 1 ? 'result' : 'results'}
        </span>
      </div>
    </div>
  );
}
