// scripts/optimized-standalone-sync.ts
import { PrismaClient, Prisma } from '@prisma/client';
import dotenv from 'dotenv';
import { exit } from 'process';

// Load environment variables
dotenv.config();

// Configuration
const CONCURRENT_SET_PROCESSING = 5; // Process multiple sets in parallel - increased for MongoDB M1
const CARD_BATCH_SIZE = 50; // How many cards to process at once within a set - increased for MongoDB M1
const DB_BATCH_SIZE = 100; // How many DB operations to batch - increased for MongoDB M1
const RATE_LIMIT_REQUESTS = process.env.POKEMON_TCG_API_KEY ? 20000 : 1000; // Requests per day
const RATE_LIMIT_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours in ms
const REQUESTS_PER_MINUTE_LIMIT = process.env.POKEMON_TCG_API_KEY ? 0 : 30; // No fixed limit with API key, 30/min without
const MIN_REQUEST_INTERVAL_MS = REQUESTS_PER_MINUTE_LIMIT ? (60 * 1000) / REQUESTS_PER_MINUTE_LIMIT : 100; // Min ms between requests

// Type definitions
interface CardImage {
  small: string;
  large: string;
}

interface TCGPlayerPriceData {
  low?: number;
  mid?: number;
  high?: number;
  market?: number;
  directLow?: number | null;
}

interface TCGPlayerPrices {
  normal?: TCGPlayerPriceData;
  holofoil?: TCGPlayerPriceData;
  reverseHolofoil?: TCGPlayerPriceData;
  '1stEditionHolofoil'?: TCGPlayerPriceData;
  [key: string]: TCGPlayerPriceData | undefined;
}

interface TCGPlayerData {
  url: string;
  updatedAt: string;
  prices?: TCGPlayerPrices;
}

interface SetImages {
  symbol: string;
  logo: string;
}

interface Legalities {
  standard?: string;
  expanded?: string;
  unlimited?: string;
  [key: string]: string | undefined;
}

interface PokemonSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities?: Legalities | null;
  ptcgoCode?: string | null;
  releaseDate: string;
  updatedAt: string;
  images: SetImages;
}

interface Card {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  hp?: string | null;
  types: string[];
  number: string;
  artist?: string | null;
  rarity: string;
  nationalPokedexNumbers: number[];
  images: CardImage;
  tcgplayer?: TCGPlayerData;
  set: {
    id: string;
    name: string;
  };
}

interface PriceHistoryRecord {
  cardId: string;
  date: Date;
  normal: number | null;
  holofoil: number | null;
  reverseHolofoil: number | null;
  firstEdition: number | null;
}

// Helper function to prepare JSON for Prisma
function prepareJsonForPrisma<T>(data: T | null | undefined): Prisma.InputJsonValue {
  if (data === undefined || data === null) {
    return {}; // Return empty object instead of trying to parse undefined
  }
  return JSON.parse(JSON.stringify(data));
}

// Rate limiter class
class RateLimiter {
  private requestHistory: number[] = [];
  private readonly maxRequests: number;
  private readonly periodMs: number;
  private readonly requestsPerMinute: number;
  private lastRequestTime: number = 0;

  constructor(maxRequests: number, periodMs: number, requestsPerMinute: number = 0) {
    this.maxRequests = maxRequests;
    this.periodMs = periodMs;
    this.requestsPerMinute = requestsPerMinute;
  }

