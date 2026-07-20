/**
 * Pipeline Step 8: Generate Chinese AI Content with DeepSeek
 *
 * DeepSeek V3 — native Chinese, OpenAI-compatible API, extremely cheap.
 * Cost: ~$0.15 total for all 88 adaptations (DeepSeek pricing).
 *
 * Usage: npx tsx scripts/08-generate-content.ts
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const DATA_DIR = path.join(process.cwd(), 'data');
const INPUT_FILE = path.join(DATA_DIR, 'adaptations-raw.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'ai-content.json');

// ── DeepSeek API ────────────────────────────────────

const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_BASE = 'https://api.deepseek.com';
const MODEL = 'deepseek-chat'; // V3 — fast + cheap + excellent Chinese

async function chat(prompt: string): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是Stephen King改编作品的资深影评人，擅长用流畅的中文撰写影评和原著对比分析。输出格式严格遵循要求，内容客观准确。',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek HTTP ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error(`DeepSeek returned empty: ${JSON.stringify(data).slice(0, 200)}`);
  }

  return text;
}

// ── Prompt Template ─────────────────────────────────

function buildPrompt(adaptation: any): string {
  const typeLabel = adaptation.mediaType === 'tv' ? '剧集' : '电影';
  return `请为以下Stephen King改编${typeLabel}生成中文内容：

英文片名：${adaptation.title}
上映年份：${adaptation.releaseYear || '未知'}
类型：${typeLabel}
英文剧情：${adaptation.overview || '暂无'}

请严格按以下格式输出：

## 剧情简介
（200-300字中文描述，不剧透关键转折点）

## 评价分析
（200-300字中文分析：导演手法、演员表现、与Stephen King原著的关系、在恐怖/惊悚类型片中的地位）

## 与原著的主要差异
列出3-5条主要差异，格式：- **类别名**：描述
类别必须用：结局、角色、情节、基调、删减内容`;
}

// ── Zod Schema ──────────────────────────────────────

const AIContentSchema = z.object({
  tmdbId: z.number(),
  title: z.string(),
  overviewCn: z.string(),
  reviewCn: z.string(),
  differences: z.array(z.object({
    category: z.string(),
    description: z.string(),
  })),
});

// ── Parser ──────────────────────────────────────────

function parseResponse(text: string, tmdbId: number, title: string) {
  // DeepSeek outputs single newline after ## headers, not double
  // Match: "## 剧情简介\ncontent..." or "## 剧情简介\n\ncontent..."
  const overviewMatch = text.match(/## 剧情简介\n+([\s\S]*?)(?=\n## |$)/);
  const overviewCn = overviewMatch?.[1]?.trim() || '';

  const reviewMatch = text.match(/## 评价分析\n+([\s\S]*?)(?=\n## |$)/);
  const reviewCn = reviewMatch?.[1]?.trim() || '';

  const diffMatch = text.match(/## 与原著的主要差异\n+([\s\S]*?)$/);
  const diffText = diffMatch?.[1] || '';
  const diffLines = diffText.split('\n').filter(l => l.trim().startsWith('- **'));

  const catMap: Record<string, string> = {
    '结局': 'ENDING', '角色': 'CHARACTER', '人物': 'CHARACTER',
    '情节': 'PLOT', '剧情': 'PLOT',
    '基调': 'TONE', '风格': 'TONE', '氛围': 'TONE',
    '删减': 'CUT_CONTENT', '删减内容': 'CUT_CONTENT',
  };

  const differences = diffLines.map(line => {
    const catMatch = line.match(/\*\*(.+?)\*\*/);
    const cnCat = catMatch?.[1]?.trim() || '情节';
    const category = catMap[cnCat] || 'PLOT';
    const description = line.replace(/- \*\*.*?\*\*[：:]\s*/, '').trim();
    return { category, description };
  }).filter(d => d.description.length > 10).slice(0, 5);

  return AIContentSchema.parse({ tmdbId, title, overviewCn, reviewCn, differences });
}

// ── Main Pipeline ───────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.log('⏭️  DEEPSEEK_API_KEY not set — skipping');
    process.exit(0);
  }

  if (!existsSync(INPUT_FILE)) {
    console.error('❌ data/adaptations-raw.json not found.');
    process.exit(1);
  }

  const rawData: any[] = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));

  // Resume support: skip already-generated
  let existing: any[] = [];
  if (existsSync(OUTPUT_FILE)) {
    existing = JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'));
  }
  const existingIds = new Set(existing.map((e: any) => e.tmdbId));
  const todo = rawData.filter(a => !existingIds.has(a.tmdbId));

  if (todo.length === 0) {
    console.log('✅ All already generated!');
    process.exit(0);
  }

  console.log(`🤖 DeepSeek V3 — generating Chinese content\n`);
  console.log(`   Already done: ${existing.length}  |  Remaining: ${todo.length}`);
  console.log(`   Cost estimate: ~$${(todo.length * 0.002).toFixed(2)}\n`);

  const results = [...existing];
  let ok = 0, fail = 0;

  for (let i = 0; i < todo.length; i++) {
    const a = todo[i];
    try {
      console.log(`  [${i + 1}/${todo.length}] ${a.title} (${a.releaseYear})...`);
      const text = await chat(buildPrompt(a));
      const parsed = parseResponse(text, a.tmdbId, a.title);
      results.push(parsed);
      ok++;
      console.log(`    ✅ ${parsed.overviewCn.length}c overview, ${parsed.differences.length} diffs`);
    } catch (e) {
      console.error(`    ❌ ${(e as Error).message.slice(0, 100)}`);
      fail++;
      results.push({ tmdbId: a.tmdbId, title: a.title, overviewCn: a.overview || '', reviewCn: '', differences: [] });
    }

    // Save progress every 5 items (resilience against interruption)
    if ((i + 1) % 5 === 0) {
      writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
    }

    await new Promise(r => setTimeout(r, 50)); // ~20 req/sec, well within DeepSeek limits
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Done!  Succeeded: ${ok}  |  Failed: ${fail}`);
  console.log(`   📁 ${OUTPUT_FILE}`);
  console.log(`   💰 Cost: ~$${(ok * 0.002).toFixed(2)} (DeepSeek)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
