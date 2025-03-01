// lib/services/pokemonTcgService.ts
import prisma from '../prisma';

interface PaginationOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
}

interface QueryOptions extends PaginationOptions {
  q?: string;
  select?: string;
  [key: string]: unknown; // allow arbitrary string keys
}

// --- Define interfaces for API responses ---

export interface PokemonSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities?: Record<string, unknown>;
  ptcgoCode?: string;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}

interface PokemonSetResponse {
  data: PokemonSet[];
}

interface PokemonSetSingleResponse {
  data: PokemonSet;
}

export interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  hp?: string;
  types: string[];
  set: {
    id: string;
    name: string;
  };
  number: string;
  artist?: string;
  rarity: string;
  nationalPokedexNumbers: number[];
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    prices?: {
      normal?: { market: number };
      holofoil?: { market: number };
      reverseHolofoil?: { market: number };
      '1stEditionHolofoil'?: { market: number };
    };
  };
}

interface PokemonCardResponse {
  data: PokemonCard[];
}

// Fallback data for newer sets that might not yet be in the API
// Only used when a set isn't found in the API
const FALLBACK_SETS: Record<string, Partial<PokemonSet>> = {
  'pevo': {
    name: 'Prismatic Evolutions',
    series: 'Scarlet & Violet',
    releaseDate: '2025/01/17'
  },
  'ssp': {
    name: 'Surging Sparks',
    series: 'Scarlet & Violet',
    releaseDate: '2024/11/08'
  },
  'scr': {
    name: 'Stellar Crown',
    series: 'Scarlet & Violet',
    releaseDate: '2024/09/13'
  },
  'sfa': {
    name: 'Shrouded Fable',
    series: 'Scarlet & Violet',
    releaseDate: '2024/08/02'
  },
  'tmq': {
    name: 'Twilight Masquerade',
    series: 'Scarlet & Violet',
    releaseDate: '2024/05/24' 
  },
  'tfo': {
    name: 'Temporal Forces',
    series: 'Scarlet & Violet',
    releaseDate: '2024/03/22'
  }
};

/**
 * Service for interacting with the Pokémon TCG API and managing card data
 */
export class PokemonTcgService {
  private baseUrl: string;
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(apiKey: string) {
    this.baseUrl = 'https://api.pokemontcg.io/v2';
    this.apiKey = apiKey;
    this.maxRetries = 5; // Increase max retries for better reliability
    this.retryDelay = 2500; // Slightly longer delay between retries
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make a request to the Pokémon TCG API with enhanced rate limit handling
   */
  private async makeRequest(
    endpoint: string,
    params: Record<string, unknown> = {},
    retries = this.maxRetries
  ): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => {
      const value = params[key];
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

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        // Get retry-after header if available, otherwise use exponential backoff
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelay * (this.maxRetries - retries + 1);
        
        console.log(`Rate limit reached. Waiting for ${waitTime/1000} seconds before retrying...`);
        await this.sleep(waitTime);
        return this.makeRequest(endpoint, params, retries - 1);
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = `API Error: ${errorData.error?.message || response.statusText}`;
        } catch {
          errorMessage = `API Error: ${errorText || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response received from server');
      }

      try {
        return JSON.parse(text);
      } catch {
        console.error('Failed to parse response as JSON:', text);
        throw new Error('Failed to parse API response');
      }
    } catch (error: unknown) {
      if (retries > 0) {
        // Implement exponential backoff
        const backoffTime = this.retryDelay * (this.maxRetries - retries + 1);
        console.log(`Request failed. Retrying in ${backoffTime/1000}s... (${retries} attempts left)`);
        await this.sleep(backoffTime);
        return this.makeRequest(endpoint, params, retries - 1);
      }
      console.error('API Request failed after all retries:', error);
      throw error;
    }
  }

  /**
   * Get all card sets
   */
  async getSets(options: QueryOptions = {}): Promise<PokemonSetResponse> {
    const response = await this.makeRequest('/sets', { 
      ...options,
      orderBy: options.orderBy || '-releaseDate' // Default to sorting by newest first
    });
    return response as PokemonSetResponse;
  }

  /**
   * Get a single set by ID
   */
  async getSet(id: string): Promise<PokemonSetSingleResponse> {
    const response = await this.makeRequest(`/sets/${id}`);
    return response as PokemonSetSingleResponse;
  }

  /**
   * Get cards with optional filtering
   */
  async getCards(options: QueryOptions = {}): Promise<PokemonCardResponse> {
    const response = await this.makeRequest('/cards', options);
    return response as PokemonCardResponse;
  }

  /**
   * Get a single card by ID
   */
  async getCard(id: string): Promise<PokemonCard> {
    const response = await this.makeRequest(`/cards/${id}`);
    return (response as any).data;
  }

  /**
   * Search for cards using the query syntax
   */
  async searchCards(query: string, options: PaginationOptions = {}): Promise<PokemonCardResponse> {
    const response = await this.makeRequest('/cards', {
      ...options,
      q: query,
    });
    return response as PokemonCardResponse;
  }

  /**
   * Sync all sets to the database
   */
  async syncSets() {
    try {
      // Get all sets from the API with a larger page size to ensure we get everything
      const response = await this.getSets({ pageSize: 250 });
      const sets = response.data;

      console.log(`Syncing ${sets.length} sets to database...`);

      // Add missing sets from our fallback data if they're not in the API response
      const missingNewSets: PokemonSet[] = [];
      Object.entries(FALLBACK_SETS).forEach(([id, fallbackSet]) => {
        if (!sets.some(set => set.id === id)) {
          // Only add if not already in API response
          missingNewSets.push({
            id,
            name: fallbackSet.name || id,
            series: fallbackSet.series || 'Scarlet & Violet',
            printedTotal: 0, // Will be updated later when we sync cards
            total: 0,
            releaseDate: fallbackSet.releaseDate || '2025-01-01',
            updatedAt: new Date().toISOString(),
            images: {
              symbol: '',
              logo: ''
            }
          });
        }
      });

      if (missingNewSets.length > 0) {
        console.log(`Adding ${missingNewSets.length} new sets that aren't in the API yet...`);
        sets.push(...missingNewSets);
      }

      // Process sets in batches to prevent overloading the database
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
                legalities: setData.legalities as any,
                ptcgoCode: setData.ptcgoCode,
                releaseDate: setData.releaseDate,
                updatedAt: setData.updatedAt,
                images: setData.images as any,
                lastUpdated: new Date(),
              },
              create: {
                id: setData.id,
                name: setData.name,
                series: setData.series,
                printedTotal: setData.printedTotal,
                total: setData.total,
                legalities: setData.legalities as any,
                ptcgoCode: setData.ptcgoCode,
                releaseDate: setData.releaseDate,
                updatedAt: setData.updatedAt,
                images: setData.images as any,
                lastUpdated: new Date(),
              },
            });
          } catch (error) {
            console.error(`Error upserting set ${setData.id}:`, error);
            // Continue with next set despite error
          }
        }
        
        // Brief delay between batches
        if (i + batchSize < sets.length) {
          await this.sleep(500);
        }
      }

      console.log('Sets sync completed successfully');
      return { success: true, count: sets.length };
    } catch (error: unknown) {
      console.error('Failed to sync sets:', error);
      return { success: false, error };
    }
  }

  /**
   * Check for and import any new sets
   */
  async syncNewSets() {
    try {
      const response = await this.getSets({ pageSize: 250 });
      const apiSets = response.data;

      // Add any recent sets from our fallback data if they're not in the API response
      Object.entries(FALLBACK_SETS).forEach(([id, fallbackSet]) => {
        if (!apiSets.some(set => set.id === id)) {
          apiSets.push({
            id,
            name: fallbackSet.name || id,
            series: fallbackSet.series || 'Scarlet & Violet',
            printedTotal: 0,
            total: 0,
            releaseDate: fallbackSet.releaseDate || '2025-01-01',
            updatedAt: new Date().toISOString(),
            images: {
              symbol: '',
              logo: ''
            }
          });
        }
      });

      const dbSets = await prisma.set.findMany({ select: { id: true } });
      const existingSetIds = new Set(dbSets.map(set => set.id));
      const newSets = apiSets.filter(set => !existingSetIds.has(set.id));

      if (newSets.length === 0) {
        console.log('No new sets to import');
        return { success: true, count: 0, newSets: [] };
      }

      console.log(`Found ${newSets.length} new sets to import`);
      const importedSets = [];

      for (const setData of newSets) {
        try {
          await prisma.set.create({
            data: {
              id: setData.id,
              name: setData.name,
              series: setData.series,
              printedTotal: setData.printedTotal,
              total: setData.total,
              legalities: setData.legalities as any,
              ptcgoCode: setData.ptcgoCode,
              releaseDate: setData.releaseDate,
              updatedAt: setData.updatedAt,
              images: setData.images as any,
              lastUpdated: new Date(),
            }
          });

          console.log(`Importing cards for new set: ${setData.name} (${setData.id})`);
          const result = await this.syncSetCards(setData.id);

          if (result.success) {
            importedSets.push({
              id: setData.id,
              name: setData.name,
              cardCount: result.count,
            });
          }
        } catch (error) {
          console.error(`Error creating set ${setData.id}:`, error);
          // Continue with next set despite error
        }

        // Add a delay between importing sets to avoid rate limits
        if (newSets.indexOf(setData) < newSets.length - 1) {
          console.log('Waiting before importing next set...');
          await this.sleep(10000);
        }
      }

      return {
        success: true,
        count: newSets.length,
        importedSets,
      };
    } catch (error: unknown) {
      console.error('Failed to sync new sets:', error);
      return { success: false, error };
    }
  }

  /**
   * Sync cards from a specific set to the database with improved reliability
   */
  async syncSetCards(setId: string) {
    try {
      let setData: PokemonSet;
      
      try {
        // Try to get set data from the API
        const setResponse = await this.getSet(setId);
        setData = setResponse.data;
      } catch (error) {
        // If the set isn't in the API (like a new set), create a fallback
        if (FALLBACK_SETS[setId]) {
          console.log(`Set ${setId} not found in API, using fallback data`);
          const fallback = FALLBACK_SETS[setId];
          setData = {
            id: setId,
            name: fallback.name || setId,
            series: fallback.series || 'Scarlet & Violet',
            printedTotal: 0,
            total: 0,
            releaseDate: fallback.releaseDate || '2025-01-01',
            updatedAt: new Date().toISOString(),
            images: {
              symbol: '',
              logo: ''
            }
          };
        } else {
          throw new Error(`Set with ID ${setId} not found and no fallback available`);
        }
      }

      const query = `set.id:${setId}`;
      let page = 1;
      const pageSize = 50; // Smaller page size for better reliability
      let hasMoreCards = true;
      let totalCards = 0;
      let successfullyProcessedCards = 0;
      const failedCards: string[] = [];

      console.log(`Starting sync for set: ${setData.name} (${setId})`);

      // Sync cards in pages with improved error handling
      while (hasMoreCards) {
        // Add delay between pages to avoid rate limits
        if (page > 1) {
          await this.sleep(2500);
        }
        
        try {
          console.log(`Fetching page ${page} for set ${setData.name}...`);
          const cardsResponse = await this.searchCards(query, { page, pageSize });
          const cards = cardsResponse.data;
          
          if (cards.length === 0) {
            console.log(`No cards found for set ${setData.name} on page ${page}`);
            hasMoreCards = false;
            continue;
          }
          
          console.log(`Processing ${cards.length} cards from set ${setData.name} (page ${page})...`);

          // Process cards in smaller batches for better reliability
          const cardBatchSize = 10;
          for (let i = 0; i < cards.length; i += cardBatchSize) {
            const cardBatch = cards.slice(i, i + cardBatchSize);
            
            // Process each card in the batch
            for (const cardData of cardBatch) {
              try {
                // Add micro-delay every few cards
                if (i > 0 && i % 5 === 0) {
                  await this.sleep(200);
                }

                await prisma.card.upsert({
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
                    images: cardData.images as any,
                    tcgplayer: cardData.tcgplayer as any,
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
                    images: cardData.images as any,
                    tcgplayer: cardData.tcgplayer as any,
                    lastUpdated: new Date(),
                  },
                });

                // Update price history if available
                if (cardData.tcgplayer?.prices) {
                  try {
                    await prisma.priceHistory.create({
                      data: {
                        cardId: cardData.id,
                        date: new Date(),
                        normal: cardData.tcgplayer.prices.normal?.market || null,
                        holofoil: cardData.tcgplayer.prices.holofoil?.market || null,
                        reverseHolofoil: cardData.tcgplayer.prices.reverseHolofoil?.market || null,
                        firstEdition: cardData.tcgplayer.prices['1stEditionHolofoil']?.market || null,
                      },
                    });
                  } catch (priceError) {
                    // Only log price history errors but continue processing
                    if (priceError instanceof Error && !priceError.message.includes('Unique constraint failed')) {
                      console.warn(`Warning: Error creating price history for card ${cardData.id}:`, priceError);
                    }
                  }
                }
                
                successfullyProcessedCards++;
              } catch (cardError) {
                console.error(`Error processing card ${cardData.id}:`, cardError);
                failedCards.push(cardData.id);
                // Continue with next card despite error
              }
            }
            
            // Add delay between card batches
            if (i + cardBatchSize < cards.length) {
              await this.sleep(500);
            }
          }

          totalCards += cards.length;
          
          // Check if we have more pages
          if (cards.length < pageSize) {
            hasMoreCards = false;
          } else {
            page++;
          }
          
          console.log(`Processed ${totalCards} cards so far from set ${setData.name}`);
        } catch (pageError) {
          console.error(`Error processing page ${page} for set ${setId}:`, pageError);
          
          // Retry this page after a longer delay
          await this.sleep(5000);
          
          // Maximum 3 retries per page
          if (pageError instanceof Error && pageError.message.includes('rate limit') && page > 3) {
            console.log(`Too many retries for page ${page}, skipping to next page`);
            page++;
          }
          
          // If we hit too many errors, exit the loop
          if (page > 10) {
            console.error(`Too many errors, stopping sync for set ${setId}`);
            hasMoreCards = false;
          }
        }
      }

      // Update the set's total card count in our database if needed
      if (successfullyProcessedCards > 0 && (!setData.printedTotal || setData.printedTotal === 0)) {
        await prisma.set.update({
          where: { id: setId },
          data: {
            printedTotal: successfullyProcessedCards,
            total: successfullyProcessedCards
          }
        });
      }

      console.log(`Completed sync of ${totalCards} cards from set ${setData.name}`);
      console.log(`Successfully processed: ${successfullyProcessedCards}, Failed: ${failedCards.length}`);
      
      return { 
        success: true, 
        count: successfullyProcessedCards,
        total: totalCards,
        failed: failedCards.length,
        failedCardIds: failedCards
      };
    } catch (error: unknown) {
      console.error(`Failed to sync cards from set ${setId}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Update prices for specified cards (or all cards if no IDs provided)
   */
  async updateCardPrices(cardIds: string[] = []): Promise<{ success: boolean; count?: number; error?: unknown }> {
    try {
      if (cardIds.length > 0) {
        const batchSize = 25; // Smaller batch size for better reliability
        const batches: string[][] = [];
        
        for (let i = 0; i < cardIds.length; i += batchSize) {
          batches.push(cardIds.slice(i, i + batchSize));
        }
        
        console.log(`Updating prices for ${cardIds.length} specific cards in ${batches.length} batches`);
        let updatedCount = 0;

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const query = batch.map(id => `id:${id}`).join(' OR ');
          
          // Add longer delay between batches for better reliability
          if (i > 0) {
            await this.sleep(3000);
          }
          
          console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} cards)...`);
          
          try {
            const cardsResponse = await this.getCards({ q: query, pageSize: batchSize });
            const cards = cardsResponse.data;

            // Process each card in the batch
            for (const card of cards) {
              try {
                if (card.tcgplayer?.prices) {
                  // Create price history record
                  await prisma.priceHistory.create({
                    data: {
                      cardId: card.id,
                      date: new Date(),
                      normal: card.tcgplayer.prices.normal?.market || null,
                      holofoil: card.tcgplayer.prices.holofoil?.market || null,
                      reverseHolofoil: card.tcgplayer.prices.reverseHolofoil?.market || null,
                      firstEdition: card.tcgplayer.prices['1stEditionHolofoil']?.market || null,
                    },
                  });
                  
                  // Update the card with the latest price data
                  await prisma.card.update({
                    where: { id: card.id },
                    data: {
                      tcgplayer: card.tcgplayer as any,
                      lastUpdated: new Date(),
                    },
                  });
                  
                  updatedCount++;
                } else {
                  console.log(`No price data available for card ${card.id}`);
                }
              } catch (cardError) {
                if (cardError instanceof Error && !cardError.message.includes('Unique constraint failed')) {
                  console.error(`Error updating price for card ${card.id}:`, cardError);
                }
                // Continue with next card despite error
              }
            }
          } catch (batchError) {
            console.error(`Error processing batch ${i + 1}:`, batchError);
            // Continue with next batch despite error
          }
        }

        return { success: true, count: updatedCount };
      } else {
        // If no card IDs provided, update prices for all cards in user collections
        const userCards = await prisma.userCard.findMany({
          select: { cardId: true },
          distinct: ['cardId'],
        });
        
        const uniqueCardIds = userCards.map(uc => uc.cardId);
        console.log(`Found ${uniqueCardIds.length} unique cards in user collections`);

        if (uniqueCardIds.length === 0) {
          return { success: true, count: 0 };
        }
        
        return this.updateCardPrices(uniqueCardIds);
      }
    } catch (error: unknown) {
      console.error('Failed to update card prices:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Get types, subtypes, supertypes, and rarities
   */
  async getTypes() {
    return this.makeRequest('/types');
  }

  async getSubtypes() {
    return this.makeRequest('/subtypes');
  }

  async getSupertypes() {
    return this.makeRequest('/supertypes');
  }

  async getRarities() {
    return this.makeRequest('/rarities');
  }
  
  /**
   * Sync specific recent/popular sets in optimized batches
   */
  async syncBatchSets(setIds: string[]) {
    const results = [];
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
            name: FALLBACK_SETS[setId]?.name || setId,
            success: true,
            count: result.count
          });
        } else {
          failCount++;
          results.push({
            id: setId,
            name: FALLBACK_SETS[setId]?.name || setId,
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        failCount++;
        results.push({
          id: setId,
          name: FALLBACK_SETS[setId]?.name || setId,
          success: false,
          error
        });
      }
      
      // Add delay between sets
      if (i < setIds.length - 1) {
        const delayTime = 5000;
        console.log(`Waiting ${delayTime/1000} seconds before syncing next set...`);
        await this.sleep(delayTime);
      }
    }
    
    return {
      success: failCount === 0,
      total: setIds.length,
      succeeded: successCount,
      failed: failCount,
      results
    };
  }
}

// Create a singleton instance with the API key
const apiKey = process.env.POKEMON_TCG_API_KEY || '';
export const pokemonTcgService = new PokemonTcgService(apiKey);

export default pokemonTcgService;