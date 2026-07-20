import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(score: number, maxScore: number): string {
  if (maxScore === 10) return `${score.toFixed(1)}/10`;
  if (maxScore === 100) return `${Math.round(score)}%`;
  return `${score}/${maxScore}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getDecade(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

export function getAdaptationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    MOVIE: 'Movie',
    TV_SERIES: 'TV Series',
    MINISERIES: 'Miniseries',
    TV_MOVIE: 'TV Movie',
    STREAMING_ORIGINAL: 'Streaming Original',
  };
  return labels[type] || type;
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    NETFLIX: 'Netflix',
    AMAZON_PRIME: 'Amazon Prime',
    HBO_MAX: 'HBO Max',
    HULU: 'Hulu',
    DISNEY_PLUS: 'Disney+',
    APPLE_TV_PLUS: 'Apple TV+',
    PARAMOUNT_PLUS: 'Paramount+',
    PEACOCK: 'Peacock',
    TUBI: 'Tubi',
    PLUTO_TV: 'Pluto TV',
    SHUDDER: 'Shudder',
    AMC_PLUS: 'AMC+',
    MGM_PLUS: 'MGM+',
    STARZ: 'Starz',
    SHOWTIME: 'Showtime',
    CRACKLE: 'Crackle',
    FREEVEE: 'Freevee',
    YOUTUBE: 'YouTube',
    GOOGLE_PLAY: 'Google Play',
    ITUNES: 'iTunes',
    VUDU: 'Vudu',
  };
  return labels[platform] || platform;
}

export function getRatingColor(source: string): string {
  const colors: Record<string, string> = {
    IMDB: '#f5c518',
    ROTTEN_TOMATOES: '#fa320a',
    METACRITIC: '#ffcc00',
    DOUBAN: '#00b51d',
    LETTERBOXD: '#ff8000',
  };
  return colors[source] || '#888888';
}

export function getDiffCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ENDING: 'Ending',
    CHARACTER: 'Characters',
    PLOT: 'Plot',
    TONE: 'Tone',
    CUT_CONTENT: 'Cut Content',
  };
  return labels[category] || category;
}

/**
 * Truncate text to a safe length for meta descriptions (Google shows ~160 chars)
 */
export function truncateForSEO(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).replace(/\s+\S*$/, '') + '...';
}
