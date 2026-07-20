/**
 * TMDB API v3 封装
 * Stephen King adaptations list: https://www.themoviedb.org/list/9638
 *
 * Auth: Uses TMDB Read Access Token (Bearer) — preferred for API v3.
 * Falls back to API Key query param if access token is not set.
 */
import 'dotenv/config';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const API_KEY = process.env.TMDB_API_KEY;

if (!ACCESS_TOKEN && !API_KEY) {
  throw new Error('TMDB_ACCESS_TOKEN or TMDB_API_KEY is required in .env');
}

const authHeaders: Record<string, string> = { accept: 'application/json' };
if (ACCESS_TOKEN) {
  authHeaders.Authorization = `Bearer ${ACCESS_TOKEN}`;
}

function buildUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${TMDB_BASE}${path}`);
  // If no access token, fall back to API key in query string
  if (!ACCESS_TOKEN && API_KEY) {
    url.searchParams.set('api_key', API_KEY);
  }
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

// TMDB List #9638: Stephen King Adaptations (user-curated, 88+ items)
export const SK_LIST_ID = 9638;

export interface TMDBListItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  media_type: 'movie' | 'tv';
  genre_ids: number[];
}

export interface TMDBDetailedItem {
  id: number;
  title?: string;
  name?: string;
  overview: string | null;
  tagline: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  vote_average: number;
  vote_count: number;
  budget?: number;
  revenue?: number;
  genres: Array<{ id: number; name: string }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  credits?: {
    crew: Array<{
      id: number;
      name: string;
      job: string;
      known_for_department: string;
      profile_path: string | null;
    }>;
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }>;
  };
  external_ids?: {
    imdb_id: string | null;
  };
}

export async function fetchTMDB<T = unknown>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = buildUrl(path, params);

  const res = await fetch(url, { headers: authHeaders });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB API error ${res.status} for ${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/** Get all items in the Stephen King adaptations list */
export async function getSKList(): Promise<TMDBListItem[]> {
  const allItems: TMDBListItem[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const data = await fetchTMDB<{
      items: TMDBListItem[];
      page: number;
      total_pages: number;
      total_results: number;
    }>(`/list/${SK_LIST_ID}`, {
      language: 'en-US',
      page: String(page),
    });

    allItems.push(...(data.items || []));
    totalPages = data.total_pages;
    page++;
  } while (page <= totalPages);

  return allItems;
}

/** Get full details for a movie */
export async function getMovieDetails(movieId: number): Promise<TMDBDetailedItem> {
  return fetchTMDB<TMDBDetailedItem>(`/movie/${movieId}`, {
    language: 'en-US',
    append_to_response: 'credits,external_ids',
  });
}

/** Get full details for a TV show */
export async function getTVDetails(tvId: number): Promise<TMDBDetailedItem> {
  return fetchTMDB<TMDBDetailedItem>(`/tv/${tvId}`, {
    language: 'en-US',
    append_to_response: 'credits,external_ids',
  });
}

/** Search for a movie */
export async function searchMovie(query: string): Promise<TMDBListItem[]> {
  const data = await fetchTMDB<{ results: TMDBListItem[] }>('/search/movie', {
    query,
    language: 'en-US',
  });
  return data.results || [];
}

/** Search for a TV show */
export async function searchTV(query: string): Promise<TMDBListItem[]> {
  const data = await fetchTMDB<{ results: TMDBListItem[] }>('/search/tv', {
    query,
    language: 'en-US',
  });
  return data.results || [];
}

/** Construct poster image URL */
export function getPosterUrl(
  path: string | null,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/** Construct profile image URL */
export function getProfileUrl(
  path: string | null,
  size: 'w45' | 'w185' | 'h632' | 'original' = 'w185'
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/** Get the title regardless of media type */
export function getTitle(item: TMDBListItem | TMDBDetailedItem): string {
  return item.title || item.name || 'Unknown';
}

/** Get the release year regardless of media type */
export function getReleaseYear(item: TMDBListItem | TMDBDetailedItem): number | null {
  const dateStr = item.release_date || item.first_air_date;
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}
