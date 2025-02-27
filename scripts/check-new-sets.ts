// scripts/check-new-sets.ts
import dotenv from 'dotenv';
import { pokemonTcgService } from '../lib/services/pokemonTcgService';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkNewSets() {
  try {
    console.log('🔍 Checking for new Pokémon card sets...');
    
    // Run the new set check
    const result = await pokemonTcgService.syncNewSets();
    
    if (result.success) {
        if (result.count > 0 && result.importedSets) {
          console.log(`✅ Successfully imported ${result.count} new sets:`);
          result.importedSets.forEach(set => {
            console.log(`  - ${set.name} (${set.id}): ${set.cardCount} cards`);
          });
        } else {
          console.log('✅ No new sets found. Database is up to date.');
        }
    } else {
      console.error('❌ Failed to check for new sets:', result.error);
    }
  } catch (error) {
    console.error('❌ Error checking for new sets:', error);
    process.exit(1);
  }
}

// Run the function
checkNewSets();