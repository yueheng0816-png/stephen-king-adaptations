/**
 * Pipeline Step 9: Normalize and Seed Database
 *
 * Combines all pipeline outputs into the final Prisma seed format.
 * Performs:
 *   - Deduplication by tmdbId
 *   - Slug generation from titles
 *   - Book-to-adaptation linking (basic: by title substring matching)
 *   - Director/actor person records creation
 *   - Rating records creation
 *
 * Usage: npx tsx scripts/09-normalize-and-seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'data');

function slugify(text: string, year?: number | null): string {
  const base = text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return year ? `${base}-${year}` : base;
}

function inferAdaptationType(item: any): string {
  if (item.mediaType === 'tv') {
    const seasons = item.numberOfSeasons || 1;
    const episodes = item.numberOfEpisodes || 0;
    if (seasons === 1 && episodes > 0 && episodes <= 8) return 'MINISERIES';
    return 'TV_SERIES';
  }
  const runtime = item.runtime || 0;
  if (runtime > 0 && runtime < 90) return 'TV_MOVIE';
  return 'MOVIE';
}

/** Build unique slugs, handling same-title+same-year conflicts */
function buildSlugMap(items: any[]): Map<number, string> {
  // First pass: compute base slugs
  const baseSlugs = items.map(item => ({
    tmdbId: item.tmdbId,
    slug: slugify(item.title, item.releaseYear),
    mediaType: item.mediaType,
  }));

  // Find duplicates
  const slugCount = new Map<string, number>();
  baseSlugs.forEach(s => slugCount.set(s.slug, (slugCount.get(s.slug) || 0) + 1));

  // For duplicates, append -movie or -tv
  const result = new Map<number, string>();
  const dupTracker = new Map<string, number>(); // slug → counter for same-type duplicates
  for (const s of baseSlugs) {
    if ((slugCount.get(s.slug) || 0) > 1) {
      const suffix = s.mediaType === 'tv' ? '-tv' : '-movie';
      const deduped = s.slug + suffix;
      result.set(s.tmdbId, deduped);
    } else {
      result.set(s.tmdbId, s.slug);
    }
  }
  return result;
}

