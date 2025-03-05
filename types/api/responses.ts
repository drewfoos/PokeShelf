// types/api/responses.ts
import { Card } from '../card';
import { Set, SetSyncResult } from '../set';
import { UserCard } from '../collection';
import { User } from '../user';

/**
 * Standard API response interface
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Pagination information
 */
export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Search cards response
 */
export interface SearchCardsResponse {
  cards: Card[];
  pagination: Pagination;
}

/**
 * Collection check response
 */
export interface CollectionCheckResponse {
  inCollection: boolean;
  variants?: Array<{
    variant: string;
    quantity: number;
    condition: string;
  }>;
  quantity?: number;
  variant?: string;
}

/**
 * Collection add/update response
 */
export interface CollectionModifyResponse {
    success: boolean;
    message?: string;  // Make message optional
    error?: string;    // Add optional error field
    card?: UserCard;   // Card is only included on success
  }

/**
 * Collection remove response
 */
export interface CollectionRemoveResponse {
    success: boolean;
    message?: string;    // Make message optional
    error?: string;      // Add optional error field
    newQuantity: number; // This should still be required
    variant: string;     // This should still be required
  }

/**
 * Set response
 */
export interface SetResponse {
  set: Set;
  cards: Card[];
  pagination: Pagination;
  filters: {
    rarities: string[];
    types: string[];
  };
}

/**
 * Admin sync response
 */
export interface SyncResponse {
  success: boolean;
  message?: string;
  executionTimeMs?: number;
  result?: {
    success: boolean;
    count?: number;
    total?: number;
    failed?: number;
    failedCardIds?: string[];
    sets?: SetSyncResult[];
    error?: unknown;
  };
}

/**
 * Admin user search response
 */
export interface AdminUsersResponse {
  users: User[];
}

/**
 * Admin user management response
 */
export interface AdminUserManagementResponse {
  success: boolean;
  message: string;
}

/**
 * Card price update response
 */
export interface PriceUpdateResponse {
  success: boolean;
  count: number;
  updatedCards?: string[];
  failedCards?: string[];
}

/**
 * Wishlist response
 */
export interface WishlistResponse {
  success: boolean;
  items: Array<{
    id: string;
    cardId: string;
    card: Card;
    priority: number;
    maxPrice?: number | null;
    notes?: string | null;
  }>;
}

/**
 * Admin check response
 */
export interface AdminCheckResponse {
  isAdmin: boolean;
}