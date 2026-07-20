/**
 * WhereToWatch — THE monetization component
 *
 * Displays streaming availability with affiliate links.
 * Primary revenue driver for the site.
 *
 * Sections prioritized by user intent:
 *   1. Subscription (included with plan) ← most valuable
 *   2. Free with Ads                         ← high conversion
 *   3. Rent                                  ← lower intent
 *   4. Buy                                   ← lowest intent
 */

import type { StreamingLink } from '@prisma/client';
import { getPlatformLabel } from '@/lib/utils';
import { ExternalLink, Tv, Monitor, Smartphone } from 'lucide-react';

interface WhereToWatchProps {
  links: StreamingLink[];
  lastVerified: Date;
}

const LINK_TYPE_CONFIG: Record<string, { label: string; priority: number; icon: React.ReactNode }> = {
  SUBSCRIPTION: { label: 'Stream', priority: 1, icon: <Tv className="w-4 h-4" /> },
  FREE_WITH_ADS: { label: 'Free with Ads', priority: 2, icon: <Monitor className="w-4 h-4" /> },
  RENT: { label: 'Rent', priority: 3, icon: <Smartphone className="w-4 h-4" /> },
  BUY: { label: 'Buy', priority: 4, icon: <Smartphone className="w-4 h-4" /> },
};

function formatLastVerified(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function SectionTitle({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
      {icon}
      {label}
    </h4>
  );
}

function StreamingButton({ link }: { link: StreamingLink }) {
  const label = getPlatformLabel(link.platform);
  const priceTag = link.price ? ` — ${link.price}` : '';
  const qualityBadge = link.quality ? link.quality : null;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="nofollow sponsored noopener"
      className="flex items-center justify-between w-full px-4 py-3 rounded-lg border
                 bg-background hover:bg-muted/50 transition-colors
                 group focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <div className="flex items-center gap-3">
        {/* Platform logo placeholder — TMDB provides provider logos */}
        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
          {label.slice(0, 2)}
        </div>
        <div>
          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
            {label}
          </span>
          <span className="text-sm text-muted-foreground ml-1">
            {priceTag}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {qualityBadge && (
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {qualityBadge}
          </span>
        )}
        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </a>
  );
}

export function WhereToWatch({ links, lastVerified }: WhereToWatchProps) {
  if (links.length === 0) {
    return (
      <div className="rounded-xl border p-6 bg-card">
        <h3 className="text-lg font-semibold mb-2">📺 Where to Watch</h3>
        <p className="text-muted-foreground">
          Streaming availability information is being updated. Check back soon!
        </p>
      </div>
    );
  }

  // Group by link type and sort by priority
  const grouped = new Map<string, StreamingLink[]>();
  for (const link of links) {
    const existing = grouped.get(link.linkType) || [];
    existing.push(link);
    grouped.set(link.linkType, existing);
  }

  const sortedGroups = Array.from(grouped.entries()).sort(
    ([a], [b]) =>
      (LINK_TYPE_CONFIG[a]?.priority || 99) -
      (LINK_TYPE_CONFIG[b]?.priority || 99)
  );

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">📺 Where to Watch</h3>

      <div className="space-y-4">
        {sortedGroups.map(([linkType, typeLinks]) => {
          const config = LINK_TYPE_CONFIG[linkType];
          if (!config) return null;

          return (
            <div key={linkType}>
              <SectionTitle label={config.label} icon={config.icon} />
              <div className="space-y-2">
                {typeLinks.map(link => (
                  <StreamingButton key={link.id} link={link} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-6 pt-4 border-t">
        ✅ Last verified: {formatLastVerified(lastVerified)}
        {' · '}
        <a
          href="https://www.justwatch.com"
          target="_blank"
          rel="noopener"
          className="hover:underline"
        >
          Data via JustWatch
        </a>
        {' · '}Contains affiliate links
      </p>
    </div>
  );
}
