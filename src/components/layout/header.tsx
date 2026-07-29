'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Film, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/adaptations', label: 'Adaptations', icon: Film, isParent: true },
  { href: '/adaptations/top', label: 'Top Rated' },
  { href: '/books', label: 'Books', icon: BookOpen, isParent: true },
];

function isNavActive(pathname: string, item: (typeof NAV_ITEMS)[number]): boolean {
  // Exact match
  if (pathname === item.href) return true;
  // Parent nav: highlight for child pages (/adaptations/[slug], /adaptations/by-decade/...)
  // but NOT for sibling nav items (/adaptations/top, /adaptations/by-platform/...)
  if ('isParent' in item && item.isParent && pathname.startsWith(item.href + '/')) {
    const siblingMatch = NAV_ITEMS.some(
      other => other.href !== item.href &&
        (pathname === other.href || pathname.startsWith(other.href + '/')),
    );
    return !siblingMatch;
  }
  return false;
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🎬</span>
          <span className="hidden sm:inline">Stephen King</span>
          <span className="text-muted-foreground hidden sm:inline">Adaptations</span>
          {/* Mobile: compact logo */}
          <span className="sm:hidden">SK Adaptations</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const isActive = isNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <nav className="md:hidden border-t bg-background px-4 py-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = isNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
