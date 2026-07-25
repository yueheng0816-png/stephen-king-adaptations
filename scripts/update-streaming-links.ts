/**
 * Lightweight streaming data update (for CI cron jobs).
 *
 * Reads data/streaming.json (produced by the JustWatch fetch script)
 * and upserts streaming links into the database. Does NOT touch
 * adaptations, books, people, or any other data.
 *
 * This is much faster and safer than running the full seed script in CI.
 *
 * Usage: npx tsx scripts/update-streaming-links.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'data');

async function main() {
  const streamingFile = path.join(DATA_DIR, 'streaming.json');

  if (!existsSync(streamingFile)) {
    console.error('❌ data/streaming.json not found. Run pipeline:streaming first.');
    process.exit(1);
  }

  const streamingData: Array<{
    tmdbId: number;
    title: string;
    offers: Array<{
      platform: string;
      country: string;
      linkType: string;
      url: string;
      price: string | null;
      quality: string | null;
    }>;
  }> = JSON.parse(readFileSync(streamingFile, 'utf-8'));

  console.log(`📡 Updating streaming links for ${streamingData.length} adaptations...\n`);

  let updatedCount = 0;
  let offerCount = 0;

  for (const entry of streamingData) {
    // Find the adaptation by tmdbId
    const adaptation = await prisma.adaptation.findUnique({
      where: { tmdbId: entry.tmdbId },
      select: { id: true, title: true },
    });

    if (!adaptation) {
      console.log(`  ⚠️  No adaptation found for tmdbId=${entry.tmdbId} (${entry.title})`);
      continue;
    }

    // Upsert each streaming offer
    for (const offer of entry.offers) {
      await prisma.streamingLink.upsert({
        where: {
          adaptationId_platform_country_linkType: {
            adaptationId: adaptation.id,
            platform: offer.platform,
            country: offer.country || 'US',
            linkType: offer.linkType,
          },
        },
        update: {
          url: offer.url,
          price: offer.price || null,
          quality: offer.quality || null,
          lastVerified: new Date(),
        },
        create: {
          adaptationId: adaptation.id,
          platform: offer.platform,
          country: offer.country || 'US',
          linkType: offer.linkType,
          url: offer.url,
          price: offer.price || null,
          quality: offer.quality || null,
        },
      });
      offerCount++;
    }

    updatedCount++;
  }

  console.log(`\n✅ Updated ${updatedCount} adaptations with ${offerCount} streaming offers`);
}

main()
  .catch((e) => {
    console.error('Streaming update error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
