/**
 * Pipeline Step 4: Fetch Ratings from OMDb
 *
 * For each adaptation with an IMDb ID, fetch ratings from OMDb:
 *   - IMDb score + vote count
 *   - Rotten Tomatoes score
 *   - Metacritic score
 *
 * Saves to data/ratings.json
 *
 * OMDb free tier: 1,000 requests/day — ~110 adaptations = ~11% of daily quota
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { fetchOMDbRatings, ParsedRatings } from './lib/omdb';

const DATA_DIR = path.join(process.cwd(), 'data');
const INPUT_FILE = path.join(DATA_DIR, 'adaptations-raw.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'ratings.json');

const RatingRecordSchema = z.object({
  tmdbId: z.number(),
  imdbId: z.string(),
  title: z.string(),
  ratings: z.array(z.object({
    source: z.enum(['IMDB', 'ROTTEN_TOMATOES', 'METACRITIC']),
    score: z.number(),
    maxScore: z.number(),
    voteCount: z.number().nullable(),
  })),
});

type RatingRecord = z.infer<typeof RatingRecordSchema>;

async function main() {
  if (!process.env.OMDB_API_KEY) {
    console.log('⏭️  OMDb_API_KEY not set — skipping ratings fetch');
    console.log('   Register at: https://www.omdbapi.com/apikey.aspx');
    process.exit(0);
  }

  if (!existsSync(INPUT_FILE)) {
    console.error('❌ data/adaptations-raw.json not found. Run pipeline:adaptations first.');
    process.exit(1);
  }

  const rawData: any[] = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));
  const withImdb = rawData.filter((a: any) => a.imdbId);

  console.log(`📊 Fetching ratings for ${withImdb.length} adaptations (${rawData.length - withImdb.length} without IMDb ID)...\n`);

  const results: RatingRecord[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const adaptation of withImdb) {
    try {
      const data = await fetchOMDbRatings(adaptation.imdbId);

      if (!data || data.ratings.length === 0) {
        console.log(`  ⚠️  ${adaptation.title} — no ratings found`);
        failed++;
        continue;
      }

      const record = RatingRecordSchema.parse({
        tmdbId: adaptation.tmdbId,
        imdbId: data.imdbId,
        title: adaptation.title,
        ratings: data.ratings,
      });

      results.push(record);
      succeeded++;
      console.log(`  ✅ ${adaptation.title} (${data.ratings.length} ratings)`);
    } catch (error) {
      console.error(`  ❌ ${adaptation.title}: ${(error as Error).message}`);
      failed++;
    }

    // OMDb free tier: be respectful — ~4 req/s max
    await new Promise(r => setTimeout(r, 300));
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Ratings fetched: ${succeeded}  |  Failed: ${failed}`);
  console.log(`   Output: ${OUTPUT_FILE}`);
  console.log(`   Coverage: ${((succeeded / withImdb.length) * 100).toFixed(1)}%`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
