import 'dotenv/config';

async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  console.log('Key prefix:', key?.slice(0, 20) + '...');
  console.log('Key length:', key?.length);

  // Test 1: List models (verifies auth works)
  console.log('\nTest 1: Verifying API key...');
  const res1 = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "API key works!" in one sentence.' }],
    }),
  });

  const data1 = await res1.json();
  console.log('Status:', res1.status);

  if (res1.ok) {
    console.log('✅ API key works!');
    console.log('Response:', data1.content?.[0]?.text);
  } else {
    console.log('❌ API error:', JSON.stringify(data1).slice(0, 500));
  }
}

main().catch(console.error);
