import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Adaptation, Rating } from '@prisma/client';
import { getAdaptationTypeLabel, cn } from '@/lib/utils';

interface AdaptationCardProps {
  adaptation: Adaptation & {
    ratings: Rating[];
    book?: { title: string; slug: string } | null;
    streamingLinks?: Array<{ platform: string }>;
  };
  showStreaming?: boolean;
  className?: string;
}

export function AdaptationCard({
  adaptation,
  showStreaming = true,
  className,
}: AdaptationCardProps) {
  const imdbRating = adaptation.ratings.find(r => r.source === 'IMDB');
  const uniquePlatforms = showStreaming
    ? [...new Set((adaptation.streamingLinks || []).map(l => l.platform))]
    : [];

  return (
    <Link
      href={`/adaptations/${adaptation.slug}`}
      className={cn(
        'group block rounded-xl border bg-card overflow-hidden',
        'transition-all duration-200 hover:shadow-lg hover:border-primary/50',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        {adaptation.posterImage ? (
          <Image
            src={adaptation.posterImage}
            alt={`${adaptation.title} poster`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            placeholder={adaptation.posterBlurData ? 'blur' : 'empty'}
            blurDataURL={adaptation.posterBlurData || undefined}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">🎬</div>
              <div className="text-xs">No Poster</div>
            </div>
          </div>
        )}

        {/* Rating badge overlay */}
        {imdbRating && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 text-xs font-semibold">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            {imdbRating.score.toFixed(1)}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-muted-foreground">
          {getAdaptationTypeLabel(adaptation.type)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {adaptation.title}
          </h3>
          {adaptation.titleCn && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {adaptation.titleCn}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {adaptation.releaseYear && <span>{adaptation.releaseYear}</span>}
          {adaptation.runtime && <span>{adaptation.runtime} min</span>}
        </div>

        {/* Streaming platform avatars */}
        {uniquePlatforms.length > 0 && (
          <div className="flex gap-1 pt-1">
            {uniquePlatforms.slice(0, 3).map(platform => (
              <span
                key={platform}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {platform.replace(/_/g, ' ')}
              </span>
            ))}
            {uniquePlatforms.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                +{uniquePlatforms.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
