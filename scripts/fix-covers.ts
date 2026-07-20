/**
 * Fix Script: Restore covers for books that lost them
 *
 * Strategy:
 * 1. Short stories/novellas from a known collection → use collection's cover (semantically correct)
 * 2. Books that got wrong/duplicate covers → try harder Open Library search
 * 3. Books that never had covers → try harder search with alternate queries
 *
 * Usage: npx tsx scripts/fix-covers.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const COVERS_DIR = path.join(process.cwd(), 'public', 'images', 'books');

// Map short stories/novellas to their parent collection's cover
// These stories don't have standalone editions — the collection cover is the right cover
const PARENT_COLLECTION_COVER: Record<string, string> = {
  // From Night Shift collection
  'the-woman-in-the-room': '/images/books/night-shift.jpg',
  'no-smoking': '/images/books/night-shift.jpg',
  'the-lawnmower-man': '/images/books/night-shift.jpg',
  'sometimes-they-come-back': '/images/books/night-shift.jpg',
  'the-mangler': '/images/books/night-shift.jpg',
  'graveyard-shift': '/images/books/night-shift.jpg',
  // From Full Dark, No Stars collection
  '1922': '/images/books/full-dark-no-stars.jpg',
};

// Books that need a fresh Open Library search (not from a known collection)
// We'll try harder with different search queries
const NEEDS_FRESH_SEARCH = [
  'sleepwalkers',
  'maximum-overdrive',
  'the-diary-of-ellen-rimbauer',
  'quicksilver-highway',
  'the-rage-carrie-2',
];

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
}

async function searchOpenLibrary(title: string, extraQuery?: string): Promise<OpenLibraryDoc | null> {
  const query = encodeURIComponent(`${title} ${extraQuery || 'stephen king'}`);
  const url = `https://openlibrary.org/search.json?q=${query}&limit=5`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as any;
    const docs: OpenLibraryDoc[] = data.docs || [];

    if (docs.length === 0) return null;

    // Prefer exact title match
    const exact = docs.find((d: OpenLibraryDoc) =>
      d.title?.toLowerCase() === title.toLowerCase()
    );
    // Then prefer any with a cover
    const withCover = docs.find((d: OpenLibraryDoc) => d.cover_i);
    return exact || withCover || docs[0] || null;
  } catch {
    return null;
  }
}

async function downloadCover(coverId: number, slug: string): Promise<string | null> {
  const url = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const filepath = path.join(COVERS_DIR, `${slug}.jpg`);
    await writeFile(filepath, buffer);
    return `/images/books/${slug}.jpg`;
  } catch {
    return null;
  }
}

async function main() {
  console.log('🔧 Fixing book covers...\n');

  if (!existsSync(BOOKS_FILE)) {
    console.error('❌ data/books.json not found');
    process.exit(1);
  }
  if (!existsSync(COVERS_DIR)) mkdirSync(COVERS_DIR, { recursive: true });

  const books: any[] = JSON.parse(readFileSync(BOOKS_FILE, 'utf-8'));

  // Build slug→book map for quick lookup
  const bookMap = new Map(books.map((b: any) => [b.slug, b]));

  let assignedFromCollection = 0;
  let foundNewCover = 0;
  let stillMissing = 0;

  // ── Step 1: Assign parent collection covers ──────────
  console.log('📚 Assigning parent collection covers to short stories/novellas:\n');
  for (const [slug, coverPath] of Object.entries(PARENT_COLLECTION_COVER)) {
    const book = bookMap.get(slug);
    if (book) {
      const parentSlug = coverPath.split('/').pop()?.replace('.jpg', '') || '';
      const parentBook = bookMap.get(parentSlug);
      const parentTitle = parentBook?.title || parentSlug;
      console.log(`  ${book.title} → ${parentTitle} collection cover`);
      book.coverImage = coverPath;
      assignedFromCollection++;
    }
  }

  // ── Step 2: Fresh search for non-collection books ──
  console.log('\n🔍 Searching Open Library for remaining books:\n');
  for (const slug of NEEDS_FRESH_SEARCH) {
    const book = bookMap.get(slug);
    if (!book) continue;

    // Already has a cover? Skip.
    if (book.coverImage && !NEEDS_FRESH_SEARCH.includes(slug)) continue;

    // Try different search strategies
    const title = book.title.replace(/^'/, '');
    const strategies = [
      `${title} stephen king`,
      `${title} novel`,
      `${title} book`,
      title, // bare title
    ];

    let found = false;
    for (const query of strategies) {
      const ol = await searchOpenLibrary(title, query.replace(title, '').trim());
      if (ol?.cover_i) {
        console.log(`  [${slug}] Trying: "${query}" → Found: "${ol.title}" (cover: ${ol.cover_i})`);
        const localPath = await downloadCover(ol.cover_i, slug);
        if (localPath) {
          book.coverImage = localPath;
          if (ol.isbn?.[0]) book.isbn = book.isbn || ol.isbn[0];
          foundNewCover++;
          found = true;
          console.log(`    ✅ Downloaded cover for ${book.title}`);
          break;
        }
      }
    }

    if (!found) {
      // Last resort: try without any author filter
      console.log(`  [${slug}] Trying bare title...`);
      const ol = await searchOpenLibrary(title, '');
      if (ol?.cover_i) {
        const localPath = await downloadCover(ol.cover_i, slug);
        if (localPath) {
          book.coverImage = localPath;
          foundNewCover++;
          found = true;
          console.log(`    ✅ Found via bare title: "${ol.title}"`);
        }
      }
    }

    if (!found) {
      stillMissing++;
      console.log(`    ❌ No cover found for: ${book.title}`);
    }

    // Save progress every few books
    await new Promise(r => setTimeout(r, 500));
  }

  // ── Step 3: Save books.json ──────────────────────────
  writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf-8');
  console.log('\n📄 books.json updated');

  // ── Step 4: Update database ──────────────────────────
  console.log('\n🗄️  Updating database...');
  for (const book of books) {
    if (book.coverImage) {
      await prisma.book.updateMany({
        where: { slug: book.slug },
        data: { coverImage: book.coverImage },
      });
    }
  }
  console.log('   ✅ Database updated');

  // ── Summary ──────────────────────────────────────────
  const dbBooks = await prisma.book.findMany({
    select: { slug: true, title: true, coverImage: true },
  });
  const missingCover = dbBooks.filter(b => !b.coverImage);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Cover fix complete!`);
  console.log(`   Assigned from collection: ${assignedFromCollection}`);
  console.log(`   New covers downloaded:   ${foundNewCover}`);
  console.log(`   Still missing:           ${stillMissing}`);
  console.log(`   Total with cover:        ${dbBooks.length - missingCover.length}/${dbBooks.length}`);
  if (missingCover.length > 0) {
    console.log(`\n   ⚠️  Still no cover:`);
    for (const b of missingCover) {
      console.log(`     - ${b.title} (${b.slug})`);
    }
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main()
  .catch((e) => {
    console.error('Fix error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
