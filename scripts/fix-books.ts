/**
 * Fix Script: Correct book cover issues and remove machine-translated Chinese titles
 *
 * Issues addressed:
 * 1. Remove incorrect covers from short stories that got collection covers (Night Shift → its stories)
 * 2. Remove shared duplicate covers (cats-eye == sleepwalkers == maximum-overdrive)
 * 3. Remove covers for books where Open Library returned wrong match
 * 4. Remove machine-translated Chinese titles (titleCn) from ALL books
 *
 * Usage: npx tsx scripts/fix-books.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');

// Books whose covers should be removed because:
// A) Short stories from Night Shift that got the collection cover
// B) Novellas from Full Dark, No Stars that got the collection cover
// C) Completely wrong/unrelated covers from Open Library
const BOOKS_TO_REMOVE_COVER = new Set([
  // From Night Shift collection (all got night-shift cover)
  'the-woman-in-the-room',
  'no-smoking',
  'the-lawnmower-man',
  'sometimes-they-come-back',
  'the-mangler',
  'graveyard-shift',
  // From Full Dark, No Stars collection (got full-dark-no-stars cover)
  '1922',
  // Shared identical wrong cover (cats-eye.jpg == sleepwalkers.jpg == maximum-overdrive.jpg)
  'sleepwalkers',
  'maximum-overdrive',
  // These 3 never found a cover — ensure they stay clean
  'the-diary-of-ellen-rimbauer',
  'quicksilver-highway',
  'the-rage-carrie-2',
]);

async function main() {
  console.log('🔧 Fixing book data...\n');

  // ── 1. Fix books.json ─────────────────────────────
  if (!existsSync(BOOKS_FILE)) {
    console.error('❌ data/books.json not found');
    process.exit(1);
  }

  const books = JSON.parse(readFileSync(BOOKS_FILE, 'utf-8'));
  let removedCovers = 0;
  let removedTitles = 0;

  for (const book of books) {
    // Remove all machine-translated Chinese titles
    if (book.titleCn) {
      delete book.titleCn;
      removedTitles++;
    }

    // Remove incorrect covers
    if (BOOKS_TO_REMOVE_COVER.has(book.slug) && book.coverImage) {
      console.log(`  🗑️  Removing cover from: ${book.title} (${book.slug})`);
      delete book.coverImage;
      removedCovers++;
    }
  }

  writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf-8');
  console.log(`\n📄 books.json updated:`);
  console.log(`   - Removed ${removedCovers} incorrect covers`);
  console.log(`   - Removed ${removedTitles} machine-translated Chinese titles`);

  // ── 2. Update database ────────────────────────────
  console.log('\n🗄️  Updating database...');

  for (const book of books) {
    const updateData: any = {};

    if (!book.titleCn) {
      updateData.titleCn = null;
    }

    if (BOOKS_TO_REMOVE_COVER.has(book.slug) && !book.coverImage) {
      updateData.coverImage = null;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.book.updateMany({
        where: { slug: book.slug },
        data: updateData,
      });
    }
  }

  console.log('   ✅ Database updated');

  // ── 3. Summary ────────────────────────────────────
  const dbBooks = await prisma.book.findMany({
    select: { slug: true, title: true, coverImage: true, titleCn: true },
  });

  const missingCover = dbBooks.filter(b => !b.coverImage);
  const hasTitleCn = dbBooks.filter(b => b.titleCn);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Fix complete!`);
  console.log(`   Books without cover: ${missingCover.length}/${dbBooks.length}`);
  console.log(`   Books with Chinese title: ${hasTitleCn.length} (should be 0)`);
  if (missingCover.length > 0) {
    console.log(`   No-cover books:`);
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
