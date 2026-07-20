import 'dotenv/config';
import { searchTitle } from './lib/justwatch';

async function main() {
  const titles = [
    { title: 'The Shawshank Redemption', year: 1994 },
    { title: 'The Shining', year: 1980 },
    { title: 'It', year: 2017 },
  ];

  const seen = new Set<string>();

  for (const t of titles) {
    const r = await searchTitle(t.title, t.year);
    if (!r) continue;
    for (const o of r.offers || []) {
      const key = `${o.package?.clearName}|${o.package?.technicalName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`${o.package?.clearName} | ${o.package?.technicalName} | ${o.monetizationType}`);
    }
    await new Promise(r => setTimeout(r, 600));
  }
}

main();
