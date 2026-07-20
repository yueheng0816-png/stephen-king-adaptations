'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import FlexSearch from 'flexsearch';
import { Search, X } from 'lucide-react';
import { cn, getAdaptationTypeLabel } from '@/lib/utils';

interface SearchItem {
  slug: string;
  title: string;
  titleCn: string | null;
  releaseYear: number | null;
  type: string;
  overview: string | null;
}

interface SearchBarProps {
  items: SearchItem[];
  className?: string;
}

export function SearchBar({ items, className }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const indexRef = useRef<FlexSearch.Index | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build FlexSearch index once
  useEffect(() => {
    const index = new FlexSearch.Index({
      tokenize: 'forward',
      preset: 'performance',
    });

    items.forEach(item => {
      const searchText = [item.title, item.titleCn, item.overview]
        .filter(Boolean)
        .join(' ');
      index.add(item.slug as any, searchText);
    });

    indexRef.current = index;
  }, [items]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    setSelectedIndex(-1);

    if (!indexRef.current || q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const slugs = indexRef.current.search(q) as string[];
    const matched = slugs
      .map(slug => items.find(i => i.slug === slug))
      .filter(Boolean) as SearchItem[];
    setResults(matched.slice(0, 8));
    setIsOpen(matched.length > 0);
  };

  const navigateTo = (slug: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/adaptations/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.length >= 2) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i < results.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i > 0 ? i - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          navigateTo(results[selectedIndex].slug);
        } else {
          router.push(`/search?q=${encodeURIComponent(query)}`);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search adaptations, books, directors..."
          className="w-full pl-10 pr-10 py-3 rounded-xl border bg-background text-foreground
                     placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                     text-base"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-full mt-2 w-full bg-card border rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          {results.map((item, index) => (
            <button
              key={item.slug}
              onClick={() => navigateTo(item.slug)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors',
                'hover:bg-muted focus:bg-muted',
                index === selectedIndex && 'bg-muted'
              )}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{item.title}</span>
                  {item.releaseYear && (
                    <span className="text-sm text-muted-foreground shrink-0">
                      ({item.releaseYear})
                    </span>
                  )}
                </div>
                {item.titleCn && (
                  <p className="text-sm text-muted-foreground truncate">
                    {item.titleCn}
                  </p>
                )}
                <span className="text-xs text-muted-foreground">
                  {getAdaptationTypeLabel(item.type)}
                </span>
              </div>
            </button>
          ))}

          <div className="border-t px-4 py-2">
            <button
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(query)}`);
                setIsOpen(false);
              }}
              className="w-full text-center text-sm text-primary hover:underline py-1"
            >
              See all results for &ldquo;{query}&rdquo; →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
