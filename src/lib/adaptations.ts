import { prisma } from './db';
import type { Adaptation, Book, Rating, StreamingLink, Person, CastMember } from '@prisma/client';

// ── Adaptations ──────────────────────────────────────────

export async function getAllAdaptationSlugs(): Promise<string[]> {
  const adaptations = await prisma.adaptation.findMany({
    select: { slug: true },
  });
  return adaptations.map(a => a.slug);
}

export async function getAdaptationBySlug(
  slug: string
): Promise<
  | (Adaptation & {
      book: Book | null;
      director: Person | null;
      ratings: Rating[];
      streamingLinks: StreamingLink[];
      cast: (CastMember & { person: Person })[];
    })
  | null
> {
  return prisma.adaptation.findUnique({
    where: { slug },
    include: {
      book: true,
      director: true,
      ratings: true,
      streamingLinks: {
        orderBy: { linkType: 'asc' },
      },
      cast: {
        include: { person: true },
        orderBy: { order: 'asc' },
        take: 15,
      },
    },
  });
}

export async function getTopAdaptations(limit = 50) {
  return prisma.adaptation.findMany({
    where: { rating: { not: null } },
    orderBy: { rating: 'desc' },
    take: limit,
    include: {
      ratings: true,
      book: { select: { title: true, slug: true } },
    },
  });
}

export async function getLatestAdaptations(limit = 10) {
  return prisma.adaptation.findMany({
    where: { releaseYear: { not: null } },
    orderBy: { releaseYear: 'desc' },
    take: limit,
    include: {
      ratings: true,
      book: { select: { title: true, slug: true } },
    },
  });
}

export interface AdaptationFilters {
  type?: string;
  decade?: number;
  minRating?: number;
  platform?: string;
  sort?: string;
}

export async function getFilteredAdaptations(filters: AdaptationFilters) {
  const where: any = {};

  if (filters.type) where.type = filters.type;
  if (filters.minRating) where.rating = { gte: filters.minRating };
  if (filters.decade) {
    where.releaseYear = {
      gte: filters.decade,
      lt: filters.decade + 10,
    };
  }
  if (filters.platform) {
    where.streamingLinks = { some: { platform: filters.platform } };
  }

  let orderBy: any = { rating: 'desc' };
  switch (filters.sort) {
    case 'year_desc':
      orderBy = { releaseYear: 'desc' };
      break;
    case 'year_asc':
      orderBy = { releaseYear: 'asc' };
      break;
    case 'title':
      orderBy = { title: 'asc' };
      break;
    case 'rating':
    default:
      orderBy = { rating: 'desc' };
  }

  return prisma.adaptation.findMany({
    where,
    orderBy,
    include: {
      ratings: true,
      streamingLinks: { select: { platform: true } },
      book: { select: { title: true, slug: true } },
    },
  });
}

// ── Books ────────────────────────────────────────────────

export async function getAllBookSlugs(): Promise<string[]> {
  const books = await prisma.book.findMany({ select: { slug: true } });
  return books.map(b => b.slug);
}

export async function getBookBySlug(slug: string) {
  return prisma.book.findUnique({
    where: { slug },
    include: {
      adaptations: {
        orderBy: { releaseYear: 'desc' },
        include: {
          ratings: true,
        },
      },
      collections: {
        include: { collection: true },
      },
    },
  });
}

// ── People ───────────────────────────────────────────────

export async function getPersonBySlug(slug: string) {
  return prisma.person.findUnique({
    where: { slug },
    include: {
      directedWorks: {
        orderBy: { releaseYear: 'desc' },
        include: { ratings: true },
      },
      castInWorks: {
        include: {
          adaptation: {
            include: { ratings: true },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
}

// ── Aggregations ─────────────────────────────────────────

export async function getSiteStats() {
  const [adaptationCount, bookCount, tvCount, movieCount] = await Promise.all([
    prisma.adaptation.count(),
    prisma.book.count(),
    prisma.adaptation.count({ where: { type: { in: ['TV_SERIES', 'MINISERIES'] } } }),
    prisma.adaptation.count({ where: { type: 'MOVIE' } }),
  ]);

  return { adaptationCount, bookCount, tvCount, movieCount };
}

// ── Search (server-side, used by /search page) ───────────

export async function searchAdaptations(query: string) {
  return prisma.adaptation.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { titleCn: { contains: query } },
        { overview: { contains: query } },
        { overviewCn: { contains: query } },
      ],
    },
    include: {
      ratings: true,
      book: { select: { title: true, slug: true } },
    },
    take: 20,
  });
}
