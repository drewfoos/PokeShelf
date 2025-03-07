// scripts/standalone-sync.ts
import { PrismaClient, Prisma } from '@prisma/client';
import dotenv from 'dotenv';
import { exit } from 'process';

// Load environment variables
dotenv.config();

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

// Pokemon TCG Service class
class PokemonTcgService {
  private baseUrl: string;
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;
  private prisma: PrismaClient;

  constructor(apiKey: string, prisma: PrismaClient) {
    this.baseUrl = 'https://api.pokemontcg.io/v2';
    this.apiKey = apiKey;
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.prisma = prisma;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(
    endpoint: string,
    params: Record<string, unknown> = {},
    retries = this.maxRetries
  ): Promise<unknown> {
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
      
      const batchSize = 50;
      for (let i = 0; i < sets.length; i += batchSize) {
        const batch = sets.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sets.length/batchSize)}...`);
        
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
          } catch (error) {
            console.error(`Error upserting set ${setData.id}:`, error);
          }
        }
        
        if (i + batchSize < sets.length) {
          await this.sleep(500);
        }
      }

      return { success: true, count: sets.length };
    } catch (error) {
      console.error('Failed to sync sets:', error);
      return { success: false, error };
    }
  }

  async syncSetCards(setId: string): Promise<{ 
    success: boolean; 
    count?: number; 
    failed?: number;
    failedCardIds?: string[];
    error?: unknown 
  }> {
    try {
      let page = 1;
      const pageSize = 50;
      let hasMoreCards = true;
      let successCount = 0;
      const failedCards: string[] = [];

      console.log(`Starting sync for set: ${setId}`);

      while (hasMoreCards) {
        if (page > 1) {
          await this.sleep(2000);
        }
        
        try {
          console.log(`Fetching page ${page} for set ${setId}...`);
          const query = `set.id:${setId}`;
          const cardsResponse = await this.getCards({ q: query, page, pageSize });
          const cards = cardsResponse.data;
          
          if (cards.length === 0) {
            hasMoreCards = false;
            continue;
          }
          
          const cardBatchSize = 10;
          for (let i = 0; i < cards.length; i += cardBatchSize) {
            const cardBatch = cards.slice(i, i + cardBatchSize);
            
            for (const cardData of cardBatch) {
              try {
                if (i > 0 && i % 5 === 0) {
                  await this.sleep(200);
                }

                const tcgPlayerData = cardData.tcgplayer;
                
                await this.prisma.card.upsert({
                  where: { id: cardData.id },
                  update: {
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
                  },
                  create: {
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
                  },
                });

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
                    
                    await this.prisma.priceHistory.create({ data: priceData });
                  } catch (priceError) {
                    const errorMsg = priceError instanceof Error ? priceError.message : String(priceError);
                    if (!errorMsg.includes('Unique constraint failed')) {
                      console.warn(`Warning: Error creating price history for card ${cardData.id}`);
                    }
                  }
                }
                
                successCount++;
              } catch (cardError) {
                console.error(`Error processing card ${cardData.id}:`, cardError);
                failedCards.push(cardData.id);
              }
            }
          }
          
          if (cards.length < pageSize) {
            hasMoreCards = false;
          } else {
            page++;
          }
        } catch (pageError) {
          console.error(`Error processing page ${page} for set ${setId}:`, pageError);
          
          if (pageError instanceof Error && pageError.message.includes('429')) {
            await this.sleep(5000);
          } else {
            page++;
          }
          
          if (page > 10) {
            console.error(`Too many errors, stopping sync for set ${setId}`);
            hasMoreCards = false;
          }
        }
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

// Main script execution
async function syncAllSetsAndCards() {
  // Initialize Prisma client
  const prisma = new PrismaClient();
  
  // Create a service instance with the API key from environment variables
  const apiKey = process.env.POKEMON_TCG_API_KEY || '';
  const pokemonTcgService = new PokemonTcgService(apiKey, prisma);
  
  console.log("==== Pokemon TCG Comprehensive Sync ====");
  console.log("Syncing all sets and their cards");
  console.log("This may take a long time depending on the number of sets");
  console.log("======================================\n");
  
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
    
    // Step 3: Sync cards for each set
    console.log("\nStep 3: Syncing cards for each set...");
    
    let successCount = 0;
    let failCount = 0;
    let totalCardsCount = 0;
    
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      const progress = Math.round((i / sets.length) * 100);
      
      console.log(`\n[${progress}%] Syncing set ${i+1}/${sets.length}: ${set.name} (${set.id})`);
      
      try {
        const setResult = await pokemonTcgService.syncSetCards(set.id);
        
        if (setResult.success) {
          successCount++;
          totalCardsCount += (setResult.count || 0);
          console.log(`✓ Success: Synced ${setResult.count} cards`);
          
          if (setResult.failed && setResult.failed > 0) {
            console.warn(`⚠ Warning: ${setResult.failed} cards failed to sync`);
          }
        } else {
          failCount++;
          console.error(`✗ Error: Failed to sync cards for set ${set.id}`);
          if (setResult.error) {
            console.error(`  Error details: ${setResult.error}`);
          }
        }
      } catch (error) {
        failCount++;
        console.error(`✗ Exception while syncing set ${set.id}:`, error);
      }
      
      // Calculate and show ETA
      if (i > 0) {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const avgTimePerSet = elapsedSeconds / (i + 1);
        const setsRemaining = sets.length - (i + 1);
        const etaSeconds = Math.round(avgTimePerSet * setsRemaining);
        
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
        
        console.log(`ETA: ${etaString} remaining for ${setsRemaining} sets`);
      }
    }
    
    // Step 4: Show summary
    const durationMs = Date.now() - startTime;
    const durationMinutes = Math.round(durationMs / 60000);
    const durationHours = (durationMinutes / 60).toFixed(1);
    
    console.log("\n==== Sync Complete ====");
    console.log(`Total sets processed: ${sets.length}`);
    console.log(`Successful sets: ${successCount}`);
    console.log(`Failed sets: ${failCount}`);
    console.log(`Total cards synced: ${totalCardsCount}`);
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