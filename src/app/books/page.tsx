import { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { BookOpen } from 'lucide-react';
import { BooksClient } from './books-client';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Stephen King Books — Complete Bibliography of Adapted Works',
  description:
    'Every Stephen King novel, novella, collection, and short story adapted for the screen. Filter by type, decade, and series.',
};

export default async function BooksPage() {
  const books = await prisma.book.findMany({
    orderBy: { publicationYear: 'desc' },
    include: {
      _count: { select: { adaptations: true } },
      adaptations: {
        take: 1,
        select: { posterImage: true },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
        <BookOpen className="w-8 h-8" />
        Stephen King Books
      </h1>
      <p className="text-muted-foreground mb-10">
        {books.length} novels, novellas, collections, and stories adapted for the screen
      </p>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
                <div className="aspect-[2/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <BooksClient books={books} />
      </Suspense>
    </div>
  );
}
