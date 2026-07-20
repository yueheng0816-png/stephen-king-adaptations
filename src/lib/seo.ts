import type { Metadata } from 'next';
import type { Adaptation, Book, Person, Rating } from '@prisma/client';
import { truncateForSEO } from './utils';

export const SITE_NAME = 'Stephen King Adaptations';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://stephenkingadaptations.com';
export const DEFAULT_DESCRIPTION =
  'Every Stephen King movie and TV adaptation — ratings, streaming availability, and how they compare to the books.';

/**
 * Generate full metadata for an adaptation detail page.
 * Includes Open Graph, Twitter Card, and Schema.org JSON-LD.
 */
export function generateAdaptationMetadata(
  adaptation: Adaptation & {
    book: Book | null;
    director: Person | null;
    ratings: Rating[];
  }
): Metadata {
  const imdbRating = adaptation.ratings.find(r => r.source === 'IMDB');
  const rtRating = adaptation.ratings.find(r => r.source === 'ROTTEN_TOMATOES');

  // Construct SEO title
  const titleParts = [adaptation.title];
  if (adaptation.releaseYear) titleParts.push(`(${adaptation.releaseYear})`);
  titleParts.push('Stephen King Adaptation');
  const title = titleParts.join(' ');

  // Construct SEO description
  const descriptionParts: string[] = [];
  if (adaptation.overviewCn) {
    descriptionParts.push(adaptation.overviewCn);
  } else if (adaptation.overview) {
    descriptionParts.push(adaptation.overview);
  }
  if (imdbRating) {
    descriptionParts.push(`IMDb: ${imdbRating.score}/10.`);
  }
  if (rtRating) {
    descriptionParts.push(`Rotten Tomatoes: ${Math.round(rtRating.score)}%.`);
  }
  if (adaptation.book) {
    descriptionParts.push(
      `Based on Stephen King's "${adaptation.book.title}".`
    );
  }
  descriptionParts.push('Find where to stream it online.');
  const description = truncateForSEO(descriptionParts.join(' '));

  // Poster URL for OG
  const ogImages = adaptation.posterImage
    ? [
        {
          url: `${SITE_URL}${adaptation.posterImage}`,
          width: 500,
          height: 750,
          alt: `${adaptation.title} poster`,
        },
      ]
    : [];

  // Determine OG type
  const ogType =
    adaptation.type === 'TV_SERIES' || adaptation.type === 'MINISERIES'
      ? 'video.tv_show'
      : 'video.movie';

  // Schema.org JSON-LD
  const schemaType =
    adaptation.type === 'TV_SERIES' || adaptation.type === 'MINISERIES'
      ? 'TVSeries'
      : 'Movie';

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: adaptation.title,
    dateCreated: adaptation.releaseYear?.toString(),
    description: adaptation.overview?.slice(0, 500),
  };

  if (adaptation.director) {
    jsonLd.director = {
      '@type': 'Person',
      name: adaptation.director.name,
      url: `${SITE_URL}/people/${adaptation.director.slug}`,
    };
  }

  if (imdbRating) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: imdbRating.score.toString(),
      bestRating: imdbRating.maxScore.toString(),
      ratingCount: imdbRating.voteCount || undefined,
    };
  }

  if (adaptation.book) {
    jsonLd.isBasedOn = {
      '@type': 'Book',
      name: adaptation.book.title,
      author: { '@type': 'Person', name: 'Stephen King' },
    };
  }

  // Add WatchAction for streaming links
  if (adaptation.posterImage) {
    jsonLd.image = `${SITE_URL}${adaptation.posterImage}`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/adaptations/${adaptation.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/adaptations/${adaptation.slug}`,
      siteName: SITE_NAME,
      images: ogImages,
      type: ogType as 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: adaptation.posterImage
        ? [`${SITE_URL}${adaptation.posterImage}`]
        : [],
    },
    other: {
      'application-ld+json': JSON.stringify(jsonLd),
    },
  };
}

/**
 * Default metadata for pages without specific page-level metadata.
 */
export function generateDefaultMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} — Ratings, Streaming & Book Comparisons`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    openGraph: {
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/images/og-default.jpg`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@stephenkingdb',
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}
