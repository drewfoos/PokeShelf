// scripts/update-tcgplayer-urls.ts
import { PrismaClient, Prisma } from '@prisma/client';
import dotenv from 'dotenv';
import { exit } from 'process';

// Load environment variables
dotenv.config();

// Configuration
const BATCH_SIZE = 100;
const CONCURRENT_BATCHES = 5;
const DELAY_BETWEEN_BATCHES_MS = 50;

/**
 * Get the direct TCGPlayer URL for a card
 */
async function getDirectTCGPlayerUrl(cardId: string): Promise<string> {
  const apiUrl = `https://prices.pokemontcg.io/tcgplayer/${cardId}`;
  try {
    const response = await fetch(apiUrl, { redirect: 'follow' });
    return response.url;
  } catch (error) {
    console.error("Failed to resolve direct URL:", error);
    return `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(cardId)}`;
  }
}

/**
 * Helper function to prepare JSON for Prisma
 */
function prepareJsonForPrisma<T>(data: T | null | undefined): Prisma.InputJsonValue {
  if (data === undefined || data === null) {
    return {}; // Return empty object instead of trying to parse undefined
  }
  return JSON.parse(JSON.stringify(data));
}

/**
 * Sleep utility to avoid hitting rate limits
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process a card update
 */
async function processCard(prisma: PrismaClient, card: { id: string; name: string; tcgplayer: any }) {
  try {
    // Check if the card already has a TCGPlayer URL
    if (card.tcgplayer && 
        typeof card.tcgplayer === 'object' && 
        card.tcgplayer.url && 
        typeof card.tcgplayer.url === 'string' &&
        card.tcgplayer.url.includes('tcgplayer.com')) {
      // Skip this card as it already has a valid TCGPlayer URL
      return { success: true, id: card.id, name: card.name, skipped: true };
    }
    
    // Get the direct TCGPlayer URL
    const directUrl = await getDirectTCGPlayerUrl(card.id);
    
    // Parse existing tcgplayer data or create new object
    let tcgplayerData = {};
    if (card.tcgplayer && typeof card.tcgplayer === 'object') {
      tcgplayerData = card.tcgplayer as object;
    }
    
    // Update the URL in the tcgplayer data
    const updatedTcgplayer = {
      ...tcgplayerData,
      url: directUrl
    };
    
    // Update the card in the database
    await prisma.card.update({
      where: { id: card.id },
      data: {
        tcgplayer: prepareJsonForPrisma(updatedTcgplayer),
        lastUpdated: new Date()
      }
    });
    
    return { success: true, id: card.id, name: card.name, skipped: false };
  } catch (error) {
    console.error(`Failed to update TCGPlayer URL for card ${card.id}:`, error);
    return { success: false, id: card.id, name: card.name, skipped: false };
  }
}

/**
 * Process a batch of cards
 */
async function processBatch(prisma: PrismaClient, batch: { id: string; name: string; tcgplayer: any }[], batchIndex: number) {
  const batchPromises = batch.map(card => processCard(prisma, card));
  const results = await Promise.all(batchPromises);
  
  // Count skipped cards
  const skipped = results.filter(r => r.success && r.skipped);
  
  // Log a sample of successes (non-skipped)
  const successes = results.filter(r => r.success && !r.skipped);
  if (successes.length > 0) {
    console.log(`Batch ${batchIndex}: Sample of successful updates: ${successes.slice(0, 3).map(s => s.id).join(', ')}${successes.length > 3 ? ` and ${successes.length-3} more` : ''}`);
  }
  
  // Log failures
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log(`Batch ${batchIndex}: Failed updates: ${failures.map(f => f.id).join(', ')}`);
  }
  
  if (skipped.length > 0) {
    console.log(`Batch ${batchIndex}: Skipped ${skipped.length} cards with existing TCGPlayer URLs`);
  }
  
  return {
    successCount: successes.length + skipped.length,
    failedCount: failures.length,
    skippedCount: skipped.length
  };
}

