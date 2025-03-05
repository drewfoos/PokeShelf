// types/price.ts

/**
 * TCGPlayer price details for a specific variant
 */
export interface TCGPlayerPriceData {
    low?: number;
    mid?: number;
    high?: number;
    market?: number;
    directLow?: number | null;
    [key: string]: number | null | undefined; // For other price properties
  }
  
  /**
   * TCGPlayer prices for all card variants
   */
  export interface TCGPlayerPrices {
    normal?: TCGPlayerPriceData;
    holofoil?: TCGPlayerPriceData;
    reverseHolofoil?: TCGPlayerPriceData;
    '1stEditionHolofoil'?: TCGPlayerPriceData;
    [key: string]: TCGPlayerPriceData | undefined; // For other variant types
  }
  
  /**
   * TCGPlayer data structure from the Pokémon TCG API
   */
  export interface TCGPlayerData {
    url: string;
    updatedAt: string;
    prices?: TCGPlayerPrices;
    [key: string]: unknown; // For any additional TCGPlayer data
  }
  
  /**
   * Price history record for a card
   */
  export interface PriceHistoryRecord {
    id?: string;
    cardId: string;
    date: Date;
    normal: number | null;
    holofoil: number | null;
    reverseHolofoil: number | null;
    firstEdition: number | null;
  }
  
  /**
   * Get the appropriate price for a card based on its properties
   * @param tcgplayer TCGPlayer data
   * @param isFoil Whether the card is foil
   * @param isFirstEdition Whether the card is first edition
   * @returns The appropriate market price or null if not available
   */
  export function getCardPrice(
    tcgplayer: TCGPlayerData | null,
    isFoil = false,
    isFirstEdition = false
  ): number | null {
    if (!tcgplayer || !tcgplayer.prices) return null;
    
    const prices = tcgplayer.prices;
    
    if (isFirstEdition && prices['1stEditionHolofoil']) {
      return prices['1stEditionHolofoil'].market || null;
    }
    
    if (isFoil && prices.holofoil) {
      return prices.holofoil.market || null;
    }
    
    if (isFoil && prices.reverseHolofoil) {
      return prices.reverseHolofoil.market || null;
    }
    
    if (prices.normal) {
      return prices.normal.market || null;
    }
    
    return null;
  }