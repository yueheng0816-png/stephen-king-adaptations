import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  // Issue 1: Check stored text
  console.log('=== ISSUE 1: Stored text length ===');
  const shining = await p.adaptation.findFirst({ where: { title: 'The Shining' } });
  console.log('overviewCn length:', shining?.overviewCn?.length || 0);
  console.log('overviewCn:', shining?.overviewCn?.slice(0, 200));
  console.log('---');
  console.log('review length:', shining?.review?.length || 0);
  console.log('review:', shining?.review?.slice(0, 200));

  const shawshank = await p.adaptation.findFirst({ where: { title: 'The Shawshank Redemption' } });
  console.log('\nShawshank overviewCn length:', shawshank?.overviewCn?.length || 0);
  console.log('Shawshank review length:', shawshank?.review?.length || 0);

  // Check a few more random ones
  const all = await p.adaptation.findMany({
    select: { title: true, overviewCn: true, review: true },
    take: 10,
  });
  console.log('\n=== First 10 adaptations text stats ===');
  all.forEach(a => {
    console.log(`${a.title}: overviewCn=${a.overviewCn?.length || 0}c, review=${a.review?.length || 0}c`);
  });

  // Issue 3: Missing posters
  console.log('\n=== ISSUE 3: Missing posters ===');
  const noPoster = await p.adaptation.findMany({
    where: { posterImage: null },
    select: { title: true, slug: true, tmdbId: true, releaseYear: true },
  });
  console.log('Count:', noPoster.length);
  noPoster.forEach(a => console.log(`  - ${a.title} (${a.releaseYear}) slug:${a.slug} tmdb:${a.tmdbId}`));

  // Check poster map
  const posterCount = await p.adaptation.count({ where: { posterImage: { not: null } } });
  console.log(`\nWith posters: ${posterCount} / ${await p.adaptation.count()}`);
}

main().catch(console.error).finally(() => p.$disconnect());
