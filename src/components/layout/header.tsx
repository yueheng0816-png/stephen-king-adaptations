'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Film, BookOpen, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage, type Lang } from '@/lib/i18n';

const NAV_ITEMS = [
  { href: '/adaptations', label: 'Adaptations', icon: Film },
  { href: '/adaptations/top', label: 'Top Rated' },
  { href: '/books', label: 'Books', icon: BookOpen },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();

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
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-1 px-2 py-2 rounded-lg text-sm font-medium
                       text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-2"
            title={lang === 'en' ? 'Switch to 中文' : 'Switch to English'}
          >
            <Globe className="w-4 h-4" />
            <span className="w-7 text-center font-bold">{lang === 'en' ? 'EN' : '中'}</span>
          </button>
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
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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

          {/* Language Toggle (mobile) */}
          <button
            onClick={() => { setLang(lang === 'en' ? 'zh' : 'en'); setMobileOpen(false); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full
                       text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Globe className="w-4 h-4" />
            {lang === 'en' ? 'Switch to 中文' : '切换到 English'}
          </button>
        </nav>
      )}
    </header>
  );
}
