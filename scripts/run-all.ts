/**
 * Pipeline Orchestrator
 *
 * Runs all data pipeline steps in order.
 * Each step saves intermediate results to data/ so subsequent steps can pick up.
 *
 * Usage: npm run pipeline:all
 *   or:  npx tsx scripts/run-all.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');

const STEPS = [
  {
    name: 'Fetch Adaptations from TMDB',
    script: 'scripts/02-fetch-adaptations.ts',
    required: true,
  },
  {
    name: 'Fetch Ratings from OMDb',
    script: 'scripts/04-fetch-ratings.ts',
    required: false, // OMDb is optional — we can still launch without it
    envCheck: 'OMDB_API_KEY',
  },
  {
    name: 'Download Posters',
    script: 'scripts/05-fetch-posters.ts',
    required: true,
  },
  {
    name: 'Normalize and Seed Database',
    script: 'scripts/09-normalize-and-seed.ts',
    required: true,
  },
];

function checkEnv(key: string): boolean {
  return !!process.env[key];
}

function runStep(script: string): boolean {
  try {
    execSync(`npx tsx ${script}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  Stephen King Adaptations — Data Pipeline');
  console.log('═══════════════════════════════════════════\n');

  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log(`📁 Created ${DATA_DIR}\n`);
  }

  // Check required env vars
  if (!process.env.TMDB_API_KEY) {
    console.log('❌ TMDB_API_KEY is required.');
    console.log('   Register at: https://www.themoviedb.org/settings/api');
    console.log('   Then add it to your .env file.\n');
    process.exit(1);
  }

  let passed = 0;
  let skipped = 0;
  let failed = 0;

  for (const step of STEPS) {
    console.log(`\n━━━ ${step.name} ━━━`);

    // Check if this step's env var is set
    if (step.envCheck && !checkEnv(step.envCheck)) {
      console.log(`  ⏭️  Skipped — ${step.envCheck} not set in .env`);
      skipped++;
      continue;
    }

    const ok = runStep(step.script);
    if (ok) {
      passed++;
    } else if (step.required) {
      console.error(`\n❌ Required step "${step.name}" failed. Stopping.`);
      process.exit(1);
    } else {
      console.log(`  ⚠️  Optional step failed — continuing`);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`  Pipeline complete!`);
  console.log(`  ✅ Passed:  ${passed}`);
  if (skipped > 0) console.log(`  ⏭️  Skipped: ${skipped}`);
  if (failed > 0) console.log(`  ⚠️  Failed:  ${failed}`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch((error) => {
  console.error('Pipeline fatal error:', error);
  process.exit(1);
});
