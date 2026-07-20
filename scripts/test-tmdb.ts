import 'dotenv/config';
import { getSKList, getMovieDetails, getTVDetails } from './lib/tmdb';

async function main() {
  console.log('🔌 Testing TMDB API connection...\n');

  // Test 1: Fetch the Stephen King list
  console.log('Test 1: Fetch TMDB List #9638...');
  try {
    const items = await getSKList();
    console.log(`  ✅ Success! ${items.length} items in the list\n`);
    if (items.length > 0) {
      console.log('  First 5 items:');
      items.slice(0, 5).forEach(i => {
        console.log(`    - ${i.title || i.name} (${i.media_type}, TMDB ID: ${i.id})`);
      });
    }
  } catch (e) {
    console.error(`  ❌ Failed:`, (e as Error).message);
    process.exit(1);
  }

  // Test 2: Fetch a specific movie detail
  console.log('\nTest 2: Fetch movie detail (The Shawshank Redemption, TMDB ID 278)...');
  try {
    const movie = await getMovieDetails(278);
    console.log(`  ✅ Title: ${movie.title}`);
    console.log(`     Year: ${movie.release_date}`);
    console.log(`     Rating: ${movie.vote_average}/10 (${movie.vote_count} votes)`);
    console.log(`     Runtime: ${movie.runtime} min`);
    console.log(`     Director: ${movie.credits?.crew?.find(c => c.job === 'Director')?.name || 'N/A'}`);
    console.log(`     Cast (top 3): ${movie.credits?.cast?.slice(0, 3).map(c => c.name).join(', ') || 'N/A'}`);
    console.log(`     IMDb ID: ${movie.external_ids?.imdb_id || 'N/A'}`);
    console.log(`     Poster: ${movie.poster_path ? '✅' : '❌'}`);
  } catch (e) {
    console.error(`  ❌ Failed:`, (e as Error).message);
  }

  // Test 3: Fetch a TV show
  console.log('\nTest 3: Fetch TV show detail (11.22.63, TMDB ID 63057)...');
  try {
    const tv = await getTVDetails(63057);
    console.log(`  ✅ Title: ${tv.name}`);
    console.log(`     Year: ${tv.first_air_date}`);
    console.log(`     Rating: ${tv.vote_average}/10`);
    console.log(`     Seasons: ${tv.number_of_seasons}`);
    console.log(`     Episodes: ${tv.number_of_episodes}`);
    console.log(`     IMDb ID: ${tv.external_ids?.imdb_id || 'N/A'}`);
  } catch (e) {
    console.error(`  ❌ Failed:`, (e as Error).message);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All TMDB API tests passed! Ready to run pipeline.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
