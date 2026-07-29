'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdaptationGrid } from '@/components/adaptation/adaptation-grid';
import type { Adaptation, Rating } from '@prisma/client';

type AdaptationWithRelations = Adaptation & {
  ratings: Rating[];
  streamingLinks: Array<{ platform: string }>;
  book: { title: string; slug: string } | null;
};

const SELECT_CLASS =
  'px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm cursor-pointer';

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

    if (platform) {
      result = result.filter(a => a.streamingLinks.some(l => l.platform === platform));
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
  }, [adaptations, type, decade, minRating, platform, sort]);

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Type */}
        <select
          value={type}
          onChange={e => updateParam('type', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">All Types</option>
          <option value="MOVIE">Movies</option>
          <option value="TV_SERIES">TV Series</option>
          <option value="MINISERIES">Miniseries</option>
          <option value="TV_MOVIE">TV Movies</option>
        </select>

        {/* Decade */}
        <select
          value={decade}
          onChange={e => updateParam('decade', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">All Years</option>
          <option value="2020">2020s</option>
          <option value="2010">2010s</option>
          <option value="2000">2000s</option>
          <option value="1990">1990s</option>
          <option value="1980">1980s</option>
          <option value="1970">1970s</option>
        </select>

        {/* Rating */}
        <select
          value={minRating}
          onChange={e => updateParam('minRating', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Any Rating</option>
          <option value="8">8+ / 10</option>
          <option value="7">7+ / 10</option>
          <option value="6">6+ / 10</option>
          <option value="5">5+ / 10</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => updateParam('sort', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="rating">Top Rated</option>
          <option value="year_desc">Newest First</option>
          <option value="year_asc">Oldest First</option>
          <option value="title">A–Z</option>
        </select>

        {/* Count */}
        <span className="self-center text-sm text-muted-foreground ml-auto">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      <AdaptationGrid adaptations={filtered} />
    </>
  );
}
