/**
 * Pipeline Step 6: Enrich Book Data
 *
 * Fetches covers, ISBNs, and descriptions from Open Library API (free, no auth).
 * Builds Amazon/Kindle affiliate URLs.
 *
 * Usage: npx tsx scripts/06-fetch-book-covers.ts
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const COVERS_DIR = path.join(process.cwd(), 'public', 'images', 'books');

const AMAZON_TAG = process.env.AMAZON_AFFILIATE_TAG || 'stephenkingdb-20';

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_sentence?: string[];
  subject?: string[];
}

async function searchOpenLibrary(title: string): Promise<OpenLibraryDoc | null> {
  const query = encodeURIComponent(`${title} stephen king`);
  const url = `https://openlibrary.org/search.json?q=${query}&limit=3`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as any;
    const docs: OpenLibraryDoc[] = data.docs || [];

    // Prefer exact title match
    const exact = docs.find(d =>
      d.title?.toLowerCase() === title.toLowerCase() &&
      d.author_name?.some(a => a.toLowerCase().includes('king'))
    );
    return exact || docs[0] || null;
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

function buildAmazonUrl(isbn: string | null, title: string): string {
  if (isbn) {
    return `https://www.amazon.com/dp/${isbn}?tag=${AMAZON_TAG}`;
  }
  // Fallback: search URL
  const q = encodeURIComponent(`Stephen King ${title}`);
  return `https://www.amazon.com/s?k=${q}&tag=${AMAZON_TAG}`;
}

function buildKindleUrl(isbn: string | null, title: string): string {
  if (isbn) {
    return `https://www.amazon.com/dp/B0${isbn.slice(1)}?tag=${AMAZON_TAG}`;
  }
  const q = encodeURIComponent(`Stephen King ${title} Kindle`);
  return `https://www.amazon.com/s?k=${q}&i=digital-text&tag=${AMAZON_TAG}`;
}

async function main() {
  if (!existsSync(BOOKS_FILE)) {
    console.error('❌ data/books.json not found. Run 01-fetch-books first.');
    process.exit(1);
  }
  if (!existsSync(COVERS_DIR)) mkdirSync(COVERS_DIR, { recursive: true });

  const books: any[] = JSON.parse(readFileSync(BOOKS_FILE, 'utf-8'));
  console.log(`📚 Enriching ${books.length} books with covers, ISBNs, descriptions...\n`);

  let enriched = 0;
  let covers = 0;

  for (let i = 0; i < books.length; i++) {
    const book = books[i];

    // Skip already enriched
    if (book.isbn && book.coverImage && book.description) {
      enriched++;
      continue;
    }

    const title = book.title.replace(/^'/, ''); // Strip leading apostrophe
    console.log(`  [${i + 1}/${books.length}] ${book.title}...`);

    const ol = await searchOpenLibrary(title);
    if (ol) {
      // ISBN
      if (!book.isbn && ol.isbn?.length) {
        book.isbn = ol.isbn[0];
      }

      // Page count
      if (!book.pageCount && ol.number_of_pages_median) {
        book.pageCount = ol.number_of_pages_median;
      }

      // Description from first sentence
      if (!book.description && ol.first_sentence?.length) {
        book.description = ol.first_sentence.slice(0, 3).join(' ');
      }

      // Cover image
      if (!book.coverImage && ol.cover_i) {
        const localPath = await downloadCover(ol.cover_i, book.slug);
        if (localPath) {
          book.coverImage = localPath;
          covers++;
        }
      }
    }

    // Amazon affiliate links
    if (!book.amazonUrl) {
      book.amazonUrl = buildAmazonUrl(book.isbn || null, book.title);
    }
    if (!book.kindleUrl) {
      book.kindleUrl = buildKindleUrl(book.isbn || null, book.title);
    }

    enriched++;
    if (ol) console.log(`    ✅ ISBN:${book.isbn || '?'} Pages:${book.pageCount || '?'} Cover:${book.coverImage ? '✅' : '❌'}`);
    else console.log(`    ⚠️  Not found on Open Library`);

    // Save every 10
    if ((i + 1) % 10 === 0) {
      writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf-8');
    }

    await new Promise(r => setTimeout(r, 300));
  }

  writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf-8');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Enriched: ${enriched}/${books.length}`);
  console.log(`   📸 Covers downloaded: ${covers}`);
  console.log(`   💰 Affiliate tag: ${AMAZON_TAG}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
