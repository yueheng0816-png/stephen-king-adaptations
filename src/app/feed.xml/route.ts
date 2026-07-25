import { prisma } from '@/lib/db';

export const dynamic = 'force-static';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stephenkingadaptations.com';
const SITE_NAME = 'Stephen King Adaptations';
const SITE_DESCRIPTION =
  'Every Stephen King movie and TV adaptation — ratings, streaming availability, and how they compare to the books.';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const adaptations = await prisma.adaptation.findMany({
    where: { rating: { not: null } },
    orderBy: { rating: 'desc' },
    include: {
      ratings: true,
      book: { select: { title: true, slug: true } },
    },
  });

  const now = new Date().toUTCString();

  const items = adaptations
    .map((a) => {
      const imdb = a.ratings.find((r) => r.source === 'IMDB');
      const title = escapeXml(`${a.title} (${a.releaseYear || 'N/A'})`);
      const link = `${SITE_URL}/adaptations/${a.slug}`;
      const descParts: string[] = [];
      if (a.overview) descParts.push(a.overview.slice(0, 300));
      if (imdb) descParts.push(`IMDb: ${imdb.score.toFixed(1)}/10`);
      if (a.book) descParts.push(`Based on: ${a.book.title}`);
      const description = escapeXml(descParts.join(' | '));
      const pubDate = a.updatedAt ? new Date(a.updatedAt).toUTCString() : now;

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>Next.js SSG</generator>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
