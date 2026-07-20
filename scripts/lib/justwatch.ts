/**
 * JustWatch Public GraphQL API 封装
 *
 * Endpoint: https://apis.justwatch.com/graphql
 * No auth required. Rate limit: ~1 req/sec recommended.
 *
 * Based on reverse-engineered API (probed live, July 2026).
 */

import 'dotenv/config';

const JW_GRAPHQL = 'https://apis.justwatch.com/graphql';

// ── Types ────────────────────────────────────────────

export interface JustWatchOffer {
  monetizationType: 'FLATRATE' | 'RENT' | 'BUY' | 'ADS' | 'FREE';
  presentationType: 'SD' | 'HD' | '_4K' | null;
  retailPrice: string | null;
  standardWebURL: string;
  deeplinkURL: string | null;
  package: {
    clearName: string;
    technicalName: string;
    icon: string;
  };
}

export interface JustWatchTitle {
  id: string;
  objectId: number;
  objectType: 'MOVIE' | 'SHOW';
  content: {
    title: string;
    fullPath: string;
    originalReleaseYear: number | null;
    shortDescription?: string | null;
    posterUrl?: string | null;
  };
  offers: JustWatchOffer[];
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// ── Queries ──────────────────────────────────────────

/** Search popularTitles with filter */
const SEARCH_QUERY = `
query SearchJW(
  $country: Country!, $first: Int!, $searchQuery: String!,
  $minYear: Int, $maxYear: Int, $objectTypes: [ObjectType!]
) {
  popularTitles(
    country: $country
    first: $first
    sortBy: POPULAR
    sortRandomSeed: 0
    filter: {
      searchQuery: $searchQuery
      objectTypes: $objectTypes
      releaseYear: { min: $minYear, max: $maxYear }
    }
  ) {
    totalCount
    edges {
      node {
        id
        objectId
        objectType
        content(country: $country, language: en) {
          title
          fullPath
          originalReleaseYear
          shortDescription
          posterUrl
        }
        ... on MovieOrShow {
          offers(country: $country, platform: WEB) {
            monetizationType
            presentationType
            retailPrice(language: en)
            standardWebURL
            deeplinkURL(platform: WEB)
            package {
              clearName
              technicalName
              icon
            }
          }
        }
      }
    }
  }
}`;

/** Get specific node by ID (for deduplicated offers lookup) */
const NODE_QUERY = `
query GetNode($nodeId: ID!, $country: Country!) {
  node(id: $nodeId) {
    id
    ... on MovieOrShow {
      objectId
      objectType
      content(country: $country, language: en) {
        title
        fullPath
        originalReleaseYear
        posterUrl
      }
      offers(country: $country, platform: WEB) {
        monetizationType
        presentationType
        retailPrice(language: en)
        standardWebURL
        deeplinkURL(platform: WEB)
        package {
          clearName
          technicalName
          icon
        }
      }
    }
  }
}`;

// ── API Client ───────────────────────────────────────

async function graphqlRequest<T>(
  operationName: string,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const body = JSON.stringify({ operationName, query, variables });

  const res = await fetch(JW_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JustWatch HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const json: GraphQLResponse<T> = await res.json();

  if (json.errors?.length) {
    throw new Error(`JustWatch GQL: ${json.errors[0].message}`);
  }

  if (!json.data) {
    throw new Error('JustWatch returned empty data');
  }

  return json.data;
}

// ── Public API ───────────────────────────────────────

interface SearchResult {
  popularTitles: {
    totalCount: number;
    edges: Array<{ node: JustWatchTitle }>;
  };
}

/** Search JustWatch by title + optional year filter */
export async function searchTitle(
  title: string,
  year?: number | null,
  country = 'US'
): Promise<JustWatchTitle | null> {
  const vars: Record<string, unknown> = {
    country,
    first: 5,
    searchQuery: title,
    objectTypes: ['MOVIE', 'SHOW'],
  };

  if (year) {
    vars.minYear = year;
    vars.maxYear = year;
  }

  try {
    const data = await graphqlRequest<SearchResult>(
      'SearchJW',
      SEARCH_QUERY,
      vars
    );

    const edges = data.popularTitles?.edges || [];
    if (edges.length === 0) return null;

    // Prefer exact year match
    const exactYear = edges.find(
      e => e.node.content?.originalReleaseYear === year
    );
    return exactYear?.node || edges[0].node;
  } catch (e) {
    console.error(`  JustWatch search error for "${title}":`, (e as Error).message.slice(0, 100));
    return null;
  }
}

interface NodeResult {
  node: JustWatchTitle;
}

/** Get full details + offers for a specific JustWatch node ID */
export async function getTitleOffers(
  nodeId: string,
  country = 'US'
): Promise<JustWatchTitle | null> {
  try {
    const data = await graphqlRequest<NodeResult>(
      'GetNode',
      NODE_QUERY,
      { nodeId, country }
    );
    return data.node || null;
  } catch (e) {
    console.error(`  JustWatch node error for "${nodeId}":`, (e as Error).message.slice(0, 100));
    return null;
  }
}

// ── Mapping Utilities ────────────────────────────────

/** Map JustWatch monetization → our LinkType enum */
export function mapMonetizationType(
  type: string
): 'SUBSCRIPTION' | 'RENT' | 'BUY' | 'FREE_WITH_ADS' {
  switch (type) {
    case 'FLATRATE': return 'SUBSCRIPTION';
    case 'RENT': return 'RENT';
    case 'BUY': return 'BUY';
    case 'ADS':
    case 'FREE': return 'FREE_WITH_ADS';
    default: return 'SUBSCRIPTION';
  }
}

/** Map JustWatch presentation → quality string */
export function mapQuality(type: string | null): string | null {
  switch (type) {
    case '_4K': return '4K';
    case 'HD': return 'HD';
    case 'SD': return 'SD';
    default: return null;
  }
}

/** Map JustWatch package name → our StreamingPlatform enum */
export function mapPlatform(techName: string, clearName?: string): string {
  const name = (techName || clearName || '').toLowerCase();

  // Direct matches by technical name
  if (name.includes('netflix')) return 'NETFLIX';
  if (name.includes('amazon') && name.includes('hbo')) return 'HBO_MAX';
  if (name.includes('amazon') && !name.includes('dvd')) return 'AMAZON_PRIME';
  if (name.includes('hbo') || name === 'max') return 'HBO_MAX';
  if (name.includes('hulu')) return 'HULU';
  if (name.includes('disney')) return 'DISNEY_PLUS';
  if (name.includes('apple') && name.includes('tv')) return 'APPLE_TV_PLUS';
  if (name.includes('itunes')) return 'ITUNES';
  if (name.includes('paramount')) return 'PARAMOUNT_PLUS';
  if (name.includes('peacock')) return 'PEACOCK';
  if (name.includes('tubi')) return 'TUBI';
  if (name.includes('pluto')) return 'PLUTO_TV';
  if (name.includes('shudder')) return 'SHUDDER';
  if (name.includes('amc')) return 'AMC_PLUS';
  if (name.includes('mgm')) return 'MGM_PLUS';
  if (name.includes('starz')) return 'STARZ';
  if (name.includes('showtime')) return 'SHOWTIME';
  if (name.includes('crackle')) return 'CRACKLE';
  if (name.includes('freevee') || name === 'vudufree') return 'FREEVEE';
  if (name.includes('youtubetv')) return 'YOUTUBE';
  if (name.includes('youtube')) return 'YOUTUBE';
  if (name.includes('google') && name.includes('play')) return 'GOOGLE_PLAY';
  if (name.includes('vudu')) return 'VUDU';
  if (name.includes('fandango')) return 'VUDU';

  return 'OTHER';
}
