import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-3">
              <span>🎬</span>
              Stephen King Adaptations
            </Link>
            <p className="text-sm text-muted-foreground">
              The complete database of Stephen King movie and TV adaptations.
              Ratings, streaming links, and book comparisons.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h4 className="font-semibold mb-3">Browse</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/adaptations" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Adaptations
                </Link>
              </li>
              <li>
                <Link href="/adaptations/top" className="text-muted-foreground hover:text-foreground transition-colors">
                  Top Rated
                </Link>
              </li>
              <li>
                <Link href="/books" className="text-muted-foreground hover:text-foreground transition-colors">
                  Books
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
                  Search
                </Link>
              </li>
            </ul>
          </div>

          {/* By Decade */}
          <div>
            <h4 className="font-semibold mb-3">By Decade</h4>
            <ul className="space-y-2 text-sm">
              {['2020s', '2010s', '2000s', '1990s', '1980s', '1970s'].map(decade => (
                <li key={decade}>
                  <Link
                    href={`/adaptations/by-decade/${decade}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {decade}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold mb-3">Info</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground">
                  Data: TMDB, OMDb, JustWatch
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  Affiliate disclosure
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>
            This site is not affiliated with Stephen King. All movie posters and
            book covers are used for informational purposes under Fair Use.
            Some links are affiliate links — we may earn a commission.
          </p>
        </div>
      </div>
    </footer>
  );
}
