'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdaptationGrid } from '@/components/adaptation/adaptation-grid';
import type { Adaptation, Rating } from '@prisma/client';

type AdaptationWithRelations = Adaptation & {
  ratings: Rating[];
  streamingLinks: Array<{ platform: string }>;
  book: { title: string; slug: string } | null;
};

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
  const platform = searchParams.get('platform') || '';
  const sort = searchParams.get('sort') || 'rating';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/adaptations?${params.toString()}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    let result = [...adaptations];

    // Type filter
    if (type) {
      result = result.filter(a => a.type === type);
    }

    // Decade filter
    if (decade) {
      const start = parseInt(decade);
      result = result.filter(a => a.releaseYear && a.releaseYear >= start && a.releaseYear < start + 10);
    }

    // Min rating filter
    if (minRating) {
      const min = parseFloat(minRating);
      result = result.filter(a => a.rating && a.rating >= min);
    }

    // Platform filter
    if (platform) {
      result = result.filter(a =>
        a.streamingLinks.some(l => l.platform === platform)
      );
    }

    // Sort
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
      default: // rating
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [adaptations, type, decade, minRating, platform, sort]);

  return (
    <>
      {/* Filters */}
      <div className="space-y-4 mb-8">
        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: '', label: 'All Types' },
            { value: 'MOVIE', label: 'Movies' },
            { value: 'TV_SERIES', label: 'TV Series' },
            { value: 'MINISERIES', label: 'Miniseries' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam('type', value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                type === value || (!type && value === '')
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Decade + Rating + Sort row */}
        <div className="flex flex-wrap gap-3">
          <select
            value={decade}
            onChange={e => updateParam('decade', e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-background text-sm"
          >
            <option value="">All Years</option>
            <option value="2020">2020s</option>
            <option value="2010">2010s</option>
            <option value="2000">2000s</option>
            <option value="1990">1990s</option>
            <option value="1980">1980s</option>
            <option value="1970">1970s</option>
          </select>

          <select
            value={minRating}
            onChange={e => updateParam('minRating', e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-background text-sm"
          >
            <option value="">Any Rating</option>
            <option value="8">8+ / 10</option>
            <option value="7">7+ / 10</option>
            <option value="6">6+ / 10</option>
            <option value="5">5+ / 10</option>
          </select>

          <select
            value={sort}
            onChange={e => updateParam('sort', e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-background text-sm"
          >
            <option value="rating">Top Rated</option>
            <option value="year_desc">Newest First</option>
            <option value="year_asc">Oldest First</option>
            <option value="title">A–Z</option>
          </select>

          <span className="self-center text-sm text-muted-foreground ml-auto">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>

      <AdaptationGrid adaptations={filtered} />
    </>
  );
}
