import 'dotenv/config';

async function main() {
  console.log('🔌 Testing DeepSeek API...\n');

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是Stephen King改编作品影评人。' },
        { role: 'user', content: `请为电影《The Shining》（闪灵，1980）生成中文内容：

英文剧情：A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence.

## 剧情简介
（200-300字中文描述）

## 评价分析
（200-300字中文分析）

## 与原著的主要差异
- **结局**：具体差异描述
- **角色**：具体差异描述
- **基调**：具体差异描述` },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  const data = await res.json() as any;
  console.log('Status:', res.status);

  if (data.error) {
    console.log('Error:', JSON.stringify(data.error, null, 2));
    return;
  }

  const text = data.choices?.[0]?.message?.content;
  if (text) {
    console.log('✅ DeepSeek works!\n');
    console.log('--- Response ---');
    console.log(text);
    console.log(`\nTokens: ${data.usage?.total_tokens || '?'}`);
  } else {
    console.log('❌ No content:', JSON.stringify(data).slice(0, 500));
  }
}

main().catch(console.error);
