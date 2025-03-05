// types/collection.ts
import { Card, CardVariant, GroupedCard } from './card';

/**
 * User collection entity
 * MongoDB stored document (_id maps to id)
 */
export interface UserCollection {
  id: string;           // In MongoDB this is _id
  userId: string;       // References User._id
  totalCards: number;
  uniqueCards: number;
  estimatedValue: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User card in collection
 * MongoDB stored document (_id maps to id)
 */
export interface UserCard {
  id: string;           // In MongoDB this is _id
  collectionId: string; // References UserCollection._id
  cardId: string;       // Card ID (not MongoDB _id)
  quantity: number;
  condition: string;
  isFoil: boolean;
  isFirstEdition: boolean;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  notes?: string | null;
  forTrade: boolean;
  variant: string;      // normal, holofoil, etc.
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Card variant type definitions
 */
export type CardVariantType = 
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | 'masterBall'
  | 'pokeBall'
  | string;

/**
 * Card condition options
 */
export type CardCondition = 
  | 'Near Mint'
  | 'Lightly Played'
  | 'Moderately Played'
  | 'Heavily Played'
  | 'Damaged'
  | string;

/**
 * Collection statistics
 */
export interface CollectionStats {
  totalCards: number;
  uniqueCards: number;
  totalSets: number;
  completeSetCount: number;
  estimatedValue: number;
  mostValuableCard?: {
    id: string;
    name: string;
    value: number;
    image?: string;
  };
}

/**
 * Collection by set stats
 */
export interface CollectionBySet {
  setId: string;
  setName: string;
  totalInSet: number;
  collectedCount: number;
  percentComplete: number;
}

/**
 * Card with variant info for display
 */
export interface CardVariantDisplay {
  type: CardVariantType;
  name: string;
  description: string;
  available: boolean;
  quantity: number;
  condition: CardCondition;
  imageSample?: string;
  price?: number | null;
}