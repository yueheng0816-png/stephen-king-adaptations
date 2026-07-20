import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { generateAdaptationMetadata } from '@/lib/seo';
import { getAdaptationTypeLabel } from '@/lib/utils';
import { RatingBadge } from '@/components/adaptation/rating-badge';
import { LangText } from '@/components/lang-text';
import { ReviewRenderer, DiffRenderer } from '@/components/adaptation/review-renderer';
import {
  Star, Clock, Film, Tv, User, BookOpen, ExternalLink,
} from 'lucide-react';

export async function generateStaticParams() {
  const adaptations = await prisma.adaptation.findMany({
    select: { slug: true },
  });
  return adaptations.map(a => ({ slug: a.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const adaptation = await prisma.adaptation.findUnique({
    where: { slug },
    include: {
      book: true,
      director: true,
      ratings: true,
    },
  });
  if (!adaptation) return {};
  return generateAdaptationMetadata(adaptation);
}

export default async function AdaptationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adaptation = await prisma.adaptation.findUnique({
    where: { slug },
    include: {
      book: true,
      director: true,
      cast: {
        include: { person: true },
        orderBy: { order: 'asc' },
        take: 15,
      },
      ratings: true,
      streamingLinks: {
        orderBy: { linkType: 'asc' },
      },
      differences: true,
    },
  });

  if (!adaptation) notFound();

  const imdbRating = adaptation.ratings.find(r => r.source === 'IMDB');

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1 flex-wrap">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>›</span>
        <Link href="/adaptations" className="hover:text-foreground">Adaptations</Link>
        <span>›</span>
        <span className="text-foreground font-medium truncate">{adaptation.title}</span>
      </nav>

      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Poster */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-muted">
          {adaptation.posterImage ? (
            <Image
              src={adaptation.posterImage}
              alt={`${adaptation.title} poster`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
              placeholder="blur"
              blurDataURL={adaptation.posterBlurData || undefined}
              priority
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <span className="text-5xl mb-2">🎬</span>
              <span className="text-sm">No Poster Yet</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:col-span-2 space-y-5">
          {/* Title */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {adaptation.title}
              {adaptation.releaseYear && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({adaptation.releaseYear})
                </span>
              )}
            </h1>
            {adaptation.titleCn && (
              <p className="text-xl text-muted-foreground mt-1">{adaptation.titleCn}</p>
            )}
          </div>

          {/* Ratings */}
          {adaptation.ratings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {adaptation.ratings.map(r => (
                <RatingBadge
                  key={r.source}
                  source={r.source}
                  score={r.score}
                  maxScore={r.maxScore}
                  voteCount={r.voteCount}
                  size="md"
                />
              ))}
            </div>
          )}

          {/* Quick Meta */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {adaptation.runtime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {adaptation.runtime} min
              </span>
            )}
            <span className="flex items-center gap-1">
              {adaptation.type.includes('TV') ? <Tv className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
              {getAdaptationTypeLabel(adaptation.type)}
            </span>
            {adaptation.mpaaRating && (
              <span className="px-1.5 py-0.5 rounded border text-xs">{adaptation.mpaaRating}</span>
            )}
          </div>

          {/* Based on */}
          {adaptation.book && (
            <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Based on Stephen King&apos;s
                </p>
                <Link
                  href={`/books/${adaptation.book.slug}`}
                  className="font-semibold hover:text-primary transition-colors"
                >
                  {adaptation.book.title}
                </Link>
                {adaptation.book.publicationYear && (
                  <span className="text-muted-foreground text-sm">
                    {' '}({adaptation.book.publicationYear})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Director + Top Cast */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {adaptation.director && (
              <div>
                <p className="text-sm font-semibold mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Director
                </p>
                <Link
                  href={`/people/${adaptation.director.slug}`}
                  className="text-sm hover:text-primary transition-colors"
                >
                  {adaptation.director.name}
                </Link>
              </div>
            )}
            {adaptation.cast.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-1">Cast</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {adaptation.cast.slice(0, 5).map((c, i) => (
                    <span key={c.personId}>
                      <Link
                        href={`/people/${c.person.slug}`}
                        className="hover:text-foreground hover:underline"
                      >
                        {c.person.name}
                      </Link>
                      {c.characterName && (
                        <span className="text-xs"> as {c.characterName}</span>
                      )}
                      {i < Math.min(adaptation.cast.length, 5) - 1 && ', '}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Overview | Cast | vs. Book | Trivia */}
      <div className="space-y-10">
        {/* Overview: Chinese AI content when zh + available, English when en */}
        {adaptation.overviewCn ? (
          <section>
            <h2 className="text-2xl font-bold mb-4">
              <LangText en="📝 Overview" zh="📝 剧情简介" tag="span" />
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              <LangText
                en={adaptation.overview || 'Overview coming soon.'}
                zh={adaptation.overviewCn}
                tag="span"
              />
            </p>
          </section>
        ) : (
          <section>
            <h2 className="text-2xl font-bold mb-4">📝 Overview</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {adaptation.overview || 'Overview coming soon.'}
            </p>
          </section>
        )}

        {/* Review & Analysis */}
        {(adaptation.review || adaptation.reviewEn) && (
          <section>
            <h2 className="text-2xl font-bold mb-4">
              <LangText en="📝 Review & Analysis" zh="📝 评价分析" tag="span" />
            </h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none
              prose-headings:text-foreground prose-p:text-muted-foreground
              prose-strong:text-foreground prose-a:text-primary">
              <ReviewRenderer reviewZh={adaptation.review} reviewEn={adaptation.reviewEn} />
            </div>
          </section>
        )}

        {/* Full Cast */}
        {adaptation.cast.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">🎭 Full Cast</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {adaptation.cast.map(c => (
                <div
                  key={c.personId}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <Link
                      href={`/people/${c.person.slug}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {c.person.name}
                    </Link>
                    {c.characterName && (
                      <p className="text-xs text-muted-foreground">{c.characterName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Book Differences */}
        {adaptation.differences.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">
              <LangText en="📖 How It Differs From the Book" zh="📖 与原著的主要差异" tag="span" />
            </h2>
            <div className="space-y-3">
              <DiffRenderer differences={adaptation.differences} />
            </div>
          </section>
        )}

        {/* Streaming — placeholder until pipeline runs */}
        {adaptation.streamingLinks.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">📺 Where to Watch</h2>
            <div className="space-y-2">
              {adaptation.streamingLinks.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <span>{link.platform.replace(/_/g, ' ')}</span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {link.price || link.linkType.replace(/_/g, ' ')}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Related */}
      {adaptation.book && (
        <section className="mt-16 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">
            More from &ldquo;{adaptation.book.title}&rdquo;
          </h2>
          <RelatedAdaptations
            bookId={adaptation.bookId!}
            currentSlug={adaptation.slug}
          />
        </section>
      )}
    </main>
  );
}

/** Server component for related adaptations from the same book */
async function RelatedAdaptations({
  bookId,
  currentSlug,
}: {
  bookId: string;
  currentSlug: string;
}) {
  const related = await prisma.adaptation.findMany({
    where: {
      bookId,
      slug: { not: currentSlug },
    },
    include: {
      ratings: true,
    },
    orderBy: { releaseYear: 'desc' },
  });

  if (related.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {related.map(a => (
        <Link
          key={a.id}
          href={`/adaptations/${a.slug}`}
          className="group block rounded-lg border bg-card overflow-hidden hover:shadow-md transition-all"
        >
          <div className="relative aspect-[2/3] bg-muted">
            {a.posterImage ? (
              <Image
                src={a.posterImage}
                alt={a.title}
                fill
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-3xl">🎬</div>
            )}
          </div>
          <div className="p-3">
            <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
              {a.title}
            </p>
            <p className="text-xs text-muted-foreground">{a.releaseYear}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
