'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BookOpen, Film, Clock } from 'lucide-react';
import type { Book } from '@prisma/client';

type BookWithRelations = Book & {
  _count: { adaptations: number };
  adaptations: Array<{ posterImage: string | null }>;
};

// ── Filter categories ──────────────────────────────────────────────

const TYPES = [
  { value: '', label: 'All Books' },
  { value: 'NOVEL', label: 'Novels' },
  { value: 'COLLECTION', label: 'Collections' },
  { value: 'NOVELLA', label: 'Novellas' },
  { value: 'SHORT_STORY', label: 'Short Stories' },
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

const SORTS = [
  { value: 'year_desc', label: 'Newest' },
  { value: 'year_asc', label: 'Oldest' },
  { value: 'title', label: 'A–Z' },
  { value: 'adaptations', label: 'Most Adaptations' },
];

// ── Known Stephen King series ──────────────────────────────────────
// Maps book slugs → series key. Only the most prominent novel series
// are listed; short-story collections and their contents are handled
// by the type filter (COLLECTION / SHORT_STORY).

const SERIES_GROUPS = [
  { value: '', label: 'All Series' },
  { value: 'bill-hodges', label: 'Bill Hodges Trilogy' },
  { value: 'shining', label: 'The Shining Saga' },
];

const SERIES_SLUGS: Record<string, string[]> = {
  'bill-hodges': ['mr-mercedes', 'finders-keepers', 'end-of-watch'],
  shining: ['the-shining', 'doctor-sleep'],
};

function getSeriesKey(slug: string): string | null {
  for (const [key, slugs] of Object.entries(SERIES_SLUGS)) {
    if (slugs.includes(slug)) return key;
  }
  return null;
}

// ── Helpers ────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  NOVEL: 'Novel',
  COLLECTION: 'Collection',
  SHORT_STORY: 'Short Story',
  NOVELLA: 'Novella',
};

function activeClass(selected: boolean) {
  return cn(
    'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
    selected
      ? 'bg-primary text-primary-foreground border-primary'
      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40',
  );
}

// ── Component ──────────────────────────────────────────────────────

export function BooksClient({ books }: { books: BookWithRelations[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type') || '';
  const decade = searchParams.get('decade') || '';
  const series = searchParams.get('series') || '';
  const sort = searchParams.get('sort') || 'year_desc';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/books?${params.toString()}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    let result = [...books];

    // Type filter
    if (type) result = result.filter(b => b.type === type);

    // Decade filter
    if (decade) {
      const start = parseInt(decade);
      result = result.filter(
        b => b.publicationYear && b.publicationYear >= start && b.publicationYear < start + 10,
      );
    }

    // Series filter
    if (series) {
      const slugs = SERIES_SLUGS[series];
      result = result.filter(b => slugs.includes(b.slug));
    }

    // Sort
    switch (sort) {
      case 'year_asc':
        result.sort((a, b) => (a.publicationYear || 0) - (b.publicationYear || 0));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'adaptations':
        result.sort((a, b) => b._count.adaptations - a._count.adaptations);
        break;
      case 'year_desc':
      default:
        result.sort((a, b) => (b.publicationYear || 0) - (a.publicationYear || 0));
        break;
    }

    return result;
  }, [books, type, decade, series, sort]);

  if (books.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-5xl mb-4">📚</p>
        <p>Book data is being loaded. Run the pipeline to populate books.</p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="space-y-3 mb-8">
        {/* Type row */}
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

        {/* Decade row */}
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

        {/* Series + Sort + Count row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Series:</span>
          {SERIES_GROUPS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam('series', value)}
              className={activeClass(series === value || (!series && value === ''))}
            >
              {label}
            </button>
          ))}

          <span className="text-xs text-muted-foreground ml-4 mr-1">Sort:</span>
          {SORTS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam('sort', value)}
              className={activeClass(sort === value || (!sort && value === 'year_desc'))}
            >
              {label}
            </button>
          ))}

          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} {filtered.length === 1 ? 'book' : 'books'}
          </span>
        </div>
      </div>

      {/* Book grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(book => {
          const seriesKey = getSeriesKey(book.slug);
          const firstPoster = book.adaptations?.[0]?.posterImage ?? null;

          return (
            <Link
              key={book.id}
              href={`/books/${book.slug}`}
              className="group flex flex-col rounded-xl border bg-card overflow-hidden
                         hover:border-primary/50 hover:shadow-lg transition-all"
            >
              {/* Cover */}
              <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                {book.coverImage ? (
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <BookOpen className="w-12 h-12 mb-2 opacity-20" />
                    <span className="text-xs opacity-50">No cover</span>
                  </div>
                )}

                {/* Adaptation count badge */}
                {book._count.adaptations > 0 && (
                  <div
                    className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full
                                  px-2 py-0.5 flex items-center gap-1 text-xs font-medium"
                  >
                    <Film className="w-3 h-3" />
                    {book._count.adaptations}
                  </div>
                )}

                {/* Series badge */}
                {seriesKey && (
                  <div
                    className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm rounded-full
                                  px-2 py-0.5 text-xs font-medium text-primary-foreground"
                  >
                    {SERIES_GROUPS.find(g => g.value === seriesKey)?.label ?? seriesKey}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2 flex-1">
                <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {book.title}
                </h3>
                {book.titleCn && (
                  <p className="text-sm text-muted-foreground">{book.titleCn}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  {book.publicationYear && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {book.publicationYear}
                    </span>
                  )}
                  <span>{TYPE_LABEL[book.type] || book.type}</span>
                </div>
                {book.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 pt-1 leading-relaxed">
                    {book.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* No results */}
      {filtered.length === 0 && books.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-3xl mb-2">🔍</p>
          <p>No books match the current filters.</p>
          <button
            onClick={() => router.push('/books')}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </>
  );
}
