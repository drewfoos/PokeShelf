// types/utils.ts
import type { Prisma } from '@prisma/client';
import { Card, CardImage } from './card';
import { TCGPlayerData } from './price';
import { Set, SetImages } from './set';

/**
 * Safely convert Prisma JSON to typed objects
 * @param json The JSON value from Prisma
 * @returns Typed object or null if conversion fails
 */
export function ensureTypedJson<T>(json: Prisma.JsonValue | null | undefined): T | null {
  if (!json) return null;
  
  try {
    if (typeof json === 'object') {
      return json as unknown as T;
    }
    return JSON.parse(json as string) as T;
  } catch {
    return null;
  }
}

/**
 * Convert Prisma JSON to card images type
 * @param json JSON value from Prisma
 * @returns Typed CardImage object or null
 */
export function getCardImages(json: Prisma.JsonValue | null | undefined): CardImage | null {
  return ensureTypedJson<CardImage>(json);
}

/**
 * Convert Prisma JSON to TCGPlayer data
 * @param json JSON value from Prisma
 * @returns Typed TCGPlayerData object or null
 */
export function getTCGPlayerData(json: Prisma.JsonValue | null | undefined): TCGPlayerData | null {
  return ensureTypedJson<TCGPlayerData>(json);
}

/**
 * Convert Prisma JSON to set images type
 * @param json JSON value from Prisma
 * @returns Typed SetImages object or null
 */
export function getSetImages(json: Prisma.JsonValue | null | undefined): SetImages | null {
  return ensureTypedJson<SetImages>(json);
}

/**
 * Prepare an object for Prisma JSON storage
 * @param data Object to prepare
 * @returns JSON-safe object
 */
export function prepareJsonForPrisma<T>(data: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

/**
 * Convert a MongoDB document to our Card interface
 * @param doc MongoDB document with _id
 * @returns Card with properly typed fields
 */
export function mapMongoCardToInterface(doc: any): Card {
  return {
    id: doc._id || doc.id,
    name: doc.name,
    supertype: doc.supertype,
    subtypes: doc.subtypes || [],
    hp: doc.hp,
    types: doc.types || [],
    setId: doc.setId,
    setName: doc.setName,
    number: doc.number,
    artist: doc.artist,
    rarity: doc.rarity || 'Unknown',
    nationalPokedexNumbers: doc.nationalPokedexNumbers || [],
    images: doc.images,
    tcgplayer: doc.tcgplayer,
    lastUpdated: doc.lastUpdated ? new Date(doc.lastUpdated) : new Date()
  };
}

/**
 * Convert a MongoDB document to our Set interface
 * @param doc MongoDB document with _id
 * @returns Set with properly typed fields
 */
export function mapMongoSetToInterface(doc: any): Set {
  return {
    id: doc._id || doc.id,
    name: doc.name,
    series: doc.series,
    printedTotal: doc.printedTotal,
    total: doc.total,
    legalities: doc.legalities,
    ptcgoCode: doc.ptcgoCode,
    releaseDate: doc.releaseDate,
    updatedAt: doc.updatedAt,
    images: doc.images,
    lastUpdated: doc.lastUpdated ? new Date(doc.lastUpdated) : new Date()
  };
}

/**
 * Convert a MongoDB document to our UserCollection interface
 * @param doc MongoDB document with _id
 * @returns UserCollection with properly typed fields
 */
export function mapMongoUserCollectionToInterface(doc: any): import('./collection').UserCollection {
  return {
    id: doc._id || doc.id,
    userId: doc.userId,
    totalCards: doc.totalCards,
    uniqueCards: doc.uniqueCards,
    estimatedValue: doc.estimatedValue,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt)
  };
}

/**
 * Convert a MongoDB document to our UserCard interface
 * @param doc MongoDB document with _id
 * @returns UserCard with properly typed fields
 */
export function mapMongoUserCardToInterface(doc: any): import('./collection').UserCard {
  return {
    id: doc._id || doc.id,
    collectionId: doc.collectionId,
    cardId: doc.cardId,
    quantity: doc.quantity,
    condition: doc.condition,
    isFoil: doc.isFoil,
    isFirstEdition: doc.isFirstEdition,
    purchaseDate: doc.purchaseDate ? new Date(doc.purchaseDate) : null,
    purchasePrice: doc.purchasePrice,
    notes: doc.notes || null,
    forTrade: doc.forTrade || false,
    variant: doc.variant || 'normal',
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt)
  };
}

/**
 * Convert a MongoDB document to our User interface
 * @param doc MongoDB document with _id
 * @returns User with properly typed fields
 */
export function mapMongoUserToInterface(doc: any): import('./user').User {
  return {
    id: doc._id || doc.id,
    clerkId: doc.clerkId,
    email: doc.email,
    name: doc.name,
    imageUrl: doc.imageUrl,
    isAdmin: doc.isAdmin || false,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt)
  };
}