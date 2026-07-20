/**
 * Translate Chinese AI content to English using DeepSeek.
 * Reads ai-content.json, translates review + differences, saves back.
 *
 * Cost: ~$0.05 total (DeepSeek translation is very cheap)
 * Usage: npx tsx scripts/translate-content.ts
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const INPUT_FILE = path.join(DATA_DIR, 'ai-content.json');

const API_KEY = process.env.DEEPSEEK_API_KEY;

async function translate(text: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate Chinese to natural, fluent English. Preserve markdown formatting. Keep film titles in their original English names. Output ONLY the translation, no extra text.',
        },
        { role: 'user', content: `Translate this Chinese text to English:\n\n${text}` },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

async function main() {
  if (!API_KEY) {
    console.log('⏭️  DEEPSEEK_API_KEY not set');
    process.exit(0);
  }
  if (!existsSync(INPUT_FILE)) {
    console.error('❌ ai-content.json not found');
    process.exit(1);
  }

  const items = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`🌐 Translating content for ${items.length} adaptations...\n`);

  let done = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Skip if already has English
    if (item.reviewEn && item.differences?.every((d: any) => d.descriptionEn)) {
      console.log(`  [${i + 1}/${items.length}] ${item.title} — already translated, skipping`);
      done++;
      continue;
    }

    try {
      console.log(`  [${i + 1}/${items.length}] ${item.title}...`);

      // Translate review if present
      if (item.reviewCn && !item.reviewEn) {
        const en = await translate(item.reviewCn);
        item.reviewEn = en;
        console.log(`    ✅ review: ${item.reviewCn.length}c → ${en.length}c`);
      }

      // Translate each difference
      if (item.differences?.length > 0) {
        let diffCount = 0;
        for (const d of item.differences) {
          if (!d.descriptionEn && d.description) {
            d.descriptionEn = await translate(d.description);
            diffCount++;
          }
        }
        if (diffCount > 0) console.log(`    ✅ ${diffCount} differences translated`);
      }

      done++;
    } catch (e) {
      console.error(`    ❌ ${(e as Error).message.slice(0, 100)}`);
    }

    // Save every 5
    if ((i + 1) % 5 === 0) {
      writeFileSync(INPUT_FILE, JSON.stringify(items, null, 2), 'utf-8');
    }

    await new Promise(r => setTimeout(r, 100));
  }

  writeFileSync(INPUT_FILE, JSON.stringify(items, null, 2), 'utf-8');
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Translated: ${done}/${items.length}`);
  console.log(`   💰 Cost: ~$${(done * 0.001).toFixed(2)}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
