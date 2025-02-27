// scripts/import-data.ts
import dotenv from 'dotenv';
import { pokemonTcgService } from '../lib/services/pokemonTcgService';

// Load environment variables
dotenv.config({ path: '.env' });

async function importData() {
  try {
    console.log('🔄 Starting Pokémon TCG data import...');
    
    // First, sync all sets
    console.log('📚 Syncing all sets...');
    const setsResult = await pokemonTcgService.syncSets();
    
    if (!setsResult.success) {
      throw new Error('Failed to sync sets');
    }
    
    console.log(`✅ Successfully synced ${setsResult.count} sets`);
    
    // Then sync cards from specific sets
    const setsToSync = [
      'sv4',       // Scarlet & Violet—Paradox Rift
      'sv3pt5',    // Scarlet & Violet—Paldean Fates
      'sv3',       // Scarlet & Violet—Obsidian Flames
    ];
    
    console.log(`🃏 Syncing cards from ${setsToSync.length} sets...`);
    
    // Sleep function to add delays
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const setId of setsToSync) {
      console.log(`📥 Syncing cards from set ${setId}...`);
      const cardsResult = await pokemonTcgService.syncSetCards(setId);
      
      if (cardsResult.success) {
        console.log(`✅ Successfully synced ${cardsResult.count} cards from set ${setId}`);
      } else {
        console.error(`❌ Failed to sync cards from set ${setId}:`, cardsResult.error);
      }
      
      // Add a substantial delay between set imports (10 seconds)
      console.log(`Waiting 10 seconds before next set import...`);
      await sleep(10000);
    }
    
    console.log('✨ Data import completed successfully!');
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

// Run the import
importData();