  async waitForPermission(): Promise<void> {
    // First, check and enforce the requests per minute limit if applicable
    if (this.requestsPerMinute > 0) {
      const now = Date.now();
      const timeElapsed = now - this.lastRequestTime;
      
      // Ensure minimum time between requests
      const minInterval = (60 * 1000) / this.requestsPerMinute;
      if (timeElapsed < minInterval) {
        const waitTime = minInterval - timeElapsed;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Clean up old requests from history
    const now = Date.now();
    this.requestHistory = this.requestHistory.filter(
      timestamp => now - timestamp < this.periodMs
    );

    // Check if we're at the limit
    if (this.requestHistory.length >= this.maxRequests) {
      const oldestRequest = this.requestHistory[0];
      const waitTime = oldestRequest + this.periodMs - now;
      
      console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime/1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // After waiting, clean up history again
      this.requestHistory = this.requestHistory.filter(
        timestamp => Date.now() - timestamp < this.periodMs
      );
    }

    // Record this new request
    this.requestHistory.push(Date.now());
    this.lastRequestTime = Date.now();
  }
}

// Pokemon TCG Service class with improvements
class PokemonTcgService {
  private baseUrl: string;
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;
  private prisma: PrismaClient;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string, prisma: PrismaClient) {
    this.baseUrl = 'https://api.pokemontcg.io/v2';
    this.apiKey = apiKey;
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.prisma = prisma;
    this.rateLimiter = new RateLimiter(
      RATE_LIMIT_REQUESTS, 
      RATE_LIMIT_PERIOD_MS,
      REQUESTS_PER_MINUTE_LIMIT
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(
    endpoint: string,
    params: Record<string, unknown> = {},
    retries = this.maxRetries
  ): Promise<unknown> {
    // Wait for rate limiter permission before making request
    await this.rateLimiter.waitForPermission();
    
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }

    try {
      console.log(`Making request to: ${url.toString()}`);
      const response = await fetch(url.toString(), { headers });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelay * (this.maxRetries - retries + 1);
        
        console.log(`Rate limit reached. Waiting ${waitTime/1000}s before retrying...`);
        await this.sleep(waitTime);
        return this.makeRequest(endpoint, params, retries - 1);
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (retries > 0) {
        const backoffTime = this.retryDelay * (this.maxRetries - retries + 1);
        console.log(`Request failed. Retrying in ${backoffTime/1000}s... (${retries} left)`);
        await this.sleep(backoffTime);
        return this.makeRequest(endpoint, params, retries - 1);
      }
      throw error;
    }
  }

  async getSets(options: { pageSize?: number, orderBy?: string } = {}): Promise<{ data: PokemonSet[] }> {
    const response = await this.makeRequest('/sets', { 
      ...options,
      orderBy: options.orderBy || '-releaseDate'
    });
    return response as { data: PokemonSet[] };
  }

  async getCards(options: { q?: string, page?: number, pageSize?: number } = {}): Promise<{ data: Card[] }> {
    const response = await this.makeRequest('/cards', options);
    return response as { data: Card[] };
  }

  async syncSets(): Promise<{ success: boolean; count?: number; error?: unknown }> {
    try {
      const response = await this.getSets({ pageSize: 250 });
      const sets = response.data;

      console.log(`Syncing ${sets.length} sets to database...`);
      
      // Group sets into batches for more efficient database operations
      const batchSize = DB_BATCH_SIZE;
      for (let i = 0; i < sets.length; i += batchSize) {
        const batch = sets.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sets.length/batchSize)}...`);
        
        // Create batch operations
        const operations = batch.map(setData => 
          this.prisma.set.upsert({
            where: { id: setData.id },
            update: {
              name: setData.name,
              series: setData.series,
              printedTotal: setData.printedTotal,
              total: setData.total,
              legalities: prepareJsonForPrisma(setData.legalities || {}),
              ptcgoCode: setData.ptcgoCode,
              releaseDate: setData.releaseDate,
              updatedAt: setData.updatedAt,
              images: prepareJsonForPrisma(setData.images || { symbol: "", logo: "" }),
              lastUpdated: new Date(),
            },
            create: {
              id: setData.id,
              name: setData.name,
              series: setData.series,
              printedTotal: setData.printedTotal,
              total: setData.total,
              legalities: prepareJsonForPrisma(setData.legalities || {}),
              ptcgoCode: setData.ptcgoCode,
              releaseDate: setData.releaseDate,
              updatedAt: setData.updatedAt,
              images: prepareJsonForPrisma(setData.images || { symbol: "", logo: "" }),
              lastUpdated: new Date(),
            },
          })
        );
        
        // Execute batch operations
        try {
          await this.prisma.$transaction(operations);
        } catch (error) {
          console.error(`Error in batch transaction:`, error);
          
          // If batch fails, try one by one
          for (const setData of batch) {
            try {
              await this.prisma.set.upsert({
                where: { id: setData.id },
                update: {
                  name: setData.name,
                  series: setData.series,
                  printedTotal: setData.printedTotal,
                  total: setData.total,
                  legalities: prepareJsonForPrisma(setData.legalities || {}),
                  ptcgoCode: setData.ptcgoCode,
                  releaseDate: setData.releaseDate,
                  updatedAt: setData.updatedAt,
                  images: prepareJsonForPrisma(setData.images || { symbol: "", logo: "" }),
                  lastUpdated: new Date(),
                },
                create: {
                  id: setData.id,
                  name: setData.name,
                  series: setData.series,
                  printedTotal: setData.printedTotal,
                  total: setData.total,
                  legalities: prepareJsonForPrisma(setData.legalities || {}),
                  ptcgoCode: setData.ptcgoCode,
                  releaseDate: setData.releaseDate,
                  updatedAt: setData.updatedAt,
                  images: prepareJsonForPrisma(setData.images || { symbol: "", logo: "" }),
                  lastUpdated: new Date(),
                },
              });
            } catch (setError) {
              console.error(`Error upserting set ${setData.id}:`, setError);
            }
          }
        }
      }

      return { success: true, count: sets.length };
    } catch (error) {
      console.error('Failed to sync sets:', error);
      return { success: false, error };
    }
  }

  // Modified to use proper rate limiting and batched operations
  async syncSetCards(setId: string): Promise<{ 
    success: boolean; 
    count?: number; 
    failed?: number;
    failedCardIds?: string[];
    error?: unknown 
  }> {
    // Check if set exists and if we need to update TCG prices
    try {
      const existingSet = await this.prisma.set.findUnique({
        where: { id: setId },
        select: { lastUpdated: true }
      });
      
      if (existingSet && existingSet.lastUpdated) {
        const lastUpdated = new Date(existingSet.lastUpdated);
        const now = new Date();
        const hoursSinceUpdate = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60));
        
        // For price updates, we'll update if the set was last updated more than 12 hours ago
        if (hoursSinceUpdate < 12) {
          console.log(`Set ${setId} was updated ${hoursSinceUpdate} hours ago.`);
          
          // Check if cards exist
          const cardCount = await this.prisma.card.count({
            where: { setId: setId }
          });
          
          if (cardCount > 0) {
            console.log(`Set ${setId} already has ${cardCount} cards and was updated in the last 12 hours. Skipping for now.`);
            return { success: true, count: cardCount, failed: 0, failedCardIds: [] };
          }
        } else {
          console.log(`Set ${setId} was last updated ${hoursSinceUpdate} hours ago, updating prices...`);
        }
      }
    } catch (error) {
      console.log(`Error checking existing set data, will proceed with update: ${error}`);
    }

    try {
      let page = 1;
      const pageSize = 250; // Increased page size for efficiency
      let hasMoreCards = true;
      let successCount = 0;
      const failedCards: string[] = [];
      let allCards: Card[] = [];

      console.log(`Starting sync for set: ${setId}`);

      // First, fetch all cards for this set and store them in memory
      while (hasMoreCards) {
        try {
          console.log(`Fetching page ${page} for set ${setId}...`);
          const query = `set.id:${setId}`;
          const cardsResponse = await this.getCards({ q: query, page, pageSize });
          const cards = cardsResponse.data;
          
          if (cards.length === 0) {
            hasMoreCards = false;
            continue;
          }
          
          allCards = [...allCards, ...cards];
          
          if (cards.length < pageSize) {
            hasMoreCards = false;
          } else {
            page++;
          }
        } catch (pageError) {
          console.error(`Error fetching page ${page} for set ${setId}:`, pageError);
          
          if (pageError instanceof Error && pageError.message.includes('429')) {
            // Handle rate limiting - wait and retry the SAME page
            console.log(`Rate limit hit on page ${page}. Waiting and retrying...`);
            await this.sleep(5000);
            // Don't increment page as we want to retry this page
          } else {
            // Only increment for other errors
            page++;
          }
          
          if (page > 10) {
            console.error(`Too many errors, stopping fetch for set ${setId}`);
            hasMoreCards = false;
          }
        }
      }
      
      console.log(`Fetched total of ${allCards.length} cards for set ${setId}`);
      
      // For incremental updates, we actually need to update all cards
      // because TCG prices change frequently
      const cardsToUpdate = allCards;
      console.log(`Processing ${cardsToUpdate.length} cards for price updates for set ${setId}`);
      
      // Now process cards in controlled batch sizes
      const cardBatchSize = CARD_BATCH_SIZE;
      for (let i = 0; i < cardsToUpdate.length; i += cardBatchSize) {
        const cardBatch = cardsToUpdate.slice(i, i + cardBatchSize);
        console.log(`Processing cards ${i+1}-${i+cardBatch.length} of ${cardsToUpdate.length} for set ${setId}`);
        
        // Process cards in parallel with Promise.all
        const cardPromises = cardBatch.map(async (cardData) => {
          try {
            const tcgPlayerData = cardData.tcgplayer;
            
            // Check if card already exists
            const existingCard = await this.prisma.card.findUnique({
              where: { id: cardData.id },
              select: { id: true }
            });
            
            if (existingCard) {
              // If card exists, only update TCGPlayer data to minimize writes
              await this.prisma.card.update({
                where: { id: cardData.id },
                data: {
                  tcgplayer: prepareJsonForPrisma(tcgPlayerData || {}),
                  lastUpdated: new Date(),
                }
              });
            } else {
              // If card doesn't exist, create it with all fields
              await this.prisma.card.create({
                data: {
                  id: cardData.id,
                  name: cardData.name,
                  supertype: cardData.supertype,
                  subtypes: cardData.subtypes || [],
                  hp: cardData.hp,
                  types: cardData.types || [],
                  setId: cardData.set.id,
                  setName: cardData.set.name,
                  number: cardData.number,
                  artist: cardData.artist,
                  rarity: cardData.rarity || 'Unknown',
                  nationalPokedexNumbers: cardData.nationalPokedexNumbers || [],
                  images: prepareJsonForPrisma(cardData.images),
                  tcgplayer: prepareJsonForPrisma(tcgPlayerData || {}),
                  lastUpdated: new Date(),
                }
              });
            }

            // Skip price history for cards without price data
            if (tcgPlayerData?.prices) {
              try {
                const priceData: PriceHistoryRecord = {
                  cardId: cardData.id,
                  date: new Date(),
                  normal: tcgPlayerData.prices.normal?.market || null,
                  holofoil: tcgPlayerData.prices.holofoil?.market || null,
                  reverseHolofoil: tcgPlayerData.prices.reverseHolofoil?.market || null,
                  firstEdition: tcgPlayerData.prices['1stEditionHolofoil']?.market || null,
                };
                
                // Directly insert the price history record
                await this.prisma.priceHistory.create({ data: priceData });
              } catch (priceError) {
                const errorMsg = priceError instanceof Error ? priceError.message : String(priceError);
                if (!errorMsg.includes('Unique constraint failed')) {
                  console.warn(`Warning: Error creating price history for card ${cardData.id}`);
                }
              }
            }
            
            return { success: true, id: cardData.id };
          } catch (cardError) {
            console.error(`Error processing card ${cardData.id}:`, cardError);
            return { success: false, id: cardData.id };
          }
        });
        
        // Wait for batch to complete
        const results = await Promise.all(cardPromises);
        
        // Count success and failures
        const successes = results.filter(r => r.success);
        const failures = results.filter(r => !r.success);
        
        successCount += successes.length;
        failedCards.push(...failures.map(f => f.id));
        
        console.log(`Batch completed. Success: ${successes.length}, Failed: ${failures.length}`);
      }
      
      return { 
        success: true, 
        count: successCount,
        failed: failedCards.length,
        failedCardIds: failedCards
      };
    } catch (error) {
      console.error(`Failed to sync cards from set ${setId}:`, error);
      return { success: false, error };
    }
  }
}

// Process sets in parallel optimized for MongoDB M1
async function processSetsInParallel(
  sets: { id: string; name: string }[], 
  pokemonTcgService: PokemonTcgService,
  concurrentSets: number
): Promise<{ 
  successCount: number; 
  failCount: number; 
  totalCardsCount: number 
}> {
  // Prioritize newer sets first as they're more likely to be accessed
  const prioritizedSets = [...sets].sort((a, b) => {
    // Assume newer sets have higher IDs (common in TCG API)
    return b.id.localeCompare(a.id);
  });
  
  let successCount = 0;
  let failCount = 0;
  let totalCardsCount = 0;
  
  for (let i = 0; i < prioritizedSets.length; i += concurrentSets) {
    const batchSets = prioritizedSets.slice(i, i + concurrentSets);
    const progress = Math.round((i / prioritizedSets.length) * 100);
    
    console.log(`\n[${progress}%] Processing sets ${i+1}-${i+batchSets.length}/${prioritizedSets.length}`);
    
    const setPromises = batchSets.map(async (set, index) => {
      console.log(`Starting sync for set: ${set.name} (${set.id})`);
      
      try {
        const setResult = await pokemonTcgService.syncSetCards(set.id);
        
        if (setResult.success) {
          console.log(`✓ Success: Synced ${setResult.count} cards for ${set.name}`);
          
          if (setResult.failed && setResult.failed > 0) {
            console.warn(`⚠ Warning: ${setResult.failed} cards failed to sync`);
          }
          
          return { 
            success: true, 
            id: set.id, 
            name: set.name, 
            cardsCount: setResult.count || 0 
          };
        } else {
          console.error(`✗ Error: Failed to sync cards for set ${set.id}`);
          if (setResult.error) {
            console.error(`  Error details: ${setResult.error}`);
          }
          
          return { 
            success: false, 
            id: set.id, 
            name: set.name, 
            cardsCount: 0 
          };
        }
      } catch (error) {
        console.error(`✗ Exception while syncing set ${set.id}:`, error);
        return { 
          success: false, 
          id: set.id, 
          name: set.name, 
          cardsCount: 0 
        };
      }
    });
    
    const results = await Promise.all(setPromises);
    
    // Process results
    for (const result of results) {
      if (result.success) {
        successCount++;
        totalCardsCount += result.cardsCount;
      } else {
        failCount++;
      }
    }
    
    // Calculate progress
    const setsProcessed = Math.min(i + concurrentSets, prioritizedSets.length);
    const percentComplete = Math.round((setsProcessed / prioritizedSets.length) * 100);
    console.log(`Progress: ${percentComplete}% complete (${setsProcessed}/${prioritizedSets.length} sets)`);
  }
  
  return { successCount, failCount, totalCardsCount };
}

// Main script execution
async function syncAllSetsAndCards() {
  // Initialize Prisma client with optimized connection for MongoDB M1
  const prisma = new PrismaClient({
    log: ['warn', 'error'],
    // Optimize connection pool for MongoDB M1
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  // Create a service instance with the API key from environment variables
  const apiKey = process.env.POKEMON_TCG_API_KEY || '';
  const pokemonTcgService = new PokemonTcgService(apiKey, prisma);
  
  console.log("==== Pokemon TCG Optimized Comprehensive Sync ====");
  console.log("Syncing all sets and their cards with improved performance");
  console.log(`API Key: ${apiKey ? 'Present' : 'Not present'}`);
  console.log(`MongoDB M1 Tier Optimized Configuration`);
  console.log(`Rate limits: ${RATE_LIMIT_REQUESTS}/day, ${REQUESTS_PER_MINUTE_LIMIT || 'No'} per minute limit`);
  console.log(`Concurrent set processing: ${CONCURRENT_SET_PROCESSING}`);
  console.log(`Card batch size: ${CARD_BATCH_SIZE}`);
  console.log(`Database batch size: ${DB_BATCH_SIZE}`);
  console.log("=================================================\n");
  
  const startTime = Date.now();
  
  try {
    // Step 1: Sync all sets
    console.log("Step 1: Syncing all sets metadata...");
    const setsResult = await pokemonTcgService.syncSets();
    
    if (!setsResult.success) {
      console.error("Failed to sync sets:", setsResult.error);
      return;
    }
    
    console.log(`Successfully synced ${setsResult.count} sets`);
    
    // Step 2: Get all sets
    console.log("\nStep 2: Fetching sets from database...");
    const sets = await prisma.set.findMany({
      select: { id: true, name: true },
      orderBy: { releaseDate: 'desc' }
    });
    
    console.log(`Found ${sets.length} sets to process`);
    
    // Step 3: Sync cards for each set in parallel
    console.log("\nStep 3: Syncing cards for each set with parallelization...");
    
    const results = await processSetsInParallel(
      sets, 
      pokemonTcgService, 
      CONCURRENT_SET_PROCESSING
    );
    
    // Step 4: Show summary
    const durationMs = Date.now() - startTime;
    const durationMinutes = Math.round(durationMs / 60000);
    const durationHours = (durationMinutes / 60).toFixed(1);
    
    console.log("\n==== Sync Complete ====");
    console.log(`Total sets processed: ${sets.length}`);
    console.log(`Successful sets: ${results.successCount}`);
    console.log(`Failed sets: ${results.failCount}`);
    console.log(`Total cards synced: ${results.totalCardsCount}`);
    console.log(`Duration: ${durationMinutes} minutes (${durationHours} hours)`);
    console.log("======================");
    
  } catch (error) {
    console.error("Error in comprehensive sync:", error);
  } finally {
    await prisma.$disconnect();
    exit(0);
  }
}

// Run the script
syncAllSetsAndCards().catch(error => {
  console.error("Unhandled error in script:", error);
  exit(1);
});