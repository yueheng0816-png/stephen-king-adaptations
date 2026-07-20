import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { BookOpen, Film, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Stephen King Books — Complete Bibliography of Adapted Works',
  description: 'Every Stephen King book, novella, and short story collection that has been adapted into a movie or TV series.',
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

  const typeLabel = (t: string) =>
    ({ NOVEL: 'Novel', COLLECTION: 'Collection', SHORT_STORY: 'Short Story', NOVELLA: 'Novella' })[t] || t;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
        <BookOpen className="w-8 h-8" />
        Stephen King Books
      </h1>
      <p className="text-muted-foreground mb-10">
        {books.length} novels, novellas, collections, and stories adapted for the screen
      </p>

      {books.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">📚</p>
          <p>Book data is being loaded. Run the pipeline to populate books.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {books.map(book => (
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
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full
                                  px-2 py-0.5 flex items-center gap-1 text-xs font-medium">
                    <Film className="w-3 h-3" />
                    {book._count.adaptations}
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
                  <span>{typeLabel(book.type)}</span>
                </div>
                {book.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 pt-1 leading-relaxed">
                    {book.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
