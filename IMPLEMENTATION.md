# Stephen King 改编数据库 — 实施手册

> 基于 STS2 Wiki 经验，从零到上线的完整步骤

---

## 目录

1. [STS2 关键教训映射](#1-sts2-关键教训映射)
2. [Phase 0: 项目脚手架](#2-phase-0-项目脚手架)
3. [Phase 1: 数据管道](#3-phase-1-数据管道)
4. [Phase 2: 核心页面](#4-phase-2-核心页面)
5. [Phase 3: 部署与 SEO](#5-phase-3-部署与-seo)

---

## 1. STS2 关键教训映射

| STS2 遇到的事 | 严重程度 | King 项目对策 |
|-------------|---------|-------------|
| Turso/libsql adapter v7 + Prisma v6 不兼容 | 🔴 阻塞 | **直接用 SQLite，不引入 Turso**。200 页不需要分布式 DB |
| 70% 图片缺失 (403/578 cards) | 🔴 严重 | **TMDB 100% 覆盖**，每部电影都有海报。这是两个项目最本质的差异 |
| SSG 构建需 prebuild sync | 🟡 需绕行 | **用 SQLite 单文件 DB**，构建时 Prisma 直接读，无 sync 步骤 |
| 数据完全手动维护 | 🟡 不持续 | **全部自动化**：TMDB/OMDb/Wikipedia/JustWatch API 定时抓取 |
| 图片路径碎片化 (CDN+SVG+导出) | 🟡 混乱 | **单一来源**：TMDB → 本地 `/public/images/posters/` |
| 无 auth 编辑层 | 🟡 限制 | Git-based 内容管理，AI 生成后直接写入 repo，人工 PR review |
| 搜索体验 | 🔵 可改进 | **FlexSearch 客户端搜索**（STS2 已用，直接复用） |
| 结构化数据 | 🔵 可加强 | **Schema.org Movie/TVSeries**（Google Rich Snippets 对影视站点极为重要） |

### STS2 已验证的好模式（直接复用）

```
✅ Prisma + SQLite (build-time queries)
✅ Next.js SSG (全量静态生成)
✅ Tailwind CSS + shadcn/ui
✅ plaiceholder 模糊占位符
✅ Zod 数据验证管道
✅ Git-based 内容管理
✅ 动态 sitemap + robots.ts
✅ generateMetadata() per-page SEO
✅ prebuild → build → deploy 管线
```

---

## 2. Phase 0: 项目脚手架

### 2.1 创建项目

```bash
npx create-next-app@latest stephen-king-db \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm

cd stephen-king-db
```

### 2.2 package.json

```json
{
  "name": "stephen-king-adaptations",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "pipeline:all": "tsx scripts/run-all.ts",
    "pipeline:books": "tsx scripts/01-fetch-books.ts",
    "pipeline:adaptations": "tsx scripts/02-fetch-adaptations.ts",
    "pipeline:details": "tsx scripts/03-fetch-tmdb-details.ts",
    "pipeline:ratings": "tsx scripts/04-fetch-ratings.ts",
    "pipeline:posters": "tsx scripts/05-fetch-posters.ts",
    "pipeline:covers": "tsx scripts/06-fetch-book-covers.ts",
    "pipeline:streaming": "tsx scripts/07-fetch-streaming.ts",
    "pipeline:content": "tsx scripts/08-generate-content.ts",
    "pipeline:seed": "tsx scripts/09-normalize-and-seed.ts",
    "prebuild": "npm run db:generate",
    "postinstall": "npm run db:generate"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "cheerio": "^1.0.0",
    "clsx": "^2.1.0",
    "flexsearch": "^0.7.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "next": "^15.0.0",
    "next-themes": "^0.3.0",
    "plaiceholder": "^3.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.12.0",
    "sharp": "^0.33.0",
    "tailwind-merge": "^2.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "dotenv": "^16.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "postcss": "^8.4.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "prisma": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

### 2.3 Prisma Schema

见 `prisma/schema.prisma`（与技术方案中的完整 schema 一致）

关键差异点（从 STS2 学到的）：
- **不用 Turso/libsql**：provider = "sqlite"，本地 SQLite 单文件
- **所有 ID 用 cuid()**：与 STS2 一致
- **索引覆盖所有查询字段**：避免 SSG 时的 N+1
- **slug 使用小写字母+连字符**：SEO 友好，如 `the-shawshank-redemption-1994`
- **imageUrl/isLocal 模式**（STS2 教训）：用 `posterImage` 字段存本地路径

### 2.4 关键配置文件

**next.config.ts**
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // 所有图片都在本地，不需要 remotePatterns（STS2 教训！）
    formats: ['image/avif', 'image/webp'],
  },
  // 纯 SSG，不需要 ISR（200 页构建 < 2min）
  output: 'export', // 可选：完全静态导出
  // 或者保持默认的 SSG + Vercel 部署
};

export default nextConfig;
```

**src/lib/db.ts** — Prisma 单例（复用 STS2 模式）
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**src/lib/utils.ts**
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(score: number, maxScore: number): string {
  if (maxScore === 10) return `${score.toFixed(1)}/10`;
  if (maxScore === 100) return `${score}%`;
  return `${score}/${maxScore}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getDecade(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}
```

---

## 3. Phase 1: 数据管道

### 3.1 管道入口：run-all.ts

```typescript
// scripts/run-all.ts
// 按顺序执行全量数据管道
import { execSync } from 'node:child_process';

const STEPS = [
  { name: 'Fetch Books', script: '01-fetch-books.ts' },
  { name: 'Fetch Adaptations', script: '02-fetch-adaptations.ts' },
  { name: 'Fetch TMDB Details', script: '03-fetch-tmdb-details.ts' },
  { name: 'Fetch Ratings (OMDb)', script: '04-fetch-ratings.ts' },
  { name: 'Download Posters', script: '05-fetch-posters.ts' },
  { name: 'Download Book Covers', script: '06-fetch-book-covers.ts' },
  { name: 'Fetch Streaming Links', script: '07-fetch-streaming.ts' },
  { name: 'Generate AI Content', script: '08-generate-content.ts' },
  { name: 'Normalize and Seed DB', script: '09-normalize-and-seed.ts' },
];

async function main() {
  for (const step of STEPS) {
    console.log(`\n━━━ ${step.name} ━━━`);
    try {
      execSync(`npx tsx scripts/${step.script}`, {
        stdio: 'inherit',
        env: { ...process.env },
      });
    } catch (error) {
      console.error(`❌ Failed: ${step.name}`);
      process.exit(1);
    }
  }
  console.log('\n✅ All pipeline steps completed!');
}

main();
```

### 3.2 TMDB API 封装

```typescript
// scripts/lib/tmdb.ts
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

if (!process.env.TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY environment variable is required');
}

const API_KEY = process.env.TMDB_API_KEY;

const options = {
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
};

// TMDB List #9638: Stephen King Adaptations
const SK_LIST_ID = 9638;

export interface TMDBMovie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  tagline: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  budget: number;
  revenue: number;
  genres: Array<{ id: number; name: string }>;
  credits: {
    crew: Array<{ id: number; name: string; job: string; profile_path: string | null }>;
    cast: Array<{ id: number; name: string; character: string; profile_path: string | null; order: number }>;
  };
  // TV series specific
  name?: string;
  first_air_date?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
}

export async function fetchTMDB(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getSKList(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB(`/list/${SK_LIST_ID}`, {
    language: 'en-US',
  });
  return data.items || [];
}

export async function getMovieDetails(tmdbId: number, isTV = false): Promise<TMDBMovie> {
  const type = isTV ? 'tv' : 'movie';
  return fetchTMDB(`/${type}/${tmdbId}`, {
    language: 'en-US',
    append_to_response: 'credits,external_ids',
  });
}

export async function searchTMDB(query: string, isTV = false): Promise<TMDBMovie[]> {
  const type = isTV ? 'tv' : 'movie';
  const data = await fetchTMDB(`/search/${type}`, {
    query,
    language: 'en-US',
  });
  return data.results || [];
}

export function getPosterUrl(path: string | null, size: 'w342' | 'w500' | 'w780' = 'w500'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getProfileUrl(path: string | null, size: 'w185' | 'h632' = 'w185'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
```

### 3.3 主要数据管道脚本

```typescript
// scripts/02-fetch-adaptations.ts
// 从 TMDB List #9638 抓取所有 Stephen King 改编作品
import { writeFileSync } from 'node:fs';
import { getSKList, getMovieDetails } from './lib/tmdb';
import { z } from 'zod';

const AdaptationSchema = z.object({
  tmdbId: z.number(),
  title: z.string(),
  overview: z.string().nullable(),
  posterPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  runtime: z.number().nullable(),
  voteAverage: z.number(),
  voteCount: z.number(),
  mediaType: z.enum(['movie', 'tv']),
});

async function main() {
  console.log('📡 Fetching Stephen King adaptations from TMDB List #9638...');
  
  const items = await getSKList();
  console.log(`Found ${items.length} items in the list`);
  
  const adaptations: z.infer<typeof AdaptationSchema>[] = [];
  
  for (const item of items) {
    const isTV = item.media_type === 'tv';
    const details = await getMovieDetails(item.id, isTV);
    
    const adaptation = AdaptationSchema.parse({
      tmdbId: details.id,
      title: details.title || details.name || '',
      overview: details.overview || null,
      posterPath: details.poster_path,
      releaseDate: details.release_date || details.first_air_date || null,
      runtime: details.runtime || details.episode_run_time?.[0] || null,
      voteAverage: details.vote_average,
      voteCount: details.vote_count,
      mediaType: isTV ? 'tv' : 'movie',
    });
    
    adaptations.push(adaptation);
    console.log(`  ✅ ${adaptation.title}`);
    
    // Rate limit: TMDB allows 50 req/s, but be polite
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Save intermediate result
  writeFileSync(
    'data/adaptations-raw.json',
    JSON.stringify(adaptations, null, 2),
    'utf-8'
  );
  
  console.log(`\n✅ Saved ${adaptations.length} adaptations to data/adaptations-raw.json`);
}

main();
```

```typescript
// scripts/04-fetch-ratings.ts
// 从 OMDb API 获取评分（IMDb, Rotten Tomatoes, Metacritic）
import { readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';

const OMDb_API_KEY = process.env.OMDB_API_KEY || '';
const OMDb_BASE = 'https://www.omdbapi.com';

interface OMDbResponse {
  imdbID: string;
  Title: string;
  imdbRating: string;
  imdbVotes: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Response: 'True' | 'False';
  Error?: string;
}

async function fetchOMDb(imdbId: string): Promise<OMDbResponse> {
  const url = `${OMDb_BASE}/?i=${imdbId}&apikey=${OMDb_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data as OMDbResponse;
}

function parseRating(value: string): number | null {
  // "9.3/10" → 9.3
  // "93%" → 93
  // "88/100" → 88
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

// ---

// scripts/05-fetch-posters.ts
// 从 TMDB 下载海报到本地
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getPlaiceholder } from 'plaiceholder';

const POSTER_DIR = path.join(process.cwd(), 'public/images/posters');
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w780';

async function downloadPoster(tmdbPosterPath: string, slug: string) {
  const url = `${TMDB_IMAGE}${tmdbPosterPath}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${url}`);
  
  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = path.extname(tmdbPosterPath) || '.jpg';
  const filename = `${slug}${ext}`;
  
  // Save poster
  await mkdir(POSTER_DIR, { recursive: true });
  await writeFile(path.join(POSTER_DIR, filename), buffer);
  
  // Generate blur placeholder (STS2 lesson: eliminate CLS)
  const { base64 } = await getPlaiceholder(buffer);
  
  return {
    localPath: `/images/posters/${filename}`,
    blurDataURL: base64,
  };
}

// ---

// scripts/08-generate-content.ts
// 使用 Claude API 批量生成中文内容
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONTENT_PROMPT = (title: string, year: number, overview: string, bookTitle: string) => `
你是一个 Stephen King 改编作品的影评专家。请为以下改编作品生成中文内容。

改编作品：${title} (${year})
原著：${bookTitle}（Stephen King）
英文简介：${overview}

请生成以下内容，用 Markdown 格式，语言为中文：

## 剧情简介
（200-300 字，不剧透关键转折）

## 评价分析
（200-300 字，分析导演手法、演员表现、与同期恐怖/惊悚片的比较）

## 与原著的主要差异
列出 3-5 个关键差异点：
- **结局**：
- **角色**：
- **删减内容**：
- **基调**：

## 获奖与提名
（如有著名奖项）

请确保内容客观、准确，不要编造不确定的事实。
`;

async function generateContent(adaptation: any, bookTitle: string) {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-5-20251001', // 使用最新 Sonnet，性价比最优
    max_tokens: 1500,
    system: '你是 Stephen King 作品专家，输出中文 Markdown，内容客观准确。',
    messages: [{
      role: 'user',
      content: CONTENT_PROMPT(
        adaptation.title,
        adaptation.releaseYear,
        adaptation.overview || '',
        bookTitle
      ),
    }],
  });
  
  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}
```

---

## 4. Phase 2: 核心页面

### 4.1 页面组件树

```
src/
├── app/
│   ├── layout.tsx           # 全局布局（nav + footer + theme provider）
│   ├── page.tsx             # 首页（统计 + 搜索 + 精选）
│   ├── globals.css          # Tailwind v4 + 暗色主题
│   ├── sitemap.ts           # 动态 sitemap
│   ├── robots.ts            # robots.txt
│   │
│   ├── adaptations/
│   │   ├── page.tsx         # 列表页（筛选 + 排序）
│   │   ├── top/
│   │   │   └── page.tsx     # Top 50 排名
│   │   ├── by-decade/[decade]/
│   │   │   └── page.tsx     # 按年代浏览
│   │   └── [slug]/
│   │       └── page.tsx     # ⭐ 改编详情页
│   │
│   ├── books/
│   │   ├── page.tsx         # 原著列表
│   │   └── [slug]/
│   │       └── page.tsx     # 原著详情页
│   │
│   ├── people/
│   │   └── [slug]/
│   │       └── page.tsx     # 导演/演员页
│   │
│   └── search/
│       └── page.tsx         # 搜索页
│
├── components/
│   ├── ui/                  # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── adaptation/
│   │   ├── adaptation-card.tsx    # 卡片组件
│   │   ├── adaptation-grid.tsx    # 卡片网格
│   │   ├── rating-badge.tsx       # 评分标签
│   │   └── where-to-watch.tsx     # 流媒体区域
│   ├── book/
│   │   └── book-card.tsx
│   ├── search/
│   │   └── search-bar.tsx
│   └── layout/
│       ├── header.tsx
│       └── footer.tsx
│
├── lib/
│   ├── db.ts               # Prisma 单例
│   ├── utils.ts            # cn(), formatRating(), slugify()
│   ├── adaptations.ts      # 改编查询函数
│   ├── books.ts            # 原著查询函数
│   ├── people.ts           # 人物查询函数
│   ├── seo.ts              # Metadata 构造
│   ├── affiliate.ts        # Affiliate link 生成
│   └── constants.ts        # 站点配置
```

### 4.2 改编详情页（核心页面）

```tsx
// src/app/adaptations/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getAdaptationBySlug, getAllAdaptationSlugs } from '@/lib/adaptations';
import { AdaptationTabs } from '@/components/adaptation/adaptation-tabs';
import { RatingBadge } from '@/components/adaptation/rating-badge';
import { WhereToWatch } from '@/components/adaptation/where-to-watch';
import { SimilarAdaptations } from '@/components/adaptation/similar-adaptations';
import { generateAdaptationMetadata } from '@/lib/seo';

// SSG: 构建时生成所有页面
export async function generateStaticParams() {
  const slugs = await getAllAdaptationSlugs();
  return slugs.map(slug => ({ slug }));
}

export const dynamicParams = false; // 未预渲染的 404

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const adaptation = await getAdaptationBySlug(slug);
  if (!adaptation) return {};
  return generateAdaptationMetadata(adaptation);
}

export default async function AdaptationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adaptation = await prisma.adaptation.findUnique({
    where: { slug },
    include: {
      book: true,
      director: true,
      cast: {
        include: { person: true },
        orderBy: { order: 'asc' },
      },
      ratings: true,
      streamingLinks: {
        orderBy: { linkType: 'asc' },
      },
      differences: true,
    },
  });

  if (!adaptation) notFound();

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-foreground">Home</a>
        {' › '}
        <a href="/adaptations" className="hover:text-foreground">Adaptations</a>
        {' › '}
        <span className="text-foreground">{adaptation.title}</span>
      </nav>

      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Poster */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
          {adaptation.posterImage ? (
            <Image
              src={adaptation.posterImage}
              alt={`${adaptation.title} poster`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
              // STS2 教训：所有海报都有 blur placeholder
              placeholder="blur"
              blurDataURL={adaptation.posterBlurDataURL || undefined}
              priority
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No Poster</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              {adaptation.title}
              <span className="text-muted-foreground ml-2">
                ({adaptation.releaseYear})
              </span>
            </h1>
            {adaptation.titleCn && (
              <p className="text-xl text-muted-foreground mt-1">
                {adaptation.titleCn}
              </p>
            )}
          </div>

          {/* Ratings Row */}
          <div className="flex flex-wrap gap-3">
            {adaptation.ratings.map(rating => (
              <RatingBadge
                key={rating.source}
                source={rating.source}
                score={rating.score}
                maxScore={rating.maxScore}
              />
            ))}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {adaptation.runtime && (
              <span>⏱ {adaptation.runtime} min</span>
            )}
            {adaptation.mpaaRating && (
              <span>🏷 {adaptation.mpaaRating}</span>
            )}
            <span>🎬 {adaptation.type.replace(/_/g, ' ')}</span>
          </div>

          {/* Based on Book */}
          {adaptation.book && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Based on Stephen King's</p>
              <a
                href={`/books/${adaptation.book.slug}`}
                className="text-lg font-semibold hover:underline"
              >
                {adaptation.book.title}
              </a>
              {adaptation.book.publicationYear && (
                <span className="text-muted-foreground">
                  {' '}({adaptation.book.publicationYear})
                </span>
              )}
            </div>
          )}

          {/* Director */}
          {adaptation.director && (
            <p>
              <span className="font-semibold">Director: </span>
              <a
                href={`/people/${adaptation.director.slug}`}
                className="hover:underline"
              >
                {adaptation.director.name}
              </a>
            </p>
          )}

          {/* Top Cast */}
          {adaptation.cast.length > 0 && (
            <div>
              <p className="font-semibold mb-1">Cast:</p>
              <p className="text-sm text-muted-foreground">
                {adaptation.cast
                  .slice(0, 6)
                  .map(c => (
                    <a
                      key={c.personId}
                      href={`/people/${c.person.slug}`}
                      className="hover:underline mr-2"
                    >
                      {c.person.name}
                    </a>
                  ))
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Where to Watch — 变现核心 */}
      {adaptation.streamingLinks.length > 0 && (
        <WhereToWatch
          links={adaptation.streamingLinks}
          lastVerified={adaptation.streamingLinks[0].lastVerified}
        />
      )}

      {/* Amazon Book Affiliate */}
      {adaptation.book?.amazonUrl && (
        <div className="my-6 p-4 border rounded-lg bg-muted/30">
          <p className="text-sm">
            📖 <strong>Read the original book:</strong>{' '}
            <a
              href={adaptation.book.amazonUrl}
              target="_blank"
              rel="nofollow sponsored"
              className="text-primary hover:underline"
            >
              {adaptation.book.title} on Amazon
            </a>
          </p>
        </div>
      )}

      {/* Tabs: Overview | Cast | vs Book | Trivia */}
      <AdaptationTabs
        review={adaptation.review}
        overview={adaptation.overviewCn || adaptation.overview}
        cast={adaptation.cast}
        differences={adaptation.differences}
        trivia={adaptation.trivia}
      />

      {/* Similar Adaptations */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-6">
          More Stephen King Adaptations
        </h2>
        <SimilarAdaptations
          currentId={adaptation.id}
          bookId={adaptation.bookId}
          releaseYear={adaptation.releaseYear}
        />
      </section>
    </main>
  );
}
```

### 4.3 列表页（筛选 + 排序）

```tsx
// src/app/adaptations/page.tsx
import { prisma } from '@/lib/db';
import { AdaptationGrid } from '@/components/adaptation/adaptation-grid';
import { AdaptationFilters } from '@/components/adaptation/adaptation-filters';
import type { AdaptationType, StreamingPlatform } from '@prisma/client';

// 关键筛选组合也预渲染：
// /adaptations?type=movie
// /adaptations?type=tv_series
// /adaptations?minRating=7
// /adaptations?platform=netflix
export default async function AdaptationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  const where: any = {};

  if (params.type) where.type = params.type as AdaptationType;
  if (params.minRating) where.rating = { gte: parseFloat(params.minRating) };
  if (params.decade) {
    const decadeStart = parseInt(params.decade);
    where.releaseYear = { gte: decadeStart, lt: decadeStart + 10 };
  }
  if (params.platform) {
    where.streamingLinks = {
      some: {
        platform: params.platform as StreamingPlatform,
      },
    };
  }

  const orderBy: any = {};
  switch (params.sort) {
    case 'rating':
      orderBy.rating = 'desc';
      break;
    case 'year':
      orderBy.releaseYear = 'desc';
      break;
    case 'title':
      orderBy.title = 'asc';
      break;
    default:
      orderBy.rating = 'desc'; // 默认按评分排序
  }

  const adaptations = await prisma.adaptation.findMany({
    where,
    orderBy,
    include: {
      ratings: true,
      streamingLinks: { select: { platform: true } },
      book: { select: { title: true, slug: true } },
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">
        Stephen King Adaptations
      </h1>
      <p className="text-muted-foreground mb-8">
        {adaptations.length} movies, TV series, and miniseries
      </p>

      <AdaptationFilters currentParams={params} totalCount={adaptations.length} />

      <AdaptationGrid adaptations={adaptations} />
    </main>
  );
}
```

### 4.4 客户端搜索（FlexSearch — 复用 STS2 方案）

```tsx
// src/components/search/search-bar.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import FlexSearch from 'flexsearch';
import { useRouter } from 'next/navigation';

interface SearchItem {
  slug: string;
  title: string;
  titleCn: string | null;
  year: number | null;
  type: string;
  overview: string | null;
}

export function SearchBar({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const indexRef = useRef<FlexSearch.Index | null>(null);

  useEffect(() => {
    // Build FlexSearch index once
    const index = new FlexSearch.Index({
      tokenize: 'forward',
      preset: 'performance',
    });

    items.forEach(item => {
      const searchText = [
        item.title,
        item.titleCn,
        item.overview,
      ].filter(Boolean).join(' ');
      index.add(item.slug, searchText);
    });

    indexRef.current = index;
  }, [items]);

  const handleSearch = (q: string) => {
    setQuery(q);
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
    setIsOpen(true);
  };

  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        value={query}
        onChange={e => handleSearch(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && query.length >= 2) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
          }
        }}
        placeholder="Search adaptations, books, directors..."
        className="w-full px-4 py-3 rounded-xl border bg-background text-foreground
                   focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-xl shadow-lg z-50">
          {results.map(item => (
            <a
              key={item.slug}
              href={`/adaptations/${item.slug}`}
              className="block px-4 py-3 hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span className="font-medium">{item.title}</span>
              {item.year && (
                <span className="text-muted-foreground ml-2">({item.year})</span>
              )}
              <span className="text-xs text-muted-foreground ml-2">
                {item.type.replace(/_/g, ' ')}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4.5 SEO Metadata 构造

```typescript
// src/lib/seo.ts
import type { Metadata } from 'next';
import type { Adaptation, Book, Person, Rating } from '@prisma/client';

const SITE_NAME = 'Stephen King Adaptations Database';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stephenkingadaptations.com';
const DEFAULT_DESCRIPTION = 'Every Stephen King movie and TV adaptation — ratings, streaming availability, and book comparisons.';

export function generateAdaptationMetadata(
  adaptation: Adaptation & {
    book: Book | null;
    director: Person | null;
    ratings: Rating[];
  }
): Metadata {
  const imdbRating = adaptation.ratings.find(r => r.source === 'IMDB');
  const title = adaptation.titleCn
    ? `${adaptation.title} (${adaptation.titleCn}) — ${adaptation.releaseYear} Stephen King Adaptation`
    : `${adaptation.title} (${adaptation.releaseYear}) — Stephen King Adaptation`;

  const description = [
    adaptation.overviewCn || adaptation.overview,
    imdbRating ? `IMDb: ${imdbRating.score}/10.` : '',
    adaptation.book ? `Based on Stephen King's "${adaptation.book.title}".` : '',
    'Find where to stream it.',
  ].filter(Boolean).join(' ').slice(0, 160);

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
      images: adaptation.posterImage
        ? [{ url: `${SITE_URL}${adaptation.posterImage}`, width: 500, height: 750 }]
        : [],
      type: adaptation.type === 'TV_SERIES' ? 'video.tv_show' : 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: adaptation.posterImage ? [`${SITE_URL}${adaptation.posterImage}`] : [],
    },
    other: {
      // Schema.org JSON-LD for Google Rich Snippets
      'application-ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': adaptation.type === 'TV_SERIES' ? 'TVSeries' : 'Movie',
        name: adaptation.title,
        dateCreated: adaptation.releaseYear?.toString(),
        director: adaptation.director
          ? { '@type': 'Person', name: adaptation.director.name }
          : undefined,
        aggregateRating: imdbRating
          ? {
              '@type': 'AggregateRating',
              ratingValue: imdbRating.score.toString(),
              bestRating: imdbRating.maxScore.toString(),
              ratingCount: imdbRating.voteCount || undefined,
            }
          : undefined,
        isBasedOn: adaptation.book
          ? {
              '@type': 'Book',
              name: adaptation.book.title,
              author: { '@type': 'Person', name: 'Stephen King' },
            }
          : undefined,
      }),
    },
  };
}

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
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  };
}
```

---

## 5. Phase 3: 部署与 SEO

### 5.1 环境变量 (`.env.example`)

```bash
# Database
DATABASE_URL="file:./dev.db"

# APIs
TMDB_API_KEY=tmdb_key_here
OMDB_API_KEY=omdb_key_here
ANTHROPIC_API_KEY=sk-ant-...

# JustWatch (MVP 阶段可能不需要)
JUSTWATCH_PARTNER_TOKEN=

# Site
NEXT_PUBLIC_SITE_URL=https://stephenkingadaptations.com

# Affiliate
AMAZON_AFFILIATE_TAG=stephenkingdb-20
```

### 5.2 Vercel 部署

```bash
# 部署到 Vercel
vercel --prod

# 环境变量在 Vercel dashboard 设置
# Build command: npm run build
# Output directory: .next
# Install command: npm install
```

### 5.3 Sitemap

```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL!;

  const [adaptations, books, people] = await Promise.all([
    prisma.adaptation.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.book.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.person.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  return [
    { url: BASE, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE}/adaptations`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE}/adaptations/top`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/books`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/search`, lastModified: new Date(), priority: 0.5 },
    ...adaptations.map(a => ({
      url: `${BASE}/adaptations/${a.slug}`,
      lastModified: a.updatedAt,
      priority: 0.8,
    })),
    ...books.map(b => ({
      url: `${BASE}/books/${b.slug}`,
      lastModified: b.updatedAt,
      priority: 0.7,
    })),
    ...people.map(p => ({
      url: `${BASE}/people/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.6,
    })),
  ];
}
```

### 5.4 GitHub Actions 自动更新（流媒体数据）

```yaml
# .github/workflows/update-streaming.yml
name: Update Streaming Availability

on:
  schedule:
    - cron: '17 3 * * *'  # Daily at 3:17 AM UTC
  workflow_dispatch:       # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Fetch streaming data
        run: npm run pipeline:streaming
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          TMDB_API_KEY: ${{ secrets.TMDB_API_KEY }}
          JUSTWATCH_PARTNER_TOKEN: ${{ secrets.JUSTWATCH_PARTNER_TOKEN }}

      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/ prisma/dev.db
          git diff --staged --quiet || (
            git commit -m "chore: update streaming availability [skip ci]" &&
            git push
          )

      - name: Trigger Vercel deploy
        run: |
          curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK }}"
```

---

## 6. 关键差异总结：STS2 vs King 项目

| 维度 | STS2 | King | 哪边更好 |
|------|------|------|---------|
| **图片来源** | CDN + SVG生成 + 游戏导出 | TMDB API 单一来源 | ✅ King |
| **图片覆盖率** | 30% | 100% | ✅ King |
| **数据库** | Turso + 本地 sync | 纯 SQLite | ✅ King (简化) |
| **数据采集** | 完全手动 JSON | 全自动 API 管道 | ✅ King |
| **页面数量** | ~600+ | ~200 | ✅ King (构建更快) |
| **变现** | 无 | Affiliate 三层 | ✅ King |
| **交互复杂度** | Deck Builder + Tier List | 筛选 + 搜索 | ⚖️ 不同 |
| **SEO 结构化数据** | VideoGame | Movie/TVSeries | ⚖️ 都重要 |
| **AI 内容** | 无 | Claude 批量生成 | ✅ King |
| **部署** | Vercel | Vercel | ⚖️ 相同 |
| **构建时间** | 较长 | < 2 min | ✅ King |

---

> **文档版本**: v1.0 — 2026-07-14
> **下一步**: 执行 `Phase 0` 创建项目脚手架
