import type { Metadata } from 'next';
import Link from 'next/link';
import { Film, BookOpen, ExternalLink, Database, Bot, Tv } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About — Stephen King Adaptations Database',
  description:
    'About the Stephen King Adaptations Database — data sources, methodology, affiliate disclosure, and contact information.',
};

const DATA_SOURCES = [
  {
    name: 'TMDB',
    url: 'https://www.themoviedb.org/',
    description:
      'Primary source for adaptation metadata, posters, cast, and crew. TMDB List #9638 curates Stephen King film and TV adaptations.',
  },
  {
    name: 'OMDb',
    url: 'https://www.omdbapi.com/',
    description:
      'Ratings aggregator providing IMDb, Rotten Tomatoes, and Metacritic scores for each adaptation.',
  },
  {
    name: 'Open Library',
    url: 'https://openlibrary.org/',
    description:
      'Book covers, ISBNs, publication details, and descriptions for Stephen King original works — all freely available via the Open Library API.',
  },
  {
    name: 'JustWatch',
    url: 'https://www.justwatch.com/',
    description:
      'Streaming availability data — where to watch each adaptation across Netflix, Amazon Prime, HBO Max, Hulu, and dozens of other platforms.',
  },
  {
    name: 'DeepSeek',
    url: 'https://www.deepseek.com/',
    description:
      'AI-powered Chinese language content generation: plot summaries, critical analysis, and book-vs-adaptation comparisons. Human-reviewed before publishing.',
  },
];

const TECH_STACK = [
  { name: 'Next.js 16', what: 'React framework with SSG — all 1,030+ pages pre-rendered at build time' },
  { name: 'Prisma + SQLite', what: 'Type-safe database ORM with zero-infra SQLite for MVP' },
  { name: 'Tailwind CSS 4', what: 'Utility-first CSS with dark mode via CSS custom properties' },
  { name: 'shadcn/ui', what: 'Accessible React components built on Radix primitives' },
  { name: 'FlexSearch', what: 'Client-side instant search — no server round-trips' },
  { name: 'plaiceholder', what: 'Blur placeholder images for zero Cumulative Layout Shift (CLS)' },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">About This Site</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          The Stephen King Adaptations Database answers one question:{' '}
          <strong>&ldquo;Which Stephen King adaptation should I watch, where is it streaming,
          how is it rated, and how does it compare to the book?&rdquo;</strong>
        </p>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          With over 88 film and TV adaptations spanning five decades, Stephen King is the most
          adapted living author. This site helps you navigate that catalog — whether you&rsquo;re
          looking for a classic like <em>The Shawshank Redemption</em>, exploring cult horror like{' '}
          <em>Creepshow</em>, or deciding which version of <em>Carrie</em> to watch tonight.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        <StatBox icon={<Film className="w-5 h-5" />} value="88" label="Adaptations" />
        <StatBox icon={<BookOpen className="w-5 h-5" />} value="85" label="Books & Stories" />
        <StatBox icon={<Tv className="w-5 h-5" />} value="16" label="Streaming Platforms" />
      </div>

      {/* Data Sources */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Data Sources
        </h2>
        <div className="space-y-4">
          {DATA_SOURCES.map(source => (
            <div key={source.name} className="flex gap-3 p-4 rounded-lg border bg-card">
              <div className="flex-1">
                <a
                  href={source.url}
                  target="_blank"
                  rel="nofollow noopener"
                  className="font-semibold hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {source.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-sm text-muted-foreground mt-1">{source.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Content */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          AI-Generated Content
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Chinese-language film reviews, overviews, and book-vs-adaptation comparisons are generated
          using the DeepSeek API and then{' '}
          <strong className="text-foreground">human-reviewed</strong> before publication.
          English translations of reviews and book differences are also AI-generated.
          We continuously refine and improve this content.
        </p>
      </section>

      {/* Tech Stack */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-5">Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH_STACK.map(tech => (
            <div key={tech.name} className="p-4 rounded-lg border bg-muted/30">
              <div className="font-semibold text-sm">{tech.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{tech.what}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <section className="mb-12 p-6 rounded-xl border-2 border-amber-500/30 bg-amber-500/5">
        <h2 className="text-xl font-bold mb-3">🛒 Affiliate Disclosure</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This site participates in the{' '}
          <strong className="text-foreground">Amazon Associates Program</strong>. As an Amazon
          Associate, we earn from qualifying purchases when you click through our book links and
          buy on Amazon. This does not affect the price you pay.
        </p>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Streaming links may also contain affiliate tracking through JustWatch or other partners.
          We never accept paid placements or sponsored listings — platform availability is shown
          objectively based on data from the JustWatch API.
        </p>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Affiliate earnings help cover API costs, hosting, and the time spent maintaining and
          improving this database.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-5">Contact</h2>
        <p className="text-muted-foreground leading-relaxed">
          Have a correction, suggestion, or found a bug? We&rsquo;d love to hear from you.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            📧 Email:{' '}
            <a href="mailto:hello@stephenkingadaptations.com" className="text-primary hover:underline">
              hello@stephenkingadaptations.com
            </a>
          </li>
          <li>
            🐙 GitHub:{' '}
            <a
              href="https://github.com/stephenkingdb/adaptations"
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              stephenkingdb/adaptations
              <ExternalLink className="w-3 h-3" />
            </a>
          </li>
        </ul>
      </section>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pb-8">
        This is a fan-made project and is not affiliated with Stephen King, his publishers, or any
        streaming platform. All poster images and book covers are the property of their respective
        owners. Stephen King book and adaptation data is sourced from public APIs.
      </p>
    </div>
  );
}

function StatBox({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center p-5 rounded-xl border bg-card">
      <div className="text-muted-foreground mb-1.5">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground text-center">{label}</div>
    </div>
  );
}
