# Stephen King 改编作品数据库 — 完整技术方案 + MVP 设计

> 基于 STS2 Wiki 项目技术栈和经验教训，2026-07-14

---

## 目录

1. [项目定位与数据规模](#1-项目定位与数据规模)
2. [数据模型设计](#2-数据模型设计)
3. [技术栈选型](#3-技术栈选型)
4. [数据管道设计](#4-数据管道设计)
5. [图片方案：彻底解决 STS2 痛点](#5-图片方案)
6. [MVP 页面架构](#6-mvp-页面架构)
7. [SEO 策略](#7-seo-策略)
8. [变现集成](#8-变现集成)
9. [STS2 教训清单](#9-sts2-教训清单)
10. [实施路线图](#10-实施路线图)

---

## 1. 项目定位与数据规模

### 核心命题
> "我想看 Stephen King 改编的影视作品，现在哪个平台有？评分怎么样？哪些值得看？"

### 数据规模估算

| 实体 | 数量 | 说明 |
|------|------|------|
| 原著作品（Book/Story） | ~85 | 含长篇小说、中篇、短篇被改编者 |
| 改编作品（Adaptation） | ~110 | 电影 + 剧集 + 迷你剧 + 流媒体原创 |
| 导演/演员（Person） | ~500 | 核心导演 + 主演 |
| 流媒体平台 | ~25 | Netflix, Prime, HBO, Hulu, etc. |
| 静态页面 | ~200 | SSG 每部改编作品一页 + 原著页 + 列表页 |
| 图片（海报+封面） | ~200 | 每部改编 1 张海报 + 原著封面 |

### 内容页面现状：
- 每部改编作品：~110 页
- 每部原著：~85 页
- 导演/演员聚合页：~30 页
- 列表/筛选/排名页：~10 页
- 总计 SSG 页面：~235 页
- **构建时间预估：< 2 分钟**（Next.js SSG，远低于 STS2 的规模）

---

## 2. 数据模型设计

### 2.1 Prisma Schema

```prisma
// ============================================================
// 核心实体
// ============================================================

model Book {
  id              String        @id @default(cuid())
  slug            String        @unique
  title           String
  titleCn         String?       // 中文译名
  publicationYear Int?
  type            BookType      // NOVEL, COLLECTION, SHORT_STORY, NOVELLA
  description     String?       @db.Text
  descriptionCn   String?       @db.Text
  coverImage      String?       // 本地路径: /images/books/{slug}.jpg
  goodreadsUrl    String?
  amazonUrl       String?       // Amazon 图书 affiliate 链接

  adaptations     Adaptation[]
  collections     CollectionMember[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([publicationYear])
}

model Adaptation {
  id              String        @id @default(cuid())
  slug            String        @unique
  title           String
  titleCn         String?       // 中文译名
  type            AdaptationType // MOVIE, TV_SERIES, MINISERIES, TV_MOVIE, STREAMING_ORIGINAL
  releaseYear     Int?
  releaseDate     DateTime?     // 精确日期
  runtime         Int?          // 片长（分钟）
  tagline         String?
  overview        String?       @db.Text   // 剧情简介（英文）
  overviewCn      String?       @db.Text   // 剧情简介（中文）
  posterImage     String?       // 本地路径: /images/posters/{slug}.jpg
  tmdbId          Int?          @unique
  rating          Float?        // 综合评分（IMDb 加权）
  ratingCount     Int?
  budget          Int?
  revenue         Int?
  mpaaRating      String?       // PG, PG-13, R, etc.

  // 关系
  book            Book?         @relation(fields: [bookId], references: [id])
  bookId          String?
  director        Person?       @relation("DirectedAdaptations", fields: [directorId], references: [id])
  directorId      String?
  cast            CastMember[]

  // 评分详情
  ratings         Rating[]
  // 流媒体可用性
  streamingLinks  StreamingLink[]
  // 与原著差异
  differences     BookDifference[]

  // 富文本内容（AI 生成 + 人工编辑）
  review          String?       @db.Text   // Markdown 格式的影评/分析
  trivia          String?       @db.Text   // 幕后花絮

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([releaseYear])
  @@index([type])
  @@index([rating])
  @@index([bookId])
  @@index([directorId])
}

model Person {
  id              String        @id @default(cuid())
  slug            String        @unique
  name            String
  nameCn          String?
  photoImage      String?       // /images/people/{slug}.jpg
  tmdbId          Int?          @unique
  role            PersonRole    // DIRECTOR, ACTOR, BOTH

  directedWorks   Adaptation[]  @relation("DirectedAdaptations")
  castInWorks     CastMember[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model CastMember {
  id              String        @id @default(cuid())
  adaptation      Adaptation    @relation(fields: [adaptationId], references: [id])
  adaptationId    String
  person          Person        @relation(fields: [personId], references: [id])
  personId        String
  characterName   String?
  order           Int?          // 演员表排序

  @@unique([adaptationId, personId])
  @@index([adaptationId])
  @@index([personId])
}

// ============================================================
// 评分
// ============================================================

model Rating {
  id              String        @id @default(cuid())
  adaptation      Adaptation    @relation(fields: [adaptationId], references: [id])
  adaptationId    String
  source          RatingSource  // IMDB, ROTTEN_TOMATOES, METACRITIC, DOUBAN, LETTERBOXD
  score           Float
  maxScore        Float         // IMDb=10, RT=100, Metacritic=100, 豆瓣=10, Letterboxd=5
  voteCount       Int?

  @@unique([adaptationId, source])
  @@index([adaptationId])
}

// ============================================================
// 流媒体
// ============================================================

model StreamingLink {
  id              String        @id @default(cuid())
  adaptation      Adaptation    @relation(fields: [adaptationId], references: [id])
  adaptationId    String
  platform        StreamingPlatform // NETFLIX, AMAZON_PRIME, HBO_MAX, HULU, DISNEY_PLUS, etc.
  country         String        @default("US") // ISO country code
  linkType        LinkType      // STREAMING, RENT, BUY, FREE_WITH_ADS
  url             String        // 带 affiliate tag 的跳转链接
  price           String?       // "$3.99"
  quality         String?       // SD, HD, 4K
  lastVerified    DateTime      @default(now())

  @@unique([adaptationId, platform, country, linkType])
  @@index([adaptationId])
  @@index([platform])
}

// ============================================================
// 原著-改编差异
// ============================================================

model BookDifference {
  id              String        @id @default(cuid())
  adaptation      Adaptation    @relation(fields: [adaptationId], references: [id])
  adaptationId    String
  category        DiffCategory  // ENDING, CHARACTER, PLOT, TONE, CUT_CONTENT
  description     String        @db.Text

  @@index([adaptationId])
}

// ============================================================
// 合集/系列
// ============================================================

model Collection {
  id              String        @id @default(cuid())
  slug            String        @unique
  name            String
  description     String?
  members         CollectionMember[]

  createdAt       DateTime      @default(now())
}

model CollectionMember {
  id              String        @id @default(cuid())
  collection      Collection    @relation(fields: [collectionId], references: [id])
  collectionId    String
  book            Book          @relation(fields: [bookId], references: [id])
  bookId          String
  order           Int

  @@unique([collectionId, bookId])
}

// ============================================================
// 枚举
// ============================================================

enum BookType {
  NOVEL
  COLLECTION
  SHORT_STORY
  NOVELLA
}

enum AdaptationType {
  MOVIE
  TV_SERIES
  MINISERIES
  TV_MOVIE
  STREAMING_ORIGINAL
}

enum PersonRole {
  DIRECTOR
  ACTOR
  BOTH
}

enum RatingSource {
  IMDB
  ROTTEN_TOMATOES
  METACRITIC
  DOUBAN
  LETTERBOXD
}

enum StreamingPlatform {
  NETFLIX
  AMAZON_PRIME
  HBO_MAX
  HULU
  DISNEY_PLUS
  APPLE_TV_PLUS
  PARAMOUNT_PLUS
  PEACOCK
  TUBI
  PLUTO_TV
  SHUDDER
  AMC_PLUS
  MGM_PLUS
  STARZ
  SHOWTIME
  CRACKLE
  FREEVEE
  YOUTUBE
  GOOGLE_PLAY
  ITUNES
  VUDU
  OTHER
}

enum LinkType {
  SUBSCRIPTION  // 订阅制
  RENT          // 租赁
  BUY           // 购买
  FREE_WITH_ADS // 免费带广告
}

enum DiffCategory {
  ENDING
  CHARACTER
  PLOT
  TONE
  CUT_CONTENT
}
```

### 2.2 数据库选型

**PostgreSQL**（与 STS2 一致）：
- 全文搜索（内置 tsvector，无需 ElasticSearch）
- 数组字段（`tags TEXT[]`）
- JSONB 用于灵活扩展
- Prisma 原生支持

对于 MVP，也可以用 **SQLite**（零配置，单文件部署），后续迁移到 PostgreSQL 只需改 `datasource`。

---

## 3. 技术栈选型

### 3.1 完整技术栈

| 层 | 技术 | 与 STS2 对比 |
|---|------|-------------|
| **框架** | Next.js 15 (App Router) | ✅ 同 STS2 |
| **语言** | TypeScript (strict) | ✅ 同 STS2 |
| **ORM** | Prisma 5.x | ✅ 同 STS2 |
| **数据库** | PostgreSQL 16 (MVP 可用 SQLite) | ✅ 同 STS2 |
| **样式** | Tailwind CSS 4.x | ✅ 同 STS2 |
| **组件** | shadcn/ui (Radix 无样式组件) | ✅ 同 STS2（STS2 用的是 Radix，这里统一到 shadcn） |
| **渲染** | Next.js SSG (`generateStaticParams`) | ✅ 同 STS2 |
| **搜索** | 客户端：FlexSearch | ✅ 同 STS2 |
| **动画** | Framer Motion（有限使用） | ⚠️ STS2 没用，King 项目只在列表页用微动效 |
| **图片** | `next/image` + sharp + `plaiceholder` | ✅ 同 STS2 |
| **Markdown** | `next-mdx-remote`（AI 生成内容用 MDX）| ⚠️ 新增 |
| **抓取** | Node.js 脚本 + `cheerio` + `zod` 验证 | ✅ 类似 STS2 |
| **部署** | Vercel (MVP) / Cloudflare Pages (正式) | ✅ 同 STS2 |
| **分析** | Plausible (隐私友好) | 🆕 新增 |
| **CMS** | 无需 CMS，Git-based 内容 | — |

### 3.2 为什么不用 CMS？

STS2 的经验是：一个有清晰结构、数据量 < 500 页的站点，Git-based 内容管理比 CMS 更高效：
- **数据变更可追溯**（git log 就是变更记录）
- **CI/CD 构建即发布**
- **零 CMS 费用**
- **AI 生成的 markdown 内容直接写入 repo**

只有当非技术人员需要频繁编辑内容时，才考虑引入 Strapi/Contentful。

### 3.3 关键依赖

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-mdx-remote": "^5.0.0",
    "prisma": "^5.20.0",
    "@prisma/client": "^5.20.0",
    "tailwindcss": "^4.0.0",
    "sharp": "^0.33.0",
    "plaiceholder": "^3.0.0",
    "flexsearch": "^0.7.0",
    "framer-motion": "^11.0.0",
    "zod": "^3.23.0",
    "cheerio": "^1.0.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0",
    "tsx": "^4.19.0"
  }
}
```

---

## 4. 数据管道设计

### 4.1 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        数据管道（离线批处理）                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐ │
│  │ Wikipedia │   │  TMDB    │   │  OMDb    │   │  JustWatch   │ │
│  │  scape    │   │  API     │   │  API     │   │  (manual)    │ │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └──────┬───────┘ │
│       │               │              │                 │         │
│       └───────────────┴──────────────┴─────────────────┘         │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │   Zod 验证   │  ← 类型安全门禁               │
│                    └──────┬──────┘                               │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │  归一化/去重  │                              │
│                    └──────┬──────┘                               │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │  Prisma     │                               │
│                    │  写入 DB    │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │  下载图片    │  ← TMDB 海报 → 本地           │
│                    │  到本地     │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │  生成 Markdown│ ← AI 内容：影评、差异分析     │
│                    │  (AI 辅助)  │                               │
│                    └─────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 数据来源与优先级

| 字段 | 主数据源 | 备用源 | 策略 |
|------|---------|--------|------|
| 原著列表 | Wikipedia 抓取 | stephenking.com | 一次性抓取 + 手动校验 |
| 改编列表 | Wikipedia "List of works based on Stephen King" | TMDB list #9638 | 抓取 + TMDB 交叉验证 |
| 电影元数据 | TMDB API v3 | OMDb API | TMDB 为主，OMDb 补评分 |
| 评分 | OMDb API (IMDb + RT + Metacritic) | 手工从 RT/IMDb 页面抓取 | OMDb 先，不完整的补抓 |
| 海报 | TMDB API → `image.tmdb.org` | 手动上传 | 构建时下载到 `/public/images/posters/` |
| 书籍封面 | Open Library Covers API | Google Books API | 免费、稳定 |
| 流媒体可用性 | JustWatch Content Partner API | 公开 GraphQL 抓取 | 官方 API 优先 |
| 流媒体链接 | JustWatch affiliate deeplinks | 手动构造 | JustWatch 直接提供 affiliate URL |
| AI 内容（影评/差异）| Claude API 生成 | — | 每部作品生成 ~500 字中文分析 |

### 4.3 数据管道脚本结构

```
scripts/
├── 01-fetch-books.ts          # 从 Wikipedia 抓取原著列表
├── 02-fetch-adaptations.ts    # 从 TMDB + Wikipedia 抓取改编列表
├── 03-fetch-tmdb-details.ts   # TMDB API 批量获取电影/剧集详情
├── 04-fetch-ratings.ts        # OMDb API 批量获取评分
├── 05-fetch-posters.ts        # 从 TMDB 下载海报图片到本地
├── 06-fetch-book-covers.ts    # 从 Open Library 下载书封
├── 07-fetch-streaming.ts      # JustWatch API 获取流媒体可用性
├── 08-generate-content.ts     # Claude API 生成中文内容（影评、差异）
├── 09-normalize.ts            # 数据清洗、去重、关联
├── 10-seed.ts                 # 最终写入 Prisma/DB
├── lib/
│   ├── tmdb.ts                # TMDB API 封装
│   ├── omdb.ts                # OMDb API 封装
│   ├── wikipedia.ts           # Wikipedia 页面解析
│   ├── justwatch.ts           # JustWatch API 封装
│   ├── openlibrary.ts         # Open Library API 封装
│   ├── claude.ts              # Claude API 封装（内容生成）
│   └── validators.ts          # Zod schemas
└── README.md                  # 数据管道使用说明
```

### 4.4 数据更新策略

| 频率 | 更新内容 | 方式 |
|------|---------|------|
| **每日** | 流媒体可用性变化 | GitHub Actions cron 触发 JustWatch API 轮询 |
| **每周** | 新改编发现 + 评分更新 | 定时跑 02-03-04 脚本 |
| **每月** | 海报/封面刷新 | 定时跑 05-06 |
| **新项目上线时** | 全量抓取 + AI 内容生成 | 手动触发 |

> ⚡ **关键优化**：一次性抓取全部 110 部改编只需 ~330 次 API 调用（TMDB：110 次详情 + OMDb：110 次评分 = 220 次，加上搜索/匹配开销）。TMDB API 免费额度 50 req/s，全量抓取 < 1 分钟。OMDb 免费 1000 req/day，一次跑完。

### 4.5 TMDB Stephen King 列表

TMDB 已有官方用户整理的 Stephen King 改编列表：
- List ID: **9638** — 88 部作品，按上映日期排序
- API: `GET https://api.themoviedb.org/3/list/9638?language=en-US`
- 直接获取完整列表 + 每部的 `poster_path`、评分等

这是数据采集的**最优起点**，大幅减少手动匹配工作。

---

## 5. 图片方案

### 5.1 STS2 vs King 项目 —— 逐条对照

| 维度 | STS2 卡牌图片 | Stephen King 海报 | 改善 |
|------|-------------|-------------------|------|
| **API** | ❌ 无官方 API | ✅ TMDB 免费 API | **从无到有** |
| **覆盖率** | ❌ 30% (177/578) | ✅ 100% (110/110) | **完全覆盖** |
| **获取方式** | ❌ 手动猜 CDN URL | ✅ 一行 `GET /movie/{id}/images` | **全自动** |
| **数量** | ~578 张 | ~200 张（110 海报 + 90 书封） | **60% 更少** |
| **存储** | 依赖第三方 CDN | 构建时下载到 `/public/images/` | **自主可控** |
| **URL 稳定** | ❌ CDN 变更导致失效 | ✅ 下载到本地后稳定 | **零维护** |
| **模糊占位符** | ⚠️ 未实现 | ✅ `plaiceholder` 生成 base64 blur | **体验改善** |

### 5.2 海报图片方案

```
图片流程：
1. TMDB API 获取 poster_path → "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg"
2. 构建为完整 URL → "https://image.tmdb.org/t/p/w780/hZkgoQYus5vegHoetLkCJzb17zJ.jpg"
3. 下载到本地 → "public/images/posters/the-shining-1980.jpg"
4. plaiceholder 生成 blur data URL → 嵌入 .mdx 文件 frontmatter
5. next/image 渲染 → <Image src="..." placeholder="blur" blurDataURL="..." />
```

**实现代码（管道脚本核心逻辑）**：

```typescript
// scripts/05-fetch-posters.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { getPlaiceholder } from 'plaiceholder';

const POSTER_DIR = 'public/images/posters';
const BASE_URL = 'https://image.tmdb.org/t/p/w780';

async function downloadPoster(tmdbPosterPath: string, slug: string) {
  const url = `${BASE_URL}${tmdbPosterPath}`;
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  
  // 保存原始图片
  const ext = path.extname(tmdbPosterPath); // .jpg
  const filename = `${slug}${ext}`;
  await fs.writeFile(path.join(POSTER_DIR, filename), buffer);
  
  // 生成 blur placeholder
  const { base64 } = await getPlaiceholder(buffer);
  
  return { filename, blurDataURL: base64 };
}
```

### 5.3 书籍封面

使用 **Open Library Covers API**（比 Google Books 更简单、无需 API Key）：
```
https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
https://covers.openlibrary.org/b/olid/{OLID}-L.jpg
```
三个尺寸：S (小), M (中), L (大)

### 5.4 人物照片

从 TMDB person profile 获取：
- `GET /person/{person_id}/images`
- 下载到 `public/images/people/{slug}.jpg`

---

## 6. MVP 页面架构

### 6.1 页面树

```
/                                    → 首页：统计数字 + 精选推荐 + 搜索入口
/adaptations                         → 全部改编作品列表（可筛选、排序）
/adaptations/[slug]                  → 改编作品详情页（⭐⭐⭐ 核心页面）
/adaptations/top                     → 评分排名 Top 50
/adaptations/by-year/[year]          → 按年份浏览
/adaptations/by-platform/[platform]  → 按流媒体平台浏览
/books                               → 原著作品列表
/books/[slug]                        → 原著详情页
/people/[slug]                       → 导演/演员页面
/search                              → 全文搜索
/about                               → 关于本站
```

### 6.2 核心页面：改编作品详情页

这是整个网站**最重要的页面**，承担 SEO 流量入口 + 变现功能。

```
┌──────────────────────────────────────────────────────────────┐
│  Breadcrumb: Home > Adaptations > The Shawshank Redemption   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌─────────────────────────────────────────┐  │
│  │          │  │  The Shawshank Redemption (1994)         │  │
│  │          │  │  肖申克的救赎                              │  │
│  │  POSTER  │  │                                          │  │
│  │          │  │  ⭐ IMDb 9.3/10  🍅 RT 89%  📊 MC 80    │  │
│  │          │  │  ⏱ 142 min  🎬 Drama  🏷 R             │  │
│  │          │  │                                          │  │
│  │          │  │  Based on: "Rita Hayworth and Shawshank  │  │
│  │          │  │  Redemption" (Different Seasons, 1982)   │  │
│  │          │  │                                          │  │
│  │          │  │  Director: Frank Darabont                │  │
│  │          │  │  Cast: Tim Robbins, Morgan Freeman...    │  │
│  │          │  │                                          │  │
│  │          │  │  ┌──────────────────────────────────┐    │  │
│  │          │  │  │ 📺 WHERE TO WATCH                │    │  │
│  │          │  │  │                                  │    │  │
│  │          │  │  │  [Netflix]  Stream  → Watch Now  │    │  │
│  │          │  │  │  [Prime]    Rent $3.99 → Watch   │    │  │
│  │          │  │  │  [iTunes]   Buy $9.99 → Watch    │    │  │
│  │          │  │  │                                  │    │  │
│  │          │  │  │  Last verified: July 14, 2026    │    │  │
│  │          │  │  └──────────────────────────────────┘    │  │
│  │          │  │                                          │  │
│  │          │  │  [📖 Buy the Book on Amazon] ← affiliate │  │
│  └──────────┘  └─────────────────────────────────────────┘  │
│                                                              │
│  ── Tabs ────────────────────────────────────────────────   │
│  [Overview] [Cast] [vs. Book] [Trivia] [Similar]            │
│                                                              │
│  📝 Overview                                                │
│  [AI 生成 + 人工编辑的 Markdown 内容，500-800 字]             │
│  - 剧情简介                                                  │
│  - 评价分析                                                  │
│  - 获奖情况                                                  │
│                                                              │
│  📖 How It Differs From the Book                             │
│  [AI 生成的差异对比，结构化数据]                               │
│  • Ending: [差异描述]                                        │
│  • Characters: [差异描述]                                     │
│  • Cut Content: [差异描述]                                    │
│                                                              │
│  🔗 Related Adaptations                                     │
│  [同一原著的其他改编，或同导演作品]                              │
│                                                              │
│  📊 More Stephen King Adaptations                           │
│  [底部推荐卡片网格 → 增加站内 PV]                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 首页设计

```
┌──────────────────────────────────────────────────────────────┐
│  🎬 Stephen King Adaptations Database                       │
│  Every Stephen King movie & TV adaptation — ratings,         │
│  streaming availability, and how they compare to the books.  │
│                                                              │
│  [🔍 Search all 110 adaptations...              ] [Search]  │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │  110       │ │  65+      │ │  5        │ │  Latest   │ │
│  │  Movies &  │ │  Books    │ │  Rating   │ │  2026     │ │
│  │  TV Shows  │ │  Adapted  │ │  Sources  │ │  Releases │ │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│                                                              │
│  ⭐ Top Rated Adaptations                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ #1       │ │ #2       │ │ #3       │ │ #4       │       │
│  │ Shawshank│ │ Green    │ │ Stand By │ │ Misery   │       │
│  │ 9.3 ⭐   │ │ Mile     │ │ Me       │ │ 7.8 ⭐   │       │
│  │ Netflix  │ │ 8.6 ⭐   │ │ 8.1 ⭐   │ │ Hulu     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  🆕 Latest Adaptations                                      │
│  [横向滚动卡片]                                               │
│                                                              │
│  📺 Browse by Streaming Platform                             │
│  [Netflix] [Prime] [HBO Max] [Hulu] [Disney+] ...           │
│                                                              │
│  🎯 Browse by Decade                                        │
│  [1970s] [1980s] [1990s] [2000s] [2010s] [2020s]           │
└──────────────────────────────────────────────────────────────┘
```

### 6.4 列表页

改编作品列表页是第二个核心页面：
- **筛选器**：类型（电影/剧集/迷你剧）、年代、评分区间、流媒体平台
- **排序**：评分、上映日期、字母
- **卡片**：海报 + 标题 + 年份 + 评分 + 流媒体图标
- **URL 参数同步**：`/adaptations?type=movie&minRating=7&platform=netflix`
- **无刷新筛选**（客户端状态，但每个筛选组合有对应的 SSG 页面）

---

## 7. SEO 策略

### 7.1 SSG 全量预渲染

```typescript
// app/adaptations/[slug]/page.tsx
export async function generateStaticParams() {
  const adaptations = await prisma.adaptation.findMany({
    select: { slug: true },
  });
  return adaptations.map((a) => ({ slug: a.slug }));
}

// 构建时就是纯 HTML，不需要 ISR
export const dynamicParams = false; // 未预渲染的返回 404
export const revalidate = false;    // 纯静态
```

110 页 + 其他，SSG 总构建时间 **< 2 分钟**，完全不需要 ISR。

### 7.2 Metadata

```typescript
// app/adaptations/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const adaptation = await prisma.adaptation.findUnique({
    where: { slug: params.slug },
    include: { book: true, ratings: true },
  });

  const imdbRating = adaptation.ratings.find(r => r.source === 'IMDB');
  const title = `${adaptation.title} (${adaptation.releaseYear}) - Stephen King Adaptation`;
  const description = `${adaptation.title} is a ${adaptation.releaseYear} ${adaptation.type.toLowerCase()} adaptation of Stephen King's "${adaptation.book?.title}". Rating: ${imdbRating?.score}/10. Find where to stream it.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/images/posters/${adaptation.slug}.jpg`],
      type: 'article',
    },
    // 结构化数据
    other: {
      'application-ld+json': JSON.stringify(generateSchemaOrg(adaptation)),
    },
  };
}
```

### 7.3 结构化数据 (Schema.org)

每个改编详情页注入 `Movie` 或 `TVSeries` schema：

```json
{
  "@context": "https://schema.org",
  "@type": "Movie",
  "name": "The Shawshank Redemption",
  "dateCreated": "1994",
  "director": { "@type": "Person", "name": "Frank Darabont" },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "9.3",
    "bestRating": "10",
    "ratingCount": "2900000"
  },
  "isBasedOn": {
    "@type": "Book",
    "name": "Rita Hayworth and Shawshank Redemption",
    "author": { "@type": "Person", "name": "Stephen King" }
  },
  "potentialAction": {
    "@type": "WatchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://netflix.com/title/..."
    }
  }
}
```

### 7.4 关键词策略

每个页面覆盖三个搜索意图：

| 意图 | 示例查询 | 对应内容 |
|------|---------|---------|
| **信息查询** | "Stephen King movies ranked" | 首页 + 排名页 |
| **作品查询** | "The Shawshank Redemption book differences" | 详情页 "vs. Book" tab |
| **观看查询** | "Where to watch The Shining streaming" | 详情页 "Where to Watch" box |

### 7.5 内链网络

```
原著 (Book) ←→ 改编 (Adaptation)  → 导演/演员 (Person)
     ↑                                    ↓
     └────── 合集 (Collection) ←──────────┘
