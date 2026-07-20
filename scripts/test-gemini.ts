import 'dotenv/config';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';

async function test() {
  console.log('🔌 Testing Gemini API...\n');

  const prompt = `你是Stephen King改编作品专家。请为电影《The Shining》（闪灵，1980）生成中文内容。

英文剧情：Jack Torrance accepts a caretaker job at the Overlook Hotel, where he, along with his wife Wendy and their son Danny, must live isolated from the rest of the world for the winter. But the hotel has a dark history and supernatural forces that begin to unravel Jack's sanity.

请严格按以下格式输出中文内容：

## 剧情简介
（200-300字中文描述）

## 评价分析
（200-300字中文分析）

## 与原著的主要差异
- **结局**：具体描述
- **角色**：具体描述
- **基调**：具体描述`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    }),
  });

  const data = await res.json() as any;
  console.log('Status:', res.status);

  if (data.error) {
    console.log('Error:', JSON.stringify(data.error, null, 2));
    return;
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) {
    console.log('✅ Gemini works!\n');
    console.log('--- Response preview (first 500 chars): ---');
    console.log(text.slice(0, 500));
    console.log('...');
    console.log(`\nTotal: ${text.length} characters`);
  } else {
    console.log('No text in response:', JSON.stringify(data).slice(0, 500));
  }
}

test().catch(console.error);
