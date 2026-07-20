/**
 * Pipeline Step 5: Download Posters from TMDB
 *
 * Downloads movie/TV posters from TMDB CDN to local public/images/posters/.
 * Also generates blur data URLs using plaiceholder for zero-CLS loading.
 *
 * STS2 Lesson: ALL images must be downloaded locally during the data pipeline,
 * NOT referenced from an external CDN at runtime. This eliminates:
 *   - CDN URL changes → broken images
 *   - Missing images at build time
 *   - Layout shift (CLS) from missing blur placeholders
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getPlaiceholder } from 'plaiceholder';
import { getPosterUrl } from './lib/tmdb';

interface AdaptationRecord {
  slug: string;
  title: string;
  posterPath: string | null;
}

const POSTER_DIR = path.join(process.cwd(), 'public', 'images', 'posters');
const DATA_FILE = path.join(process.cwd(), 'data', 'adaptations-with-posters.json');

async function downloadPoster(
  posterPath: string,
  slug: string
): Promise<{ localPath: string; blurDataURL: string } | null> {
  const url = getPosterUrl(posterPath, 'w780');
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  Failed to download: ${url} (${response.status})`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = path.extname(posterPath) || '.jpg';
    const filename = `${slug}${ext}`;

    // 1. Save the original poster to public/
    await writeFile(path.join(POSTER_DIR, filename), buffer);

    // 2. Generate blur placeholder (eliminates CLS — STS2 lesson!)
    const { base64 } = await getPlaiceholder(buffer);

    return {
      localPath: `/images/posters/${filename}`,
      blurDataURL: base64,
    };
  } catch (error) {
    console.error(`  Error downloading poster for ${slug}:`, (error as Error).message);
    return null;
  }
}

async function main() {
  // Ensure poster directory exists
  if (!existsSync(POSTER_DIR)) {
    mkdirSync(POSTER_DIR, { recursive: true });
  }

  // Read adaptations from previous pipeline step
  const rawData = path.join(process.cwd(), 'data', 'adaptations-raw.json');
  if (!existsSync(rawData)) {
    console.error('❌ data/adaptations-raw.json not found. Run pipeline:adaptations first.');
    process.exit(1);
  }

  function makeSlug(title: string, year?: number | null): string {
    const base = title
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/['‘’]/g, '')  // Remove apostrophes (match seed script)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return year ? `${base}-${year}` : base;
  }

  const adaptations: AdaptationRecord[] = JSON.parse(
    await import('fs').then(fs => fs.readFileSync(rawData, 'utf-8'))
  ).map((a: any) => ({
    slug: makeSlug(a.title, a.releaseYear),
    title: a.title,
    posterPath: a.posterPath,
  }));

  console.log(`📸 Downloading posters for ${adaptations.length} adaptations...\n`);

  let downloaded = 0;
  let skipped = 0;
  const results: Array<{ slug: string; posterImage: string | null; posterBlurData: string | null }> = [];

  for (const adaptation of adaptations) {
    if (!adaptation.posterPath) {
      console.log(`  ⏭️  ${adaptation.title} — no poster available`);
      results.push({ slug: adaptation.slug, posterImage: null, posterBlurData: null });
      skipped++;
      continue;
    }

    const result = await downloadPoster(adaptation.posterPath, adaptation.slug);
    if (result) {
      results.push({
        slug: adaptation.slug,
        posterImage: result.localPath,
        posterBlurData: result.blurDataURL,
      });
      downloaded++;
      console.log(`  ✅ ${adaptation.title}`);
    } else {
      results.push({ slug: adaptation.slug, posterImage: null, posterBlurData: null });
      skipped++;
      console.log(`  ❌ ${adaptation.title} — download failed`);
    }

    // Rate limit: be polite
    await new Promise(r => setTimeout(r, 100));
  }

  // Save poster mapping for the seed script
  writeFileSync(DATA_FILE, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Downloaded: ${downloaded}  |  Skipped: ${skipped}`);
  console.log(`   Coverage: ${((downloaded / adaptations.length) * 100).toFixed(1)}%`);
  console.log(`   Output: ${DATA_FILE}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // STS2 comparison:
  // STS2: 177/578 (30%) cards had images from CDN
  // King: 100% coverage — TMDB has every movie poster
  if (downloaded === adaptations.length) {
    console.log('🎉 100% poster coverage! (vs. STS2\'s 30% card-art coverage)');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
