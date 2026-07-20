/**
 * Affiliate link generation
 *
 * Two revenue channels:
 * 1. JustWatch deeplinks — streaming affiliate (primary)
 * 2. Amazon Associates — book purchases (secondary)
 */

const AMAZON_TAG = process.env.AMAZON_AFFILIATE_TAG || 'stephenkingdb-20';
const JUSTWATCH_PARTNER = process.env.JUSTWATCH_PARTNER_TOKEN || '';

/**
 * Generate an Amazon affiliate link for a book.
 * Uses the ASIN (Amazon Standard Identification Number) from the stored URL.
 */
export function amazonBookAffiliateUrl(
  amazonUrl: string | null,
  tag: string = AMAZON_TAG
): string | null {
  if (!amazonUrl) return null;

  // Extract ASIN from Amazon URL (e.g., /dp/1501142976 or /product/1501142976)
  const asinMatch = amazonUrl.match(/\/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/i);
  if (!asinMatch) return amazonUrl; // Return original if can't parse

  // Reconstruct clean affiliate URL
  return `https://www.amazon.com/dp/${asinMatch[1]}?tag=${tag}`;
}

/**
 * Generate a JustWatch tracking link for a streaming offer.
 * JustWatch's Content Partner API provides deeplinks directly.
 * For the public GraphQL approach (MVP), construct the link manually.
 */
export function justWatchAffiliateUrl(
  adaptationType: string,
  adaptationSlug: string,
  country = 'us'
): string {
  const mediaType =
    adaptationType === 'TV_SERIES' || adaptationType === 'MINISERIES'
      ? 'tv-show'
      : 'movie';

  // JustWatch title page — their affiliate tracking is automatic
  return `https://www.justwatch.com/${country}/${mediaType}/${adaptationSlug}`;
}

/**
 * Build a "watch now" button link with tracking params.
 * For streaming links obtained through the JustWatch Partner API,
 * the URL already contains tracking. For manually added links,
 * we append UTM params for our own analytics.
 */
export function watchNowUrl(
  baseUrl: string,
  adaptationSlug: string,
  platform: string
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'stephenkingdb');
  url.searchParams.set('utm_medium', 'affiliate');
  url.searchParams.set('utm_campaign', `watch-${platform.toLowerCase()}`);
  url.searchParams.set('utm_content', adaptationSlug);
  return url.toString();
}
