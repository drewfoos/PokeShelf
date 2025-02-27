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
}

/**
 * Service for interacting with the Pokémon TCG API and managing card data
 */
export class PokemonTcgService {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = 'https://api.pokemontcg.io/v2';
    this.apiKey = apiKey;
  }

  /**
   * Make a request to the Pokémon TCG API with rate limit awareness
   */
  private async makeRequest(endpoint: string, params: Record<string, any> = {}, retries = 3): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key if provided
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }

    try {
      const response = await fetch(url.toString(), { headers });
      
      // Handle rate limiting (status 429)
      if (response.status === 429) {
        console.log('Rate limit reached. Waiting for 2 seconds before retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.makeRequest(endpoint, params, retries - 1);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = `API Error: ${errorData.error?.message || response.statusText}`;
        } catch (parseError: any) {
          errorMessage = `API Error: ${errorText || response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Process the response
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response received from server');
      }
      
      try {
        return JSON.parse(text);
      } catch (parseError: any) {
        console.error('Failed to parse response as JSON:', text);
        throw new Error(`Failed to parse API response: ${parseError.message}`);
      }
      
    } catch (error: any) {
      if (retries > 0) {
        console.log(`Request failed. Retrying... (${retries} attempts left)`);
        // Wait longer between retries
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.makeRequest(endpoint, params, retries - 1);
      }
      console.error('API Request failed:', error);
      throw error;
    }
  }

  /**
   * Get all card sets
   */
  async getSets(options: QueryOptions = {}) {
    return this.makeRequest('/sets', options);
  }

  /**
   * Get a single set by ID
   */
  async getSet(id: string) {
    return this.makeRequest(`/sets/${id}`);
  }

  /**
   * Get cards with optional filtering
   */
  async getCards(options: QueryOptions = {}) {
    return this.makeRequest('/cards', options);
  }

  /**
   * Get a single card by ID
   */
  async getCard(id: string) {
    return this.makeRequest(`/cards/${id}`);
  }

  /**
   * Search for cards using the query syntax
   */
  async searchCards(query: string, options: PaginationOptions = {}) {
    return this.makeRequest('/cards', { 
      ...options,
      q: query 
    });
  }

  /**
   * Sync all sets to the database
   */
  async syncSets() {
    try {
      const response = await this.getSets({ pageSize: 250 });
      const sets = response.data;
      
      console.log(`Syncing ${sets.length} sets to database...`);
      
      // Create sets in database 
      for (const setData of sets) {
        await prisma.set.upsert({
          where: { id: setData.id },
          update: {
            name: setData.name,
            series: setData.series,
            printedTotal: setData.printedTotal,
            total: setData.total,
            legalities: setData.legalities,
            ptcgoCode: setData.ptcgoCode,
            releaseDate: setData.releaseDate,
            updatedAt: setData.updatedAt,
            images: setData.images,
            lastUpdated: new Date(),
          },
          create: {
            id: setData.id,
            name: setData.name,
            series: setData.series,
            printedTotal: setData.printedTotal,
            total: setData.total,
            legalities: setData.legalities,
            ptcgoCode: setData.ptcgoCode,
            releaseDate: setData.releaseDate,
            updatedAt: setData.updatedAt,
            images: setData.images,
          },
        });
      }
      
      console.log('Sets sync completed');
      return { success: true, count: sets.length };
    } catch (error: any) {
      console.error('Failed to sync sets:', error);
      return { success: false, error };
    }
  }

  /**
   * Check for and import any new sets
   */
  async syncNewSets() {
    try {
      // Get all sets from API
      const response = await this.getSets({ pageSize: 250 });
      const apiSets = response.data;
      
      // Get all sets we already have in the database
      const dbSets = await prisma.set.findMany({
        select: { id: true }
      });
      
      // Create a map of existing set IDs for quick lookups
      const existingSetIds = new Set(dbSets.map(set => set.id));
      
      // Filter out sets that we don't have yet
      const newSets = apiSets.filter((set: any) => !existingSetIds.has(set.id));
      
      if (newSets.length === 0) {
        console.log('No new sets to import');
        return { success: true, count: 0, newSets: [] };
      }
      
      console.log(`Found ${newSets.length} new sets to import`);
      const importedSets = [];
      
      // Import each new set
      for (const setData of newSets) {
        // First create the set record
        await prisma.set.create({
          data: {
            id: setData.id,
            name: setData.name,
            series: setData.series,
            printedTotal: setData.printedTotal,
            total: setData.total,
            legalities: setData.legalities,
            ptcgoCode: setData.ptcgoCode,
            releaseDate: setData.releaseDate,
            updatedAt: setData.updatedAt,
            images: setData.images,
          },
        });
        
        // Then import all cards for this set
        console.log(`Importing cards for new set: ${setData.name} (${setData.id})`);
        const result = await this.syncSetCards(setData.id);
        
        if (result.success) {
          importedSets.push({
            id: setData.id,
            name: setData.name,
            cardCount: result.count
          });
        }
        
        // Add a delay between set imports
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      return { 
        success: true, 
        count: newSets.length,
        importedSets 
      };
    } catch (error: any) {
      console.error('Failed to sync new sets:', error);
      return { success: false, error };
    }
  }

  /**
   * Sync cards from a specific set to the database
   */
  async syncSetCards(setId: string) {
    try {
      // Get set details
      const setResponse = await this.getSet(setId);
      const setData = setResponse.data;
      
      if (!setData) {
        throw new Error(`Set with ID ${setId} not found`);
      }
      
      // Get all cards for this set
      const query = `set.id:${setId}`;
      let page = 1;
      const pageSize = 50; // Smaller page size to avoid overwhelming the API
      let hasMoreCards = true;
      let totalCards = 0;
      
      // Add a delay function that respects rate limits
      // 30 requests per minute = 1 request per 2 seconds to be safe
      const delay = () => new Promise(resolve => setTimeout(resolve, 2100));
      
      while (hasMoreCards) {
        // Wait before each request to respect rate limits
        await delay();
        
        console.log(`Fetching page ${page} for set ${setData.name}...`);
        const cardsResponse = await this.searchCards(query, { page, pageSize });
        const cards = cardsResponse.data;
        
        console.log(`Syncing ${cards.length} cards from set ${setData.name} (page ${page})...`);
        
        // Process cards in smaller batches with delays
        for (let i = 0; i < cards.length; i++) {
          const cardData = cards[i];
          
          // Every 5 cards, add a small delay to avoid overwhelming the database
          if (i > 0 && i % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
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
              rarity: cardData.rarity || "Unknown",
              nationalPokedexNumbers: cardData.nationalPokedexNumbers || [],
              images: cardData.images,
              tcgplayer: cardData.tcgplayer || null,
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
              rarity: cardData.rarity || "Unknown",
              nationalPokedexNumbers: cardData.nationalPokedexNumbers || [],
              images: cardData.images,
              tcgplayer: cardData.tcgplayer || null,
            },
          });
          
          // Store price history if available
          if (cardData.tcgplayer?.prices) {
            try {
              await prisma.priceHistory.create({
                data: {
                  cardId: cardData.id,
                  date: new Date(),
                  normal: cardData.tcgplayer.prices.normal?.market || null,
                  holofoil: cardData.tcgplayer.prices.holofoil?.market || null,
                  reverseHolofoil: cardData.tcgplayer.prices.reverseHolofoil?.market || null,
                  firstEdition: cardData.tcgplayer.prices['1stEditionHolofoil']?.market || null
                }
              });
            } catch (error: any) {
              // If there's a duplicate price entry, just ignore it
              if (!error.message?.includes('Unique constraint failed')) {
                console.error(`Error creating price history for card ${cardData.id}:`, error);
              }
            }
          }
        }
        
        totalCards += cards.length;
        
        // Check if we need to fetch more pages
        if (cards.length < pageSize) {
          hasMoreCards = false;
        } else {
          page++;
        }
        
        // Log progress
        console.log(`Processed ${totalCards} cards so far from set ${setData.name}`);
      }
      
      console.log(`Completed sync of ${totalCards} cards from set ${setData.name}`);
      return { success: true, count: totalCards };
    } catch (error: any) {
      console.error(`Failed to sync cards from set ${setId}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Update prices for specified cards (or all cards if no IDs provided)
   */
  async updateCardPrices(cardIds: string[] = []): Promise<{ success: boolean; count?: number; error?: any }> {
    try {
      // If specific cards are provided, update only those
      if (cardIds.length > 0) {
        const batchSize = 50;
        const batches = [];
        
        // Split card IDs into batches to avoid overwhelming the API
        for (let i = 0; i < cardIds.length; i += batchSize) {
          batches.push(cardIds.slice(i, i + batchSize));
        }
        
        console.log(`Updating prices for ${cardIds.length} specific cards in ${batches.length} batches`);
        
        let updatedCount = 0;
        
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const query = batch.map(id => `id:${id}`).join(' OR ');
          
          // Respect rate limits
          await new Promise(resolve => setTimeout(resolve, 2100));
          
          console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} cards)...`);
          const cardsResponse = await this.getCards({ q: query, pageSize: batchSize });
          const cards = cardsResponse.data;
          
          for (const card of cards) {
            if (card.tcgplayer?.prices) {
              try {
                // Create a new price history entry
                await prisma.priceHistory.create({
                  data: {
                    cardId: card.id,
                    date: new Date(),
                    normal: card.tcgplayer.prices.normal?.market || null,
                    holofoil: card.tcgplayer.prices.holofoil?.market || null,
                    reverseHolofoil: card.tcgplayer.prices.reverseHolofoil?.market || null,
                    firstEdition: card.tcgplayer.prices['1stEditionHolofoil']?.market || null
                  }
                });
                
                // Update the card's current price data
                await prisma.card.update({
                  where: { id: card.id },
                  data: {
                    tcgplayer: card.tcgplayer,
                    lastUpdated: new Date()
                  }
                });
                
                updatedCount++;
              } catch (error: any) {
                // If there's a duplicate price entry, just ignore it
                if (!error.message?.includes('Unique constraint failed')) {
                  console.error(`Error updating price for card ${card.id}:`, error);
                }
              }
            }
          }
        }
        
        return { success: true, count: updatedCount };
      } 
      // Otherwise, update prices for all cards in the collection
      else {
        // This would be a lot of API calls, so we'll just update cards
        // that are in user collections
        const userCards = await prisma.userCard.findMany({
          select: {
            cardId: true
          },
          distinct: ['cardId']
        });
        
        const uniqueCardIds = userCards.map(uc => uc.cardId);
        
        console.log(`Found ${uniqueCardIds.length} unique cards in user collections`);
        
        if (uniqueCardIds.length === 0) {
          return { success: true, count: 0 };
        }
        
        // Call this same function with the list of cards to update
        return this.updateCardPrices(uniqueCardIds);
      }
    } catch (error: any) {
      console.error('Failed to update card prices:', error);
      return { success: false, error };
    }
  }

  /**
   * Get all available types 
   */
  async getTypes() {
    return this.makeRequest('/types');
  }

  /**
   * Get all available subtypes
   */
  async getSubtypes() {
    return this.makeRequest('/subtypes');
  }

  /**
   * Get all available supertypes
   */
  async getSupertypes() {
    return this.makeRequest('/supertypes');
  }

  /**
   * Get all available rarities
   */
  async getRarities() {
    return this.makeRequest('/rarities');
  }
}

// Create a singleton instance with the API key
const apiKey = process.env.POKEMON_TCG_API_KEY || '';
export const pokemonTcgService = new PokemonTcgService(apiKey);

export default pokemonTcgService;