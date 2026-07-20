import 'dotenv/config';
import { searchTitle, getTitleOffers, mapMonetizationType } from './lib/justwatch';

async function main() {
  console.log('🔌 Testing JustWatch library...\n');

  const tests = [
    { title: 'The Shawshank Redemption', year: 1994 },
    { title: 'The Shining', year: 1980 },
    { title: 'It', year: 2017 },
  ];

  for (const test of tests) {
    console.log(`Searching: "${test.title}" (${test.year})...`);
    const result = await searchTitle(test.title, test.year);
    if (result) {
      const c = result.content;
      console.log(`  ✅ ${c.title} (${c.originalReleaseYear}) [${result.objectType}]`);
      console.log(`     ID: ${result.id}  Path: ${c.fullPath}`);
      console.log(`     Offers: ${result.offers?.length || 0}`);

      // Show by monetization type
      const groups: Record<string, string[]> = {};
      result.offers?.forEach(o => {
        const label = o.package?.clearName || 'Unknown';
        const type = o.monetizationType;
        if (!groups[type]) groups[type] = [];
        groups[type].push(label);
      });

      Object.entries(groups).forEach(([type, names]) => {
        console.log(`     ${type}: ${names.join(', ')}`);
      });

      // Test the node query too
      console.log(`     Fetching full offers via node ID...`);
      const full = await getTitleOffers(result.id);
      if (full) {
        console.log(`     ✅ Node offers: ${full.offers?.length || 0}`);
      }
    } else {
      console.log(`  ❌ Not found`);
    }
    console.log('');
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('✅ Done!');
}

main().catch(console.error);
