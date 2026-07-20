/**
 * Pipeline Step 2: Fetch Stephen King Adaptations from TMDB
 *
 * Uses TMDB List #9638 as the primary data source.
 * Saves intermediate JSON to data/adaptations-raw.json for subsequent steps.
 *
 * ⚠️ IMPORTANT:
 *   - TMDB free tier allows 50 requests/second — be polite, add delays
 *   - TV shows are fetched with getTVDetails, movies with getMovieDetails
 *   - Duplicates are deduplicated by tmdbId
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  getSKList,
  getMovieDetails,
  getTVDetails,
  getTitle,
  getReleaseYear,
  TMDBListItem,
} from './lib/tmdb';

// ── Zod Schema for validation ────────────────────────────

const RawAdaptationSchema = z.object({
  tmdbId: z.number(),
  title: z.string(),
  mediaType: z.enum(['movie', 'tv']),
  overview: z.string().nullable(),
  overviewCn: z.string().nullable().default(null),
  tagline: z.string().nullable(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseYear: z.number().nullable(),
  releaseDate: z.string().nullable(),
  runtime: z.number().nullable(),
  voteAverage: z.number(),
  voteCount: z.number(),
  genres: z.array(z.object({ id: z.number(), name: z.string() })),
  imdbId: z.string().nullable(),

  // Credits
  director: z.object({
    tmdbId: z.number(),
    name: z.string(),
    profilePath: z.string().nullable(),
  }).nullable(),
  cast: z.array(z.object({
    tmdbId: z.number(),
    name: z.string(),
    character: z.string(),
    profilePath: z.string().nullable(),
    order: z.number(),
  })),

  // Production
  countries: z.array(z.string()),
  budget: z.number().nullable().default(null),
  revenue: z.number().nullable().default(null),

  // TV specific
  numberOfSeasons: z.number().nullable().default(null),
  numberOfEpisodes: z.number().nullable().default(null),
});

type RawAdaptation = z.infer<typeof RawAdaptationSchema>;

// ── Main Pipeline ────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'adaptations-raw.json');

async function main() {
  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('📡 Fetching Stephen King adaptations from TMDB List #9638...\n');

  const listItems = await getSKList();
  console.log(`Found ${listItems.length} items in the TMDB list!\n`);

  const adaptations: RawAdaptation[] = [];
  const seen = new Set<number>();
  let processed = 0;

  for (const item of listItems) {
    // Skip duplicates
    if (seen.has(item.id)) continue;
    seen.add(item.id);

    try {
      const isTV = item.media_type === 'tv';
      const details = isTV
        ? await getTVDetails(item.id)
        : await getMovieDetails(item.id);

      // Extract director (first "Director" in crew)
      const director = details.credits?.crew?.find(
        c => c.job === 'Director' && c.known_for_department === 'Directing'
      );

      // Extract cast (top 10)
      const cast = (details.credits?.cast || [])
        .sort((a, b) => a.order - b.order)
        .slice(0, 10)
        .map(c => ({
          tmdbId: c.id,
          name: c.name,
          character: c.character,
          profilePath: c.profile_path,
          order: c.order,
        }));

      const adaptation: RawAdaptation = {
        tmdbId: details.id,
        title: getTitle(details),
        mediaType: isTV ? 'tv' : 'movie',
        overview: details.overview || null,
        overviewCn: null, // Filled by AI content generation later
        tagline: details.tagline || null,
        posterPath: details.poster_path,
        backdropPath: details.backdrop_path,
        releaseYear: getReleaseYear(details),
        releaseDate: details.release_date || details.first_air_date || null,
        runtime: details.runtime || details.episode_run_time?.[0] || null,
        voteAverage: details.vote_average,
        voteCount: details.vote_count,
        genres: details.genres || [],
        imdbId: details.external_ids?.imdb_id || null,
        director: director
          ? {
              tmdbId: director.id,
              name: director.name,
              profilePath: director.profile_path,
            }
          : null,
        cast,
        countries: (details.production_countries || []).map(c => c.iso_3166_1),
        budget: details.budget || null,
        revenue: details.revenue || null,
        numberOfSeasons: details.number_of_seasons || null,
        numberOfEpisodes: details.number_of_episodes || null,
      };

      // Validate with Zod
      const validated = RawAdaptationSchema.parse(adaptation);
      adaptations.push(validated);

      processed++;
      console.log(`  ✅ [${processed}/${listItems.length}] ${validated.title} (${validated.releaseYear})`);
    } catch (error) {
      const title = getTitle(item);
      console.error(`  ❌ Failed: ${title} (TMDB ID: ${item.id})`);
      console.error(`     ${(error as Error).message}`);
    }

    // Be polite to TMDB API — 250ms between requests (~4 req/s)
    await new Promise(r => setTimeout(r, 250));
  }

  // Save to disk for next pipeline steps
  writeFileSync(OUTPUT_FILE, JSON.stringify(adaptations, null, 2), 'utf-8');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Saved ${adaptations.length} adaptations to data/adaptations-raw.json`);
  console.log(`   Failed: ${listItems.length - adaptations.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
