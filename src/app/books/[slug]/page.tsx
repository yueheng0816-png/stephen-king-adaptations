import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getAllBookSlugs } from '@/lib/adaptations';
import { BookOpen, Film, Clock, Hash, ExternalLink, ShoppingBag, Tablet } from 'lucide-react';

export async function generateStaticParams() {
  return (await getAllBookSlugs()).map(slug => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    include: { _count: { select: { adaptations: true } } },
  });
  if (!book) return {};
  return {
    title: `${book.title} (${book.publicationYear || 'N/A'}) — Stephen King Book`,
    description: book.description || `${book.title} by Stephen King. ${book._count.adaptations} screen adaptations.`,
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    include: {
      adaptations: {
        orderBy: { releaseYear: 'desc' },
        include: {
          ratings: true,
          director: { select: { name: true, slug: true } },
        },
      },
      collections: { include: { collection: true } },
    },
  });

  if (!book) notFound();

  const typeLabel = (t: string) =>
    ({ NOVEL: 'Novel', COLLECTION: 'Collection', SHORT_STORY: 'Short Story', NOVELLA: 'Novella' })[t] || t;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {' › '}
        <Link href="/books" className="hover:text-foreground">Books</Link>
        {' › '}
        <span className="text-foreground">{book.title}</span>
      </nav>

      {/* Hero: Cover + Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Book Cover */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-muted">
          {book.coverImage ? (
            <Image
              src={book.coverImage}
              alt={`${book.title} book cover`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <BookOpen className="w-16 h-16 mb-3 opacity-30" />
              <span className="text-sm">Cover unavailable</span>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="md:col-span-2 space-y-5">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{book.title}</h1>
            {book.titleCn && (
              <p className="text-xl text-muted-foreground mt-1">{book.titleCn}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">by Stephen King</p>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm">
            {book.publicationYear && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                Published {book.publicationYear}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              {typeLabel(book.type)}
            </span>
            {book.pageCount && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="w-4 h-4" />
                {book.pageCount} pages
              </span>
            )}
            {book.isbn && (
              <span className="text-xs text-muted-foreground font-mono mt-1 block w-full">
                ISBN: {book.isbn}
              </span>
            )}
          </div>

          {/* Description */}
          {(book.descriptionCn || book.description) && (
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-muted-foreground leading-relaxed">
                {book.descriptionCn || book.description}
              </p>
            </div>
          )}

          {/* Buy Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {book.amazonUrl && (
              <a
                href={book.amazonUrl}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
                           bg-amber-500 hover:bg-amber-600 text-white font-semibold
                           transition-colors shadow-lg shadow-amber-500/20"
              >
                <ShoppingBag className="w-5 h-5" />
                Buy Paperback on Amazon
              </a>
            )}
            {book.kindleUrl && (
              <a
                href={book.kindleUrl}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
                           border-2 border-amber-500 text-amber-500 hover:bg-amber-500
                           hover:text-white font-semibold transition-colors"
              >
                <Tablet className="w-5 h-5" />
                Buy Kindle eBook
              </a>
            )}
            {book.goodreadsUrl && (
              <a
                href={book.goodreadsUrl}
                target="_blank"
                rel="nofollow noopener"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
                           border text-muted-foreground hover:text-foreground
                           hover:bg-muted transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Goodreads
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            As an Amazon Associate, we earn from qualifying purchases.
          </p>
        </div>
      </div>

      {/* Adaptations */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Film className="w-6 h-6" />
          Screen Adaptations ({book.adaptations.length})
        </h2>

        {book.adaptations.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No adaptations yet — check back later or browse the{' '}
            <Link href="/adaptations" className="text-primary hover:underline">full list</Link>.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {book.adaptations.map(a => {
              const imdb = a.ratings.find((r: any) => r.source === 'IMDB');
              return (
                <Link
                  key={a.id}
                  href={`/adaptations/${a.slug}`}
                  className="group flex gap-3 p-3 rounded-lg border bg-card
                             hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                    {a.posterImage ? (
                      <Image src={a.posterImage} alt={a.title} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">🎬</div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {a.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.releaseYear} · {a.type.replace(/_/g, ' ')}
                    </p>
                    {a.director && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Dir. {a.director.name}
                      </p>
                    )}
                    {imdb && (
                      <p className="text-xs font-semibold mt-1">⭐ {imdb.score.toFixed(1)}/10</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Collections (Dark Tower etc.) */}
      {book.collections.length > 0 && (
        <section className="mt-12 pt-8 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Part of Series
          </h3>
          <div className="flex flex-wrap gap-2">
            {book.collections.map(cm => (
              <span
                key={cm.collection.id}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {cm.collection.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
