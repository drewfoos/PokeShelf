// types/set.ts

/**
 * Format legalities for a set
 */
export interface Legalities {
    standard?: string;
    expanded?: string;
    unlimited?: string;
    [key: string]: string | undefined; // For any additional formats
  }
  
  /**
   * Set images from the Pokémon TCG API
   */
  export interface SetImages {
    symbol: string;
    logo: string;
    [key: string]: string | undefined; // For any additional image types
  }
  
  /**
   * Core set interface matching the Pokémon TCG API structure
   * MongoDB stored document (_id maps to id)
   */
  export interface Set {
    id: string;       // In MongoDB this is _id
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    legalities?: Legalities | null;
    ptcgoCode?: string | null;
    releaseDate: string;
    updatedAt: string;
    images: SetImages;
    lastUpdated?: Date;
  }
  
  /**
   * Set with additional information for display
   */
  export interface SetWithCards extends Set {
    cards?: number;
  }
  
  /**
   * Set with additional stats for dashboard
   */
  export interface SetWithStats extends Set {
    cardsInCollection?: number;
    percentComplete?: number;
    estimatedValue?: number;
  }
  
  /**
   * Simplified set for dropdown selection
   */
  export interface SetOption {
    id: string;
    name: string;
    series?: string;
  }
  
  /**
   * Result of a set synchronization operation
   */
  export interface SetSyncResult {
    id: string;
    name?: string;
    count?: number;
    success?: boolean;
    error?: unknown;
  }