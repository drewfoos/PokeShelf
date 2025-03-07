// lib/services/pokemonTcgService.ts
import prisma from '../prisma';
import { 
  Card, 
  PriceHistoryRecord, 
  TCGPlayerData,
  SetSyncResult,
  prepareJsonForPrisma
} from '@/types';
// Import Set as PokemonSet to avoid conflict with the global Set
import type { Set as PokemonSet } from '@/types';

/**
 * Type for card with set information
 */
interface CardWithSet extends Card {
  set: {
    id: string;
    name: string;
  };
}

/**
 * Simplified service for interacting with the Pokémon TCG API
 * Focused on admin functionality for syncing cards and prices
 */
export class PokemonTcgService {
  private baseUrl: string;
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(apiKey: string) {
    this.baseUrl = 'https://api.pokemontcg.io/v2';
    this.apiKey = apiKey;
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * Sleep utility function for rate limit handling
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make a request to the Pokémon TCG API with rate limit handling
   */
  private async makeRequest(
    endpoint: string,
    params: Record<string, unknown> = {},
    retries = this.maxRetries
  ): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    // Add API key to headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }

    try {
      console.log(`Making request to: ${url.toString()}`);
      const response = await fetch(url.toString(), { headers });

      // Handle rate limiting with exponential backoff
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

  /**
   * Get all sets from the API
   */
  async getSets(options: { pageSize?: number, orderBy?: string } = {}): Promise<{ data: PokemonSet[] }> {
    const response = await this.makeRequest('/sets', { 
      ...options,
      orderBy: options.orderBy || '-releaseDate' // Newest first
    });
    return response as { data: PokemonSet[] };
  }

  /**
   * Get cards from a specific set
   */
  async getCards(options: { q?: string, page?: number, pageSize?: number } = {}): Promise<{ data: Card[] }> {
    const response = await this.makeRequest('/cards', options);
    return response as { data: Card[] };
  }

  /**
   * Sync all sets to the database
   */
  async syncSets(): Promise<{ success: boolean; count?: number; error?: unknown }> {
    try {
      // Get all sets from the API
      const response = await this.getSets({ pageSize: 250 });
      const sets = response.data;

      console.log(`Syncing ${sets.length} sets to database...`);
      
      // Process sets in batches
      const batchSize = 50;
      for (let i = 0; i < sets.length; i += batchSize) {
        const batch = sets.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sets.length/batchSize)}...`);
        
        // Process each set in the batch
        for (const setData of batch) {
          try {
            await prisma.set.upsert({
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
        
        // Add delay between batches
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

  /**
   * Sync cards from a specific set
   */
  async syncSetCards(setId: string): Promise<{ 
    success: boolean; 
    count?: number; 
    failed?: number;
    failedCardIds?: string[];
    error?: unknown 
  }> {
    try {
      // Set up tracking variables
      let page = 1;
      const pageSize = 50;
      let hasMoreCards = true;
      let successCount = 0;
      const failedCards: string[] = [];

      console.log(`Starting sync for set: ${setId}`);

      // Paginate through all cards in the set
      while (hasMoreCards) {
        // Delay between pages for rate limiting
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
          
          // Process cards in smaller batches
          const cardBatchSize = 10;
          for (let i = 0; i < cards.length; i += cardBatchSize) {
            const cardBatch = cards.slice(i, i + cardBatchSize);
            
            for (const cardData of cardBatch) {
              try {
                // Add micro-delay to prevent database overload
                if (i > 0 && i % 5 === 0) {
                  await this.sleep(200);
                }

                const tcgPlayerData = cardData.tcgplayer as TCGPlayerData;

                // Cast to our defined interface
                const cardWithSet = cardData as unknown as CardWithSet;
                
                // Upsert the card
                await prisma.card.upsert({
                  where: { id: cardData.id },
                  update: {
                    name: cardData.name,
                    supertype: cardData.supertype,
                    subtypes: cardData.subtypes || [],
                    hp: cardData.hp,
                    types: cardData.types || [],
                    setId: cardWithSet.set.id,
                    setName: cardWithSet.set.name,
                    number: cardData.number,
                    artist: cardData.artist,
                    rarity: cardData.rarity || 'Unknown',
                    nationalPokedexNumbers: cardData.nationalPokedexNumbers || [],
                    images: prepareJsonForPrisma(cardData.images),
                    tcgplayer: prepareJsonForPrisma(tcgPlayerData),
                    lastUpdated: new Date(),
                  },
                  create: {
                    id: cardData.id,
                    name: cardData.name,
                    supertype: cardData.supertype,
                    subtypes: cardData.subtypes || [],
                    hp: cardData.hp,
                    types: cardData.types || [],
                    setId: cardWithSet.set.id,
                    setName: cardWithSet.set.name,
                    number: cardData.number,
                    artist: cardData.artist,
                    rarity: cardData.rarity || 'Unknown',
                    nationalPokedexNumbers: cardData.nationalPokedexNumbers || [],
                    images: prepareJsonForPrisma(cardData.images),
                    tcgplayer: prepareJsonForPrisma(tcgPlayerData),
                    lastUpdated: new Date(),
                  },
                });

                // Add price history if available
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
                    
                    await prisma.priceHistory.create({ data: priceData });
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
          
          // Check if we have more pages
          if (cards.length < pageSize) {
            hasMoreCards = false;
          } else {
            page++;
          }
        } catch (pageError) {
          console.error(`Error processing page ${page} for set ${setId}:`, pageError);
          
          // If rate limit error, retry after longer delay
          if (pageError instanceof Error && pageError.message.includes('429')) {
            await this.sleep(5000);
          } else {
            page++; // Skip problematic page after a few retries
          }
          
          // Limit total retries
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

  /**
   * Update prices for cards in user collections
   */
  async updateCardPrices(): Promise<{ success: boolean; count?: number; error?: unknown }> {
    try {
      // Get cards in user collections
      const userCards = await prisma.userCard.findMany({
        select: { cardId: true },
        distinct: ['cardId'],
      });
      
      const uniqueCardIds = userCards.map(uc => uc.cardId);
      console.log(`Found ${uniqueCardIds.length} unique cards in user collections`);

      // Group cards by set for efficient API usage
      const cardsBySet: Record<string, string[]> = {};
      for (const cardId of uniqueCardIds) {
        const setId = cardId.split('-')[0]; // Extract set ID from card ID
        if (!cardsBySet[setId]) {
          cardsBySet[setId] = [];
        }
        cardsBySet[setId].push(cardId);
      }

      console.log(`Grouped into ${Object.keys(cardsBySet).length} sets for efficient updates`);
      
      let updatedCount = 0;
      let processedSets = 0;
      
      // Process each set with appropriate delays
      for (const [setId, setCardIds] of Object.entries(cardsBySet)) {
        processedSets++;
        console.log(`Processing set ${processedSets}/${Object.keys(cardsBySet).length}: ${setId} (${setCardIds.length} cards)`);
        
        try {
          // Fetch all cards for this set at once
          const query = `set.id:${setId}`;
          const cardsResponse = await this.getCards({ q: query, pageSize: 250 });
          const cards = cardsResponse.data;
          
          // Match with cards in collection and update prices
          for (const card of cards) {
            if (setCardIds.includes(card.id) && card.tcgplayer?.prices) {
              try {
                // Create price history record
                const priceData: PriceHistoryRecord = {
                  cardId: card.id,
                  date: new Date(),
                  normal: card.tcgplayer.prices.normal?.market || null,
                  holofoil: card.tcgplayer.prices.holofoil?.market || null,
                  reverseHolofoil: card.tcgplayer.prices.reverseHolofoil?.market || null,
                  firstEdition: card.tcgplayer.prices['1stEditionHolofoil']?.market || null,
                };
                
                await prisma.priceHistory.create({ data: priceData });
                
                // Update card with latest price data
                await prisma.card.update({
                  where: { id: card.id },
                  data: {
                    tcgplayer: prepareJsonForPrisma(card.tcgplayer),
                    lastUpdated: new Date(),
                  },
                });
                
                updatedCount++;
              } catch (cardError) {
                const errorMsg = cardError instanceof Error ? cardError.message : String(cardError);
                if (!errorMsg.includes('Unique constraint failed')) {
                  console.error(`Error updating price for card ${card.id}:`, cardError);
                }
              }
            }
          }
          
          // Add delay between sets to respect rate limits
          if (processedSets < Object.keys(cardsBySet).length) {
            const delayTime = 3000; // 3 seconds between sets
            console.log(`Waiting ${delayTime/1000}s before next set...`);
            await this.sleep(delayTime);
          }
        } catch (setError) {
          console.error(`Error processing set ${setId}:`, setError);
          await this.sleep(5000); // Longer delay after error
        }
      }

      return { success: true, count: updatedCount };
    } catch (error) {
      console.error('Failed to update card prices:', error);
      return { success: false, error };
    }
  }

  /**
   * Sync multiple sets in a batch operation
   */
  async syncBatchSets(setIds: string[]): Promise<{
    success: boolean;
    results: SetSyncResult[];
  }> {
    const results: SetSyncResult[] = [];
    let successCount = 0;
    let failCount = 0;
    
    console.log(`Starting batch sync for ${setIds.length} sets...`);
    
    // First ensure all sets exist in the database
    await this.syncSets();
    
    for (let i = 0; i < setIds.length; i++) {
      const setId = setIds[i];
      console.log(`[${i+1}/${setIds.length}] Syncing set: ${setId}`);
      
      try {
        const result = await this.syncSetCards(setId);
        if (result.success) {
          successCount++;
          results.push({
            id: setId,
            count: result.count,
            success: true
          });
        } else {
          failCount++;
          results.push({
            id: setId,
            error: result.error,
            success: false
          });
        }
      } catch (error) {
        failCount++;
        results.push({
          id: setId,
          error,
          success: false
        });
      }
      
      // Add delay between sets
      if (i < setIds.length - 1) {
        const delayTime = 5000;
        console.log(`Waiting ${delayTime/1000}s before syncing next set...`);
        await this.sleep(delayTime);
      }
    }
    
    return {
      success: failCount === 0,
      results
    };
  }

  /**
   * Check for and sync new sets that were added to the API
   */
  async syncNewSets(): Promise<{ 
    success: boolean; 
    count?: number; 
    importedSets?: Array<{ id: string; name: string; cardCount: number }>;
    error?: unknown;
  }> {
    try {
      // Get all sets from the API
      const response = await this.getSets({ pageSize: 250 });
      const apiSets = response.data as PokemonSet[];

      // Get sets we already have
      const dbSets = await prisma.set.findMany({ select: { id: true } });
      const existingSetIds = new Set(dbSets.map(set => set.id));
      
      // Find sets in API that aren't in our database
      const newSets = apiSets.filter(set => !existingSetIds.has(set.id));

      if (newSets.length === 0) {
        console.log('No new sets to import');
        return { success: true, count: 0, importedSets: [] };
      }

      console.log(`Found ${newSets.length} new sets to import`);
      const importedSets = [];

      // Import each new set
      for (const setData of newSets) {
        try {
          // Add the set
          await prisma.set.create({
            data: {
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
            }
          });

          // Then sync its cards
          console.log(`Importing cards for new set: ${setData.name} (${setData.id})`);
          const result = await this.syncSetCards(setData.id);

          if (result.success) {
            importedSets.push({
              id: setData.id,
              name: setData.name,
              cardCount: result.count || 0,
            });
          }
          
          // Wait between sets to avoid rate limits
          await this.sleep(10000);
        } catch (error) {
          console.error(`Error creating set ${setData.id}:`, error);
        }
      }

      return {
        success: true,
        count: newSets.length,
        importedSets,
      };
    } catch (error) {
      console.error('Failed to sync new sets:', error);
      return { success: false, error };
    }
  }

  /**
   * Comprehensive sync method that syncs all sets and their cards
   */
  async syncSetsAndCards(): Promise<{
    success: boolean;
    setCount?: number;
    successfulSets?: number;
    failedSets?: number;
    totalCards?: number;
    phase?: string;
    progress?: number;
    sets?: Array<{
      id: string;
      name?: string;
      count?: number;
      error?: unknown;
      success?: boolean;
    }>;
    error?: unknown;
  }> {
    try {
      // First sync all sets to get the latest list
      console.log("Step 1: Syncing all sets metadata...");
      const setsResult = await this.syncSets();
      
      if (!setsResult.success) {
        return {
          success: false,
          error: setsResult.error || "Failed to sync sets",
          phase: "sets",
          progress: 0
        };
      }
      
      // Get all sets from the database
      const sets = await prisma.set.findMany({
        select: { id: true, name: true },
        orderBy: { releaseDate: 'desc' }
      });
      
      console.log(`Step 2: Syncing cards for ${sets.length} sets...`);
      
      const results = [];
      let successCount = 0;
      let failCount = 0;
      let totalCardsCount = 0;
      
      // Process each set (newest first)
      for (let i = 0; i < sets.length; i++) {
        const set = sets[i];
        const progress = Math.round((i / sets.length) * 100);
        
        console.log(`[${progress}%] Syncing cards for set ${i+1}/${sets.length}: ${set.name} (${set.id})`);
        
        try {
          const setResult = await this.syncSetCards(set.id);
          
          if (setResult.success) {
            successCount++;
            totalCardsCount += (setResult.count || 0);
            results.push({
              id: set.id,
              name: set.name,
              count: setResult.count,
              success: true
            });
          } else {
            failCount++;
            results.push({
              id: set.id,
              name: set.name,
              error: setResult.error,
              success: false
            });
          }
        } catch (error) {
          failCount++;
          results.push({
            id: set.id,
            name: set.name,
            error: error instanceof Error ? error.message : "Unknown error",
            success: false
          });
        }
        
        // Add delay between sets to respect API rate limits (longer for larger sets)
        await this.sleep(3000);
      }
      
      return {
        success: true,
        setCount: sets.length,
        successfulSets: successCount,
        failedSets: failCount,
        totalCards: totalCardsCount,
        phase: "complete",
        progress: 100,
        sets: results
      };
    } catch (error) {
      console.error("Error in comprehensive sync:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        phase: "unknown",
        progress: 0
      };
    }
  }
}

// Create a singleton instance with the API key
const apiKey = process.env.POKEMON_TCG_API_KEY || '';
export const pokemonTcgService = new PokemonTcgService(apiKey);

export default pokemonTcgService;