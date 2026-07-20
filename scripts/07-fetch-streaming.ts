/**
 * Pipeline Step 7: Fetch Streaming Availability from JustWatch
 *
 * For each adaptation, searches JustWatch by title + year,
 * then fetches streaming offers (subscription/rent/buy/free).
 *
 * Saves to data/streaming.json for the seed script.
 *
 * Rate limit: ~1 req/sec to be polite to JustWatch's API
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  searchTitle,
  getTitleOffers,
  mapMonetizationType,
  mapQuality,
  mapPlatform,
  type JustWatchOffer,
} from './lib/justwatch';

const DATA_DIR = path.join(process.cwd(), 'data');
const INPUT_FILE = path.join(DATA_DIR, 'adaptations-raw.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'streaming.json');

// ── Zod Schema ──────────────────────────────────────

const StreamingRecordSchema = z.object({
  tmdbId: z.number(),
  title: z.string(),
  justWatchId: z.string().nullable(),
  offers: z.array(z.object({
    platform: z.string(),
    linkType: z.string(),
    url: z.string(),
    price: z.string().nullable(),
    quality: z.string().nullable(),
    country: z.string(),
  })),
});

type StreamingRecord = z.infer<typeof StreamingRecordSchema>;

// ── Main Pipeline ───────────────────────────────────

async function main() {
  if (!existsSync(INPUT_FILE)) {
    console.error('❌ data/adaptations-raw.json not found. Run pipeline:adaptations first.');
    process.exit(1);
  }

  const rawData: any[] = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`📺 Fetching streaming availability for ${rawData.length} adaptations...\n`);

  const results: StreamingRecord[] = [];
  let found = 0;
  let noOffers = 0;
  let notFound = 0;

  for (let i = 0; i < rawData.length; i++) {
    const adaptation = rawData[i];
    const title = adaptation.title;

    try {
      console.log(`  [${i + 1}/${rawData.length}] ${title} (${adaptation.releaseYear})...`);

      // Step 1: Search JustWatch for the title
      const jwTitle = await searchTitle(title, adaptation.releaseYear, 'US');
      if (!jwTitle) {
        console.log(`    ❌ Not found on JustWatch`);
        results.push({
          tmdbId: adaptation.tmdbId,
          title,
          justWatchId: null,
          offers: [],
        });
        notFound++;
        continue;
      }

      // Step 2: Get streaming offers (search results already include offers usually)
      // But fetch full details to ensure completeness
      let offers: JustWatchOffer[] = jwTitle.offers || [];

      // If search didn't return offers, try the dedicated offers query
      if (offers.length === 0) {
        const fullTitle = await getTitleOffers(jwTitle.id);
        if (fullTitle) {
          offers = fullTitle.offers || [];
        }
      }

      // Step 3: Map to our schema
      const mappedOffers = offers
        .filter(o => o.monetizationType) // Skip empty offers
        .map(o => ({
          platform: mapPlatform(o.package.technicalName || '', o.package.clearName),
          linkType: mapMonetizationType(o.monetizationType),
          url: o.deeplinkURL || o.standardWebURL,
          price: o.retailPrice || null,
          quality: mapQuality(o.presentationType),
          country: 'US',
        }));

      // Deduplicate: keep best offer per platform+linkType
      const seen = new Set<string>();
      const deduplicated = mappedOffers.filter(o => {
        const key = `${o.platform}-${o.linkType}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const record = StreamingRecordSchema.parse({
        tmdbId: adaptation.tmdbId,
        title,
        justWatchId: jwTitle.id,
        offers: deduplicated,
      });

      results.push(record);

      if (deduplicated.length > 0) {
        const platforms = deduplicated.map(o => o.platform.replace(/_/g, ' ')).join(', ');
        console.log(`    ✅ ${deduplicated.length} offers (${platforms})`);
        found++;
      } else {
        console.log(`    ⚠️  Found on JustWatch but no streaming offers`);
        noOffers++;
      }
    } catch (error) {
      console.error(`    ❌ Error: ${(error as Error).message}`);
      results.push({
        tmdbId: adaptation.tmdbId,
        title,
        justWatchId: null,
        offers: [],
      });
      notFound++;
    }

    // Rate limit: ~500ms between requests (2 req/sec max for search+offers)
    await new Promise(r => setTimeout(r, 500));
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Streaming data summary:`);
  console.log(`   ✅ With offers:  ${found}`);
  console.log(`   ⚠️  No offers:   ${noOffers}`);
  console.log(`   ❌ Not found:   ${notFound}`);
  console.log(`   📁 Output:      ${OUTPUT_FILE}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