```

- 每部改编链接到原著、导演、演员
- 每部原著链接到其所有改编
- 底部 "More Stephen King Adaptations" 推荐卡片
- 面包屑导航
- XML sitemap 自动生成

---

## 8. 变现集成

### 8.1 三层变现模型

| 层 | 方式 | 收益 | 优先级 |
|----|------|------|--------|
| **L1** | JustWatch affiliate deeplinks | 每次点击/订阅 $2-8 | ⭐⭐⭐ 核心 |
| **L2** | Amazon 图书 affiliate | 购书佣金 4.5% | ⭐⭐ 辅助 |
| **L3** | 展示广告 (Google AdSense) | CPM ~$5-15 | ⭐ 后期 |

### 8.2 Affiliate Link 架构

```typescript
// lib/affiliate.ts

// JustWatch 自带 affiliate tracking
function justWatchUrl(adaptation: Adaptation, platform: StreamingPlatform) {
  // JustWatch Content Partner API 直接返回带 tracking 的 deeplink
  return `https://click.justwatch.com/a?partner_id=XXX&url=${encodeURIComponent(
    `https://www.justwatch.com/us/${adaptation.type === 'MOVIE' ? 'movie' : 'tv-show'}/${adaptation.slug}`
  )}`;
}

// Amazon Associates
function amazonBookUrl(book: Book) {
  const asin = extractAsin(book.amazonUrl); // 预先存储
  return `https://www.amazon.com/dp/${asin}?tag=stephenkingdb-20`;
}
```

### 8.3 "Where to Watch" 组件

```tsx
// components/streaming/WhereToWatch.tsx
type Props = {
  streamingLinks: StreamingLink[];
  lastVerified: Date;
};

