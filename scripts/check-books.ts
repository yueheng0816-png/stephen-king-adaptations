import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const books = await p.book.findMany({ include: { _count: { select: { adaptations: true } } } });
  console.log(`Books in DB: ${books.length}`);
  books.forEach(b => {
    console.log(`  - ${b.title} (${b.publicationYear}) [${b.type}] — ${b._count.adaptations} adaptations | slug: ${b.slug}`);
  });
}
main().catch(console.error).finally(() => p.$disconnect());