async function main() {
  console.log('🔧 Normalizing and seeding database...\n');

  // ── Load all pipeline outputs ──────────────────────

  const adaptationsFile = path.join(DATA_DIR, 'adaptations-raw.json');
  if (!existsSync(adaptationsFile)) {
    console.error('❌ data/adaptations-raw.json not found. Run pipeline:adaptations first.');
    process.exit(1);
  }
  const adaptationsRaw: any[] = JSON.parse(readFileSync(adaptationsFile, 'utf-8'));
  console.log(`📥 Loaded ${adaptationsRaw.length} adaptations`);

  // Load posters mapping (optional)
  let posterMap: Map<string, { localPath: string; blurDataURL: string }> = new Map();
  const postersFile = path.join(DATA_DIR, 'adaptations-with-posters.json');
  if (existsSync(postersFile)) {
    const posters: any[] = JSON.parse(readFileSync(postersFile, 'utf-8'));
    for (const p of posters) {
      if (p.posterImage) {
        posterMap.set(p.slug, { localPath: p.posterImage, blurDataURL: p.posterBlurData });
      }
    }
    console.log(`📥 Loaded ${posterMap.size} poster mappings`);
  }

  // Load ratings (optional)
  let ratingsMap: Map<number, any[]> = new Map();
  const ratingsFile = path.join(DATA_DIR, 'ratings.json');
  if (existsSync(ratingsFile)) {
    const ratings: any[] = JSON.parse(readFileSync(ratingsFile, 'utf-8'));
    for (const r of ratings) {
      ratingsMap.set(r.tmdbId, r.ratings);
    }
    console.log(`📥 Loaded ratings for ${ratingsMap.size} adaptations`);
  }

  // Load streaming (optional)
  let streamingMap: Map<number, any[]> = new Map();
  const streamingFile = path.join(DATA_DIR, 'streaming.json');
  if (existsSync(streamingFile)) {
    const streaming: any[] = JSON.parse(readFileSync(streamingFile, 'utf-8'));
    for (const s of streaming) {
      streamingMap.set(s.tmdbId, s.offers);
    }
    const totalOffers = streaming.reduce((sum: number, s: any) => sum + (s.offers?.length || 0), 0);
    console.log(`📥 Loaded ${totalOffers} streaming offers for ${streamingMap.size} adaptations`);
  }

  // Load AI content (optional)
  let aiContentMap: Map<number, any> = new Map();
  const aiContentFile = path.join(DATA_DIR, 'ai-content.json');
  if (existsSync(aiContentFile)) {
    const aiContent: any[] = JSON.parse(readFileSync(aiContentFile, 'utf-8'));
    for (const a of aiContent) {
      aiContentMap.set(a.tmdbId, a);
    }
    console.log(`📥 Loaded AI content for ${aiContentMap.size} adaptations`);
  }

  // Load books (optional)
  let bookList: any[] = [];
  const booksFile = path.join(DATA_DIR, 'books.json');
  if (existsSync(booksFile)) {
    bookList = JSON.parse(readFileSync(booksFile, 'utf-8'));
    console.log(`📥 Loaded ${bookList.length} books`);
  }

  // ── Clear existing data ────────────────────────────

  console.log('\n🗑️  Clearing existing data...');
  await prisma.bookDifference.deleteMany();
  await prisma.streamingLink.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.castMember.deleteMany();
  await prisma.collectionMember.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.adaptation.deleteMany();
  await prisma.person.deleteMany();
  await prisma.book.deleteMany();
  console.log('   Done.');

  // ── Seed Books ──────────────────────────────────────

  console.log('\n📚 Seeding books...');
  const bookIdMap = new Map<string, string>(); // adaptation title (lowercase) → book ID
  for (const book of bookList) {
    const b = await prisma.book.upsert({
      where: { slug: book.slug },
      update: {
        title: book.title,
        titleCn: book.titleCn,
        publicationYear: book.publicationYear,
        type: book.type,
        description: book.description || undefined,
        descriptionCn: book.descriptionCn || undefined,
        coverImage: book.coverImage || undefined,
        amazonUrl: book.amazonUrl || undefined,
        kindleUrl: book.kindleUrl || undefined,
        goodreadsUrl: book.goodreadsUrl || undefined,
        isbn: book.isbn || undefined,
        pageCount: book.pageCount || undefined,
      },
      create: {
        slug: book.slug,
        title: book.title,
        titleCn: book.titleCn,
        publicationYear: book.publicationYear,
        type: book.type,
        description: book.description || null,
        descriptionCn: book.descriptionCn || null,
        coverImage: book.coverImage || null,
        amazonUrl: book.amazonUrl || null,
        kindleUrl: book.kindleUrl || null,
        goodreadsUrl: book.goodreadsUrl || null,
        isbn: book.isbn || null,
        pageCount: book.pageCount || null,
      },
    });
    // Map each adaptation title to this book
    for (const at of book.adaptations) {
      bookIdMap.set(at.toLowerCase(), b.id);
    }
  }
  console.log(`   ✅ ${bookList.length} books seeded`);

  // ── Seed Adaptations ───────────────────────────────

  // Pre-compute unique slugs (handles same-title + same-year edge cases)
  const slugMap = buildSlugMap(adaptationsRaw);

  console.log('\n📝 Seeding adaptations...');
  let adaptationCount = 0;
  let personCount = 0;
  const personCache = new Map<number, string>(); // tmdbId → prisma id

  for (const raw of adaptationsRaw) {
    const slug = slugMap.get(raw.tmdbId) || slugify(raw.title, raw.releaseYear);
    const type = inferAdaptationType(raw);
    // Try exact slug first, then year-only slug, then plain slug (poster fallback)
    const yearSlug = slugify(raw.title, raw.releaseYear);
    const plainSlug = slugify(raw.title);
    const posters = posterMap.get(slug) || posterMap.get(yearSlug) || posterMap.get(plainSlug);

    // Upsert director
    let directorId: string | null = null;
    if (raw.director) {
      const dirSlug = slugify(raw.director.name);
      const existing = personCache.get(raw.director.tmdbId);
      if (existing) {
        directorId = existing;
      } else {
        const person = await prisma.person.upsert({
          where: { tmdbId: raw.director.tmdbId },
          update: { name: raw.director.name, role: 'DIRECTOR' },
          create: {
            slug: dirSlug,
            name: raw.director.name,
            tmdbId: raw.director.tmdbId,
            role: 'DIRECTOR',
          },
        });
        personCache.set(raw.director.tmdbId, person.id);
        directorId = person.id;
        personCount++;
      }
    }

    // Match adaptation to its source book
    const bookId = bookIdMap.get(raw.title.toLowerCase()) || null;

    // Upsert adaptation
    const aiContent = aiContentMap.get(raw.tmdbId);

    const adaptation = await prisma.adaptation.upsert({
      where: { tmdbId: raw.tmdbId },
      update: {
        bookId,
        title: raw.title,
        type,
        releaseYear: raw.releaseYear,
        releaseDate: raw.releaseDate,
        runtime: raw.runtime,
        overview: raw.overview,
        overviewCn: aiContent?.overviewCn || null,
        tagline: raw.tagline,
        posterImage: posters?.localPath || null,
        posterBlurData: posters?.blurDataURL || null,
        tmdbId: raw.tmdbId,
        imdbId: raw.imdbId,
        rating: raw.voteAverage || null,
        ratingCount: raw.voteCount || null,
        directorId,
        review: aiContent?.reviewCn || null,
        reviewEn: aiContent?.reviewEn || null,
        language: raw.countries?.[0]?.toLowerCase() || 'en',
        country: raw.countries?.[0] || 'US',
        metaTitle: `${raw.title} (${raw.releaseYear}) — Stephen King Adaptation`,
        metaDescription: raw.overview
          ? `${raw.overview.slice(0, 140)}... IMDb: ${raw.voteAverage}/10. Find where to stream.`
          : `${raw.title} (${raw.releaseYear}) — Stephen King ${type.toLowerCase().replace(/_/g, ' ')}. IMDb: ${raw.voteAverage}/10.`,
      },
      create: {
        slug,
        title: raw.title,
        type,
        releaseYear: raw.releaseYear,
        releaseDate: raw.releaseDate,
        runtime: raw.runtime,
        bookId,
        overview: raw.overview,
        overviewCn: aiContent?.overviewCn || null,
        tagline: raw.tagline,
        posterImage: posters?.localPath || null,
        posterBlurData: posters?.blurDataURL || null,
        tmdbId: raw.tmdbId,
        imdbId: raw.imdbId,
        rating: raw.voteAverage || null,
        ratingCount: raw.voteCount || null,
        directorId,
        review: aiContent?.reviewCn || null,
        reviewEn: aiContent?.reviewEn || null,
        language: raw.countries?.[0]?.toLowerCase() || 'en',
        country: raw.countries?.[0] || 'US',
        metaTitle: `${raw.title} (${raw.releaseYear}) — Stephen King Adaptation`,
        metaDescription: raw.overview
          ? `${raw.overview.slice(0, 140)}... IMDb: ${raw.voteAverage}/10.`
          : `${raw.title} — Stephen King adaptation.`,
      },
    });

    // Upsert cast
    for (const actor of (raw.cast || []).slice(0, 10)) {
      let personId: string;
      const existing = personCache.get(actor.tmdbId);
      if (existing) {
        personId = existing;
      } else {
        const actorSlug = slugify(actor.name);
        const person = await prisma.person.upsert({
          where: { tmdbId: actor.tmdbId },
          update: {
            name: actor.name,
            role: personCache.has(actor.tmdbId) ? 'BOTH' : 'ACTOR',
          },
          create: {
            slug: actorSlug,
            name: actor.name,
            tmdbId: actor.tmdbId,
            role: 'ACTOR',
          },
        });
        personCache.set(actor.tmdbId, person.id);
        personId = person.id;
        personCount++;
      }

      await prisma.castMember.upsert({
        where: {
          adaptationId_personId: {
            adaptationId: adaptation.id,
            personId,
          },
        },
        update: { characterName: actor.character, order: actor.order },
        create: {
          adaptationId: adaptation.id,
          personId,
          characterName: actor.character,
          order: actor.order,
        },
      });
    }

    // Upsert ratings
    const imdbRatings = ratingsMap.get(raw.tmdbId) || [];
    for (const r of imdbRatings) {
      await prisma.rating.upsert({
        where: {
          adaptationId_source: {
            adaptationId: adaptation.id,
            source: r.source,
          },
        },
        update: { score: r.score, maxScore: r.maxScore, voteCount: r.voteCount },
        create: {
          adaptationId: adaptation.id,
          source: r.source,
          score: r.score,
          maxScore: r.maxScore,
          voteCount: r.voteCount,
        },
      });
    }

    // Upsert streaming links
    const offers = streamingMap.get(raw.tmdbId) || [];
    for (const o of offers) {
      await prisma.streamingLink.upsert({
        where: {
          adaptationId_platform_country_linkType: {
            adaptationId: adaptation.id,
            platform: o.platform,
            country: o.country || 'US',
            linkType: o.linkType,
          },
        },
        update: {
          url: o.url,
          price: o.price,
          quality: o.quality,
          lastVerified: new Date(),
        },
        create: {
          adaptationId: adaptation.id,
          platform: o.platform,
          country: o.country || 'US',
          linkType: o.linkType,
          url: o.url,
          price: o.price,
          quality: o.quality,
        },
      });
    }

    // Seed book differences from AI content
    const aiDiffs = aiContent?.differences || [];
    if (aiDiffs.length > 0) {
      // Clear existing diffs for this adaptation, then create fresh
      await prisma.bookDifference.deleteMany({ where: { adaptationId: adaptation.id } });
      for (const d of aiDiffs) {
        await prisma.bookDifference.create({
          data: {
            adaptationId: adaptation.id,
            category: d.category,
            description: d.description,
            descriptionEn: d.descriptionEn || null,
          },
        });
      }
    }

    adaptationCount++;
    if (adaptationCount % 20 === 0) {
      console.log(`   ... ${adaptationCount}/${adaptationsRaw.length}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Database seeded!`);
  console.log(`   🎬 ${adaptationCount} adaptations`);
  console.log(`   👤 ${personCount} people (directors + actors)`);
  console.log(`   ⭐ ${ratingsMap.size} adaptations with ratings`);
  console.log(`   🖼️  ${posterMap.size} adaptations with posters`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