export function WhereToWatch({ streamingLinks, lastVerified }: Props) {
  const subscription = streamingLinks.filter(l => l.linkType === 'SUBSCRIPTION');
  const rent = streamingLinks.filter(l => l.linkType === 'RENT');
  const buy = streamingLinks.filter(l => l.linkType === 'BUY');
  const free = streamingLinks.filter(l => l.linkType === 'FREE_WITH_ADS');

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">📺 Where to Watch</h3>
      
      {/* 订阅制流媒体 — 最重要 */}
      {subscription.length > 0 && (
        <Section title="Stream" links={subscription} highlight />
      )}
      
      {/* 免费带广告 */}
      {free.length > 0 && (
        <Section title="Free with Ads" links={free} />
      )}
      
      {/* 租赁 */}
      {rent.length > 0 && (
        <Section title="Rent" links={rent} />
      )}
      
      {/* 购买 */}
      {buy.length > 0 && (
        <Section title="Buy" links={buy} />
      )}
      
      <p className="text-xs text-muted-foreground mt-4">
        Last verified: {formatDate(lastVerified)} · 
        Contains affiliate links
      </p>
    </div>
  );
}
```

---

## 9. STS2 教训清单

### 9.1 已验证的正确决策（直接复用）

| # | 决策 | 为什么对 | King 项目如何复用 |
|---|------|---------|------------------|
| 1 | **Prisma + PostgreSQL** | 类型安全、迁移简单、文档好 | 同技术栈 |
| 2 | **Next.js SSG** | 静态站点 SEO 最佳、部署到 Vercel 免费 | 同技术栈 |
| 3 | **Tailwind CSS + shadcn/ui** | 开发快、打包小、可定制 | 同组件库 |
| 4 | **plaiceholder 模糊占位** | 消除 CLS、改善 LCP | 所有海报使用 |
| 5 | **Zod 数据验证** | 抓取数据在入库前就能发现异常 | 管道脚本核心 |
| 6 | **Git-based 内容** | 无 CMS 开销、变更可追溯 | AI 生成内容写入 git |
| 7 | **Plausible 分析** | 隐私友好、无需 cookie banner | 直接集成 |

### 9.2 踩过的坑（这次要避免）

| # | 坑 | STS2 发生了什么 | King 项目对策 |
|---|-----|----------------|---------------|
| 1 | **图片依赖第三方 CDN** | ⭐⭐⭐⭐⭐ 最严重的坑。177/578 张图手动从第三方 CDN 猜 URL，后续 CDN 变更大量失效。 | **所有图片构建时下载到本地**。TMDB 虽然是 CDN，但我们不引用它，只从它下载。 |
| 2 | **数据采集无类型安全** | 手工拼 JSON，字段缺失/类型错误到渲染时才暴露 | 所有管道脚本输出经 **Zod schema 验证**后才能入库 |
| 3 | **SSG 构建慢** | 578 页 + 大量图片处理导致构建变慢 | 仅 200 页，构建 < 2 分钟。如果未来到 500+ 页再考虑 ISR |
| 4 | **没有自动更新机制** | 新内容完全依赖手动更新 | **GitHub Actions cron** 每日更新流媒体数据、每周检查新改编 |
| 5 | **搜索体验差** | 首次实现用了服务端搜索，每次输入都请求 | 用 **FlexSearch** 客户端搜索，零网络请求，即时响应 |
| 6 | **SEO metadata 不完整** | 部分页面缺少 OG tags、结构化数据 | 每个页面都用 `generateMetadata` + Schema.org JSON-LD |
| 7 | **没有模糊占位符** | 图片加载时布局跳动（CLS 问题） | `plaiceholder` 生成 base64 blur，零 CLS |
| 8 | **构建时图片处理阻塞** | 大量图片在构建时 optimize 导致超时 | 图片在**数据管道阶段**预处理，构建时直接用 |

### 9.3 新增优化（STS2 没做但 King 项目需要）

| # | 优化 | 说明 |
|---|------|------|
| 1 | **AI 内容生成管道** | Claude API 批量生成中文影评、原著差异分析，然后人工 review 后合并 |
| 2 | **结构化数据** | 每页 Schema.org JSON-LD，帮助 Google 展示 Rich Snippets（评分、导演、流媒体链接） |
| 3 | **暗色模式** | Tailwind dark mode class-based，与影视主题天然契合 |
| 4 | **筛选状态 URL 同步** | 所有筛选参数反映在 URL query string，可分享、可被搜索引擎索引 |
| 5 | **RSS Feed** | 新改编通知 feed，供 Google Discover 抓取 |

---

## 10. 实施路线图

### Phase 0: 基础设施（Day 1）

```
[ ] 初始化 Next.js 15 项目 + TypeScript strict
[ ] 配置 Tailwind CSS 4 + shadcn/ui
[ ] 配置 Prisma + SQLite (MVP)
[ ] 创建数据库迁移
[ ] 配置 ESLint + Prettier
[ ] 配置 GitHub repo
[ ] 配置 Vercel 部署
```

### Phase 1: 数据管道（Day 1-2）

```
[ ] 注册 TMDB API key
[ ] 注册 OMDb API key ($1/月 Patreon 层级或免费层)
[ ] 写 Wikipedia 抓取脚本 → books JSON
[ ] 写 TMDB list #9638 抓取脚本 → adaptations JSON
[ ] 写 TMDB detail 批量获取脚本
[ ] 写 OMDb 评分批量获取脚本
[ ] 写海报/书封下载脚本
[ ] 写 Zod 验证 + 数据归一化
[ ] 写 Prisma seed 脚本
[ ] 跑一遍完整管道，验证数据质量
```

### Phase 2: 核心页面（Day 2-4）

```
[ ] 首页（统计 + 精选推荐 + 搜索入口）
[ ] /adaptations 列表页（筛选 + 排序 + 分页）
[ ] /adaptations/[slug] 详情页（MVP 版本，含：
      - 基本信息、评分、演职员
      - Where to Watch 组件
      - Amazon 书籍 affiliate 链接
      - vs Book 差异分析）
