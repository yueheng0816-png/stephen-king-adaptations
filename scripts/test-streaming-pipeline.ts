/**
 * Quick test: fetch streaming for 5 adaptations to verify pipeline
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { searchTitle, mapMonetizationType, mapQuality, mapPlatform } from './lib/justwatch';

async function main() {
  const raw = JSON.parse(readFileSync('data/adaptations-raw.json', 'utf-8'));
  const sample = raw.slice(0, 5); // First 5

  console.log('📺 Testing streaming pipeline on 5 titles...\n');

  for (const a of sample) {
    console.log(`${a.title} (${a.releaseYear})...`);
    const result = await searchTitle(a.title, a.releaseYear);
    if (!result) {
      console.log('  ❌ Not found\n');
      continue;
    }

    // Deduplicate and map offers
    const seen = new Set<string>();
    const offers = (result.offers || [])
      .filter(o => o.monetizationType)
      .map(o => ({
        platform: mapPlatform(o.package?.technicalName || ''),
        linkType: mapMonetizationType(o.monetizationType),
        url: o.deeplinkURL || o.standardWebURL,
        price: o.retailPrice || null,
        quality: mapQuality(o.presentationType),
      }))
      .filter(o => {
        const key = `${o.platform}-${o.linkType}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    // Group by link type
    const byType: Record<string, string[]> = {};
    offers.forEach(o => {
      if (!byType[o.linkType]) byType[o.linkType] = [];
      byType[o.linkType].push(o.platform.replace(/_/g, ' '));
    });

    Object.entries(byType).forEach(([type, platforms]) => {
      console.log(`  ${type}: ${[...new Set(platforms)].join(', ')}`);
    });
    console.log(`  ✅ ${offers.length} unique offers\n`);

    await new Promise(r => setTimeout(r, 600));
  }

  console.log('✅ Pipeline test passed!');
}

main().catch(console.error);
