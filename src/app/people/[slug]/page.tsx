import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { Star } from 'lucide-react';

export async function generateStaticParams() {
  const people = await prisma.person.findMany({ select: { slug: true } });
  return people.map(p => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const person = await prisma.person.findUnique({ where: { slug } });
  if (!person) return {};
  const title = `${person.name} — Stephen King Adaptations`;
  const roles: string[] = [];
  if (person.role === 'DIRECTOR' || person.role === 'BOTH') roles.push('director');
  if (person.role === 'ACTOR' || person.role === 'BOTH') roles.push('actor');
  const description = `${person.name} — ${roles.join(' and ')} in Stephen King film and TV adaptations.`;
  return { title, description };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = await prisma.person.findUnique({
    where: { slug },
    include: {
      directedWorks: {
        orderBy: { releaseYear: 'desc' },
        include: {
          ratings: true,
          book: { select: { title: true, slug: true } },
        },
      },
      castInWorks: {
        include: {
          adaptation: {
            include: {
              ratings: true,
              book: { select: { title: true, slug: true } },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!person) notFound();

  const roleLabel = person.role === 'DIRECTOR' ? 'Director'
    : person.role === 'ACTOR' ? 'Actor'
    : 'Director / Actor';
  const workCount = person.directedWorks.length + person.castInWorks.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {' › '}
        <span className="text-foreground">{person.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4 mb-10">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-primary">
            {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold">{person.name}</h1>
          {person.nameCn && (
            <p className="text-xl text-muted-foreground mt-1">{person.nameCn}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {roleLabel} · {workCount} Stephen King {workCount === 1 ? 'adaptation' : 'adaptations'}
          </p>
        </div>
      </div>

      {/* Directed Works */}
      {person.directedWorks.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">
            🎬 Directed ({person.directedWorks.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {person.directedWorks.map(a => (
              <AdaptationMiniCard key={a.id} adaptation={a} />
            ))}
          </div>
        </section>
      )}

      {/* Acting Roles */}
      {person.castInWorks.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">
            🎭 Acting Roles ({person.castInWorks.length})
          </h2>
          <div className="space-y-2">
            {person.castInWorks.map(cm => (
              <Link
                key={cm.adaptation.id}
                href={`/adaptations/${cm.adaptation.slug}`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card
                           hover:border-primary/50 hover:shadow-sm transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {cm.adaptation.title}
                  </span>
                  {cm.characterName && (
                    <span className="text-muted-foreground ml-2">
                      as <em>{cm.characterName}</em>
                    </span>
                  )}
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {cm.adaptation.releaseYear} · {cm.adaptation.type.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm shrink-0">
                  {cm.adaptation.ratings.find(r => r.source === 'IMDB') && (
                    <>
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold">
                        {cm.adaptation.ratings.find(r => r.source === 'IMDB')!.score.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {workCount === 0 && (
        <p className="text-muted-foreground text-center py-16">
          No Stephen King adaptations found for this person.
        </p>
      )}
    </div>
  );
}

/** Compact adaptation card for the director section */
function AdaptationMiniCard({
  adaptation,
}: {
  adaptation: any;
}) {
  const imdb = adaptation.ratings?.find((r: any) => r.source === 'IMDB');
  return (
    <Link
      href={`/adaptations/${adaptation.slug}`}
      className="group flex gap-3 p-3 rounded-lg border bg-card hover:border-primary/50 transition-all"
    >
      <div className="relative w-12 h-18 rounded overflow-hidden bg-muted shrink-0">
        {adaptation.posterImage ? (
          <Image
            src={adaptation.posterImage}
            alt={adaptation.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-lg">🎬</div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
          {adaptation.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {adaptation.releaseYear} · {adaptation.type.replace(/_/g, ' ')}
          {imdb && (
            <span className="ml-1">· ⭐ {imdb.score.toFixed(1)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