[ ] /books 列表页
[ ] /books/[slug] 详情页
[ ] /adaptations/top 排名页
[ ] 搜索功能（FlexSearch）
[ ] 响应式设计（移动端优先）
```

### Phase 3: SEO + 性能（Day 4-5）

```
[ ] 全量 SSG generateStaticParams
[ ] 每页 generateMetadata（title, description, OG）
[ ] Schema.org JSON-LD 结构化数据
[ ] plaiceholder 模糊占位符
[ ] XML sitemap 生成
[ ] robots.txt
[ ] Google Search Console 提交
[ ] Core Web Vitals 优化（目标：LCP < 2.5s）
```

### Phase 4: AI 内容 + 增强（Day 5-7）

```
[ ] Claude API 批量生成中文影评（8-genreate-content.ts）
[ ] Claude API 批量生成原著差异分析
[ ] 内容人工 review 界面（简单的 admin 页面）
[ ] 暗色模式
[ ] 页面过渡动画（Framer Motion，轻量）
[ ] /adaptations/by-platform/[platform] 页面
[ ] /people/[slug] 导演/演员聚合页
```

### Phase 5: 变现 + 自动化（Week 2）

```
[ ] JustWatch Content Partner API 集成 / 或公开 API 抓取
[ ] Affiliate link 包装（JustWatch + Amazon）
[ ] GitHub Actions cron: 每日流媒体数据更新
[ ] GitHub Actions cron: 每周新改编检查
[ ] Plausible 分析集成
[ ] RSS Feed
```

### Phase 6: 正式上线（Week 3）

```
[ ] 全量数据 review + 手动校验
[ ] 最终 SEO audit
[ ] Google Search Console 验证
[ ] 提交 sitemap
[ ] 上线
[ ] 社交平台推广（Reddit r/stephenking, r/horror 等）
```

---

## 附录 A: API 费用估算

| API | 免费层 | 付费层 | MVP 需求量 | 费用 |
|-----|--------|--------|-----------|------|
| **TMDB** | 无限（非商业限制） | — | ~300 次请求 | **$0** |
| **OMDb** | 1,000 req/day | $1/月 Patreon | ~110 次请求 | **$0** |
| **Open Library** | 无限，无 API key | — | ~85 次请求 | **$0** |
| **JustWatch Public** | 无官方限制（谨慎使用） | Content Partner 需联系 | 每日 ~110 次 | **$0 (MVP)** |
| **Claude API** | — | ~$3/百万 token | ~110 篇 × 500 tokens | **~$5** |
| **Vercel** | Hobby 免费 | Pro $20/月 | Hobby 够用 | **$0 (MVP)** |
| **Plausible** | — | $9/月 | — | **$9/月** |
| **总计** | | | | **~$14 MVP 一次性 + $9/月运营** |

## 附录 B: 与竞品的核心差异

| 特性 | Wikipedia | stephenking.com | IMDb | Fandom Wiki | **本站** |
|------|-----------|----------------|------|-------------|---------|
| 改编列表 | ✅ | ❌（仅按时间列出作品） | ❌（散落） | ✅ | ✅ |
| 评分聚合 | ❌ | ❌ | ✅（仅 IMDb） | ❌ | ✅ (IMDb+RT+MC+豆瓣) |
| 流媒体引导 | ❌ | ❌ | ❌（部分有） | ❌ | ✅ **核心功能** |
| 原著差异分析 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 视觉设计 | ❌ | ✅ | ✅ | ❌ | ✅ |
| 筛选/排序 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 移动端友好 | ❌ | ❌ | ✅ | ❌ | ✅ |
| 中文内容 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 暗色模式 | ❌ | ❌ | ❌ | ❌ | ✅ |

---

> **文档版本**: v1.0 — 2026-07-14  
> **下文**: 项目脚手架和初始代码将在 `IMPLEMENTATION.md` 中展开