/**
 * Main function to update TCGPlayer URLs for all cards
 */
async function updateTCGPlayerUrls() {
  const prisma = new PrismaClient();
  
  try {
    console.log("==== Updating TCGPlayer URLs ====");
    console.log("This may take a while depending on the number of cards");
    console.log(`Batch size: ${BATCH_SIZE}, Concurrent batches: ${CONCURRENT_BATCHES}`);
    console.log("==================================\n");
    
    const startTime = Date.now();
    
    // Get all cards from the database
    console.log("Fetching cards from database...");
    const cards = await prisma.card.findMany({
      select: { id: true, name: true, tcgplayer: true }
    });
    
    console.log(`Found ${cards.length} cards to process`);
    
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    // Split cards into batches
    const allBatches = [];
    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      allBatches.push(cards.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Created ${allBatches.length} batches`);
    
    // Process batches with controlled concurrency
    for (let i = 0; i < allBatches.length; i += CONCURRENT_BATCHES) {
      const batchesToProcess = allBatches.slice(i, i + CONCURRENT_BATCHES);
      const progress = Math.round((i / allBatches.length) * 100);
      
      console.log(`\n[${progress}%] Processing batches ${i+1}-${Math.min(i+CONCURRENT_BATCHES, allBatches.length)} of ${allBatches.length}...`);
      
      // Process multiple batches in parallel
      const batchPromises = batchesToProcess.map((batch, index) => 
        processBatch(prisma, batch, i + index + 1)
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      // Update success, failure, and skipped counts
      for (const result of batchResults) {
        successCount += result.successCount;
        failedCount += result.failedCount;
        skippedCount += result.skippedCount || 0;
      }
      
      // Calculate and show ETA
      if (i > 0) {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const batchesProcessed = Math.min(i + CONCURRENT_BATCHES, allBatches.length);
        const avgTimePerBatchGroup = elapsedSeconds / (batchesProcessed / CONCURRENT_BATCHES);
        const batchGroupsRemaining = Math.ceil((allBatches.length - batchesProcessed) / CONCURRENT_BATCHES);
        const etaSeconds = Math.round(avgTimePerBatchGroup * batchGroupsRemaining);
        
        const etaMinutes = Math.floor(etaSeconds / 60);
        const etaHours = Math.floor(etaMinutes / 60);
        
        let etaString = "";
        if (etaHours > 0) {
          etaString = `${etaHours}h ${etaMinutes % 60}m`;
        } else if (etaMinutes > 0) {
          etaString = `${etaMinutes}m ${etaSeconds % 60}s`;
        } else {
          etaString = `${etaSeconds}s`;
        }
        
        console.log(`Progress: ${successCount + failedCount}/${cards.length} cards processed (${Math.round(((successCount + failedCount) / cards.length) * 100)}%)`);
        console.log(`ETA: ${etaString} remaining`);
      }
      
      // Small delay between batch groups to avoid overwhelming the API
      if (i + CONCURRENT_BATCHES < allBatches.length) {
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    }
    
    // Show summary
    const durationMs = Date.now() - startTime;
    const durationMinutes = Math.round(durationMs / 60000);
    const cardsPerSecond = Math.round((successCount + failedCount) / (durationMs / 1000));
    
    console.log("\n==== Update Complete ====");
    console.log(`Total cards processed: ${cards.length}`);
    console.log(`Successful updates: ${successCount - skippedCount}`);
    console.log(`Skipped (already had URL): ${skippedCount}`);
    console.log(`Failed updates: ${failedCount}`);
    console.log(`Duration: ${durationMinutes} minutes`);
    console.log(`Performance: ${cardsPerSecond} cards/second`);
    console.log("========================");
    
  } catch (error) {
    console.error("Error updating TCGPlayer URLs:", error);
  } finally {
    await prisma.$disconnect();
    exit(0);
  }
}

// Run the script
updateTCGPlayerUrls().catch(error => {
  console.error("Unhandled error in script:", error);
  exit(1);
});