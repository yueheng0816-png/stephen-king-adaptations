import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getPlatformLabel, formatRating } from '@/lib/utils';
import { Tv, Monitor, MonitorPlay } from 'lucide-react';

export const dynamicParams = false;

export async function generateStaticParams() {
  const platforms = await prisma.streamingLink.findMany({
    select: { platform: true },
    distinct: ['platform'],
  });
  return platforms.map(p => ({ platform: p.platform.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ platform: string }>;
}): Promise<Metadata> {
  const { platform } = await params;
  const label = getPlatformLabel(platform.toUpperCase());
  return {
    title: `Stephen King Adaptations on ${label} — Full Streaming Guide`,
    description: `All Stephen King movies and TV shows available to stream on ${label}. Find ratings, reviews, and book comparisons.`,
  };
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  NETFLIX: <MonitorPlay className="w-6 h-6" />,
  AMAZON_PRIME: <MonitorPlay className="w-6 h-6" />,
  HBO_MAX: <Tv className="w-6 h-6" />,
  HULU: <Monitor className="w-6 h-6" />,
  DISNEY_PLUS: <MonitorPlay className="w-6 h-6" />,
  APPLE_TV_PLUS: <MonitorPlay className="w-6 h-6" />,
  PARAMOUNT_PLUS: <MonitorPlay className="w-6 h-6" />,
  PEACOCK: <Tv className="w-6 h-6" />,
  TUBI: <Tv className="w-6 h-6" />,
  PLUTO_TV: <Tv className="w-6 h-6" />,
};

const LINK_TYPE_LABEL: Record<string, string> = {
  SUBSCRIPTION: 'Included with Subscription',
  FREE_WITH_ADS: 'Free with Ads',
  RENT: 'Available to Rent',
  BUY: 'Available to Buy',
};

const LINK_TYPE_ORDER = ['SUBSCRIPTION', 'FREE_WITH_ADS', 'RENT', 'BUY'];

export default async function ByPlatformPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: platformSlug } = await params;
  const platform = platformSlug.toUpperCase();

  const label = getPlatformLabel(platform);
  if (label === platform) notFound(); // Invalid platform

  // Fetch all streaming links for this platform with adaptation details
  const links = await prisma.streamingLink.findMany({
    where: { platform },
    include: {
      adaptation: {
        include: {
          ratings: true,
          book: { select: { title: true, slug: true } },
          director: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { adaptation: { rating: 'desc' } },
  });

  if (links.length === 0) notFound();

  // Deduplicate adaptations (one adaptation may have multiple link types on same platform)
  const adaptationMap = new Map<string, { adaptation: typeof links[0]['adaptation']; linkTypes: string[] }>();
  for (const link of links) {
    const existing = adaptationMap.get(link.adaptation.id);
    if (existing) {
      existing.linkTypes.push(link.linkType);
    } else {
      adaptationMap.set(link.adaptation.id, {
        adaptation: link.adaptation,
        linkTypes: [link.linkType],
      });
    }
  }

  // Group by link type
  const grouped: Record<string, typeof links[0]['adaptation'][]> = {};
  for (const { adaptation, linkTypes } of adaptationMap.values()) {
    for (const lt of linkTypes) {
      if (!grouped[lt]) grouped[lt] = [];
      if (!grouped[lt].find(a => a.id === adaptation.id)) {
        grouped[lt].push(adaptation);
      }
    }
  }

  const totalUnique = adaptationMap.size;
  const icon = PLATFORM_ICONS[platform] || <MonitorPlay className="w-6 h-6" />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {' › '}
        <Link href="/adaptations" className="hover:text-foreground">
          Adaptations
        </Link>
        {' › '}
        <span className="text-foreground">{label}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary">{icon}</div>
        <h1 className="text-3xl md:text-4xl font-bold">
          Stephen King on {label}
        </h1>
      </div>
      <p className="text-muted-foreground mb-10">
        {totalUnique} Stephen King {totalUnique === 1 ? 'adaptation' : 'adaptations'} available
        on {label}
      </p>

      {/* Grouped by link type */}
      {LINK_TYPE_ORDER.map(lt => {
        const adaptations = grouped[lt];
        if (!adaptations || adaptations.length === 0) return null;
        return (
          <section key={lt} className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
              {LINK_TYPE_LABEL[lt] || lt}
              <span className="text-sm font-normal ml-2">({adaptations.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {adaptations.map(a => {
                const imdb = a.ratings.find((r: any) => r.source === 'IMDB');
                const rt = a.ratings.find((r: any) => r.source === 'ROTTEN_TOMATOES');
                return (
                  <Link
                    key={a.id}
                    href={`/adaptations/${a.slug}`}
                    className="group flex gap-3 p-3 rounded-xl border bg-card
                               hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                      {a.posterImage ? (
                        <Image
                          src={a.posterImage}
                          alt={a.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xl">
                          🎬
                        </div>
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
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {a.director.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {imdb && (
                          <span className="text-xs font-semibold">⭐ {imdb.score.toFixed(1)}</span>
                        )}
                        {rt && (
                          <span className="text-xs text-muted-foreground">
                            🍅 {Math.round(rt.score)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* All platforms nav — dynamically fetched from actual data */}
      <PlatformFooter currentPlatform={platform} />
    </div>
  );
}

async function PlatformFooter({ currentPlatform }: { currentPlatform: string }) {
  const platforms = await prisma.streamingLink.findMany({
    select: { platform: true },
    distinct: ['platform'],
    orderBy: { platform: 'asc' },
  });

  const platformList = platforms.map(p => p.platform);

  if (platformList.length === 0) return null;

  return (
    <footer className="mt-12 pt-8 border-t">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Browse by Other Platforms
      </h3>
      <div className="flex flex-wrap gap-2">
        {platformList.map(p => (
          <Link
            key={p}
            href={`/adaptations/by-platform/${p.toLowerCase()}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              p === currentPlatform
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            {getPlatformLabel(p)}
          </Link>
        ))}
      </div>
    </footer>
    </div>
  );
}
