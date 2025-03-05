// types/card.ts
import { TCGPlayerData } from './price';

/**
 * Card image structure from the Pokémon TCG API
 */
export interface CardImage {
  small: string;
  large: string;
  [key: string]: string | undefined; // For any additional image types
}

/**
 * Core card interface matching the Pokémon TCG API structure
 * MongoDB stored document (_id maps to id)
 */
export interface Card {
  id: string;      // In MongoDB this is _id
  name: string;
  supertype: string;
  subtypes: string[];
  hp?: string | null;
  types: string[];
  setId: string;
  setName: string;
  number: string;
  artist?: string | null;
  rarity: string;
  nationalPokedexNumbers: number[];
  images: CardImage | null;
  tcgplayer?: TCGPlayerData | null;
  lastUpdated: Date;
}

/**
 * Card variant in a user's collection
 */
export interface CardVariant {
  id?: string;                 // Database ID when stored
  cardId: string;              // Reference to the card
  quantity: number;            // How many the user has
  condition: string;           // Near Mint, Lightly Played, etc.
  variant: string;             // normal, holofoil, reverseHolofoil, etc.
  isFoil: boolean;             // Whether it's a foil card
  isFirstEdition?: boolean;    // Whether it's a first edition
  purchasePrice?: number | null; // How much the user paid
  purchaseDate?: Date | null;  // When they purchased it
  notes?: string | null;       // Any notes about this card
  forTrade?: boolean;          // Whether it's available for trade
}

/**
 * Card with all variants for collection view
 */
export interface GroupedCard {
  card: Card;
  variants: CardVariant[];
}

/**
 * Simplified card info for card grid display
 */
export interface CardGridItem {
  id: string;
  name: string;
  number: string;
  setName: string;
  rarity: string;
  types?: string[];
  images: CardImage | null;
  artist?: string | null;
  tcgplayer?: TCGPlayerData | null;
}

/**
 * Card with collection status
 */
export interface CardWithCollectionStatus extends Card {
  inCollection: boolean;
  quantity?: number;
  variants?: CardVariant[];
}