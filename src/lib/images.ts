/**
 * Image path resolution utilities
 *
 * STS2 Lesson: Single source of truth for image paths.
 * All images are downloaded locally during the data pipeline.
 * No external CDN references at runtime.
 *
 * Contrast with STS2:
 *   STS2 had 3 sources: CDN PNGs, generated SVGs, game-exported PNGs
 *   King has 1 source: local /public/images/*
 */

export function getPosterPath(slug: string, ext = '.jpg'): string {
  return `/images/posters/${slug}${ext}`;
}

export function getBookCoverPath(slug: string, ext = '.jpg'): string {
  return `/images/books/${slug}${ext}`;
}

export function getPersonPhotoPath(slug: string, ext = '.jpg'): string {
  return `/images/people/${slug}${ext}`;
}

/**
 * Get the image dimensions for next/image fixed sizes.
 * Standard movie poster aspect ratio: 2:3
 */
export const POSTER_DIMENSIONS = {
  width: 500,
  height: 750,
} as const;

export const BOOK_COVER_DIMENSIONS = {
  width: 400,
  height: 600,
} as const;

export const PERSON_PHOTO_DIMENSIONS = {
  width: 300,
  height: 450,
} as const;

/**
 * CSS-based fallback when an image is missing.
 * STS2 experience: having a styled placeholder is better than a broken image.
 */
export const IMAGE_FALLBACK_CLASSES =
  'bg-muted flex items-center justify-center text-muted-foreground text-sm';
