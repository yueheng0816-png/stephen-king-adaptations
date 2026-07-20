/**
 * OMDb API 封装 — 获取 IMDb / Rotten Tomatoes / Metacritic 评分
 *
 * Free tier: 1,000 requests/day — plenty for ~110 adaptations
 * Registration: https://www.omdbapi.com/apikey.aspx
 */
import 'dotenv/config';

const OMDb_BASE = 'https://www.omdbapi.com';

const API_KEY = process.env.OMDB_API_KEY;
if (!API_KEY) {
  console.warn('⚠️  OMDb_API_KEY not set — ratings fetching will be skipped');
}

export interface OMDbResponse {
  imdbID: string;
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: 'True' | 'False';
  Error?: string;
}

export interface ParsedRatings {
  imdbId: string;
  ratings: Array<{
    source: 'IMDB' | 'ROTTEN_TOMATOES' | 'METACRITIC';
    score: number;
    maxScore: number;
    voteCount: number | null;
  }>;
}

/**
 * Parse a rating string into a numeric score.
 * Handles formats: "9.3/10", "93%", "88/100"
 */
export function parseRatingValue(value: string): { score: number; maxScore: number } | null {
  const cleaned = value.trim();

  // Percentage: "93%" → 93/100
  if (cleaned.includes('%')) {
    const num = parseFloat(cleaned.replace('%', ''));
    if (isNaN(num)) return null;
    return { score: num, maxScore: 100 };
  }

  // Fraction: "9.3/10" or "88/100"
  const parts = cleaned.split('/');
  if (parts.length === 2) {
    const score = parseFloat(parts[0]);
    const max = parseFloat(parts[1]);
    if (isNaN(score) || isNaN(max)) return null;
    return { score, maxScore: max };
  }

  // Bare number
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return { score: num, maxScore: 100 };
}

/**
 * Fetch movie/show ratings from OMDb by IMDb ID.
 * Returns null if the API is unavailable or the title is not found.
 */
export async function fetchOMDbRatings(imdbId: string): Promise<ParsedRatings | null> {
  if (!API_KEY) return null;

  const url = `${OMDb_BASE}/?i=${imdbId}&apikey=${API_KEY}&plot=short`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`OMDb API error ${res.status} for ${imdbId}`);
    return null;
  }

  const data: OMDbResponse = await res.json();

  if (data.Response === 'False') {
    console.warn(`OMDb: ${imdbId} not found — ${data.Error}`);
    return null;
  }

  const ratings: ParsedRatings['ratings'] = [];

  // IMDb rating
  if (data.imdbRating && data.imdbRating !== 'N/A') {
    const score = parseFloat(data.imdbRating);
    if (!isNaN(score)) {
      ratings.push({
        source: 'IMDB',
        score,
        maxScore: 10,
        voteCount: data.imdbVotes ? parseInt(data.imdbVotes.replace(/,/g, '')) : null,
      });
    }
  }

  // Other ratings (Rotten Tomatoes, Metacritic)
  for (const r of data.Ratings) {
    const parsed = parseRatingValue(r.Value);
    if (!parsed) continue;

    let source: 'ROTTEN_TOMATOES' | 'METACRITIC' | null = null;
    if (r.Source === 'Rotten Tomatoes') source = 'ROTTEN_TOMATOES';
    else if (r.Source === 'Metacritic') source = 'METACRITIC';
    else continue;

    ratings.push({
      source,
      score: parsed.score,
      maxScore: parsed.maxScore,
      voteCount: null,
    });
  }

  return { imdbId: data.imdbID, ratings };
}
