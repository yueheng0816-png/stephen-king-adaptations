import { formatRating, getRatingColor } from '@/lib/utils';

interface RatingBadgeProps {
  source: string;
  score: number;
  maxScore: number;
  voteCount?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const SOURCE_LABELS: Record<string, string> = {
  IMDB: 'IMDb',
  ROTTEN_TOMATOES: 'Rotten Tomatoes',
  METACRITIC: 'Metacritic',
  DOUBAN: 'Douban',
  LETTERBOXD: 'Letterboxd',
};

export function RatingBadge({
  source,
  score,
  maxScore,
  voteCount,
  size = 'md',
}: RatingBadgeProps) {
  const color = getRatingColor(source);
  const label = SOURCE_LABELS[source] || source;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}15`,
        border: `1px solid ${color}40`,
      }}
      title={`${label}: ${formatRating(score, maxScore)}${voteCount ? ` (${voteCount.toLocaleString()} votes)` : ''}`}
    >
      {/* Colored dot */}
      <span
        className="inline-block rounded-full"
        style={{
          width: size === 'sm' ? 6 : 8,
          height: size === 'sm' ? 6 : 8,
          backgroundColor: color,
        }}
      />
      <span style={{ color }} className="font-bold">
        {label}
      </span>
      <span className="text-foreground font-semibold">
        {formatRating(score, maxScore)}
      </span>
      {voteCount && size !== 'sm' && (
        <span className="text-muted-foreground">
          ({voteCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
