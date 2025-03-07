// types/api/requests.ts
import { CardCondition, CardVariantType } from '../collection';

/**
 * Search cards request parameters
 */
export interface SearchCardsRequest {
  q?: string;
  page?: number;
  pageSize?: number;
  set?: string;
  type?: string;
  rarity?: string;
  sort?: string
}

/**
 * Collection add/update request API parameters
 */
export interface AddToCollectionRequestParams {
  cardId: string;
  quantity?: number;
  condition?: CardCondition;
  isFoil?: boolean;
  isFirstEdition?: boolean;
  purchasePrice?: number | null;
  variant?: CardVariantType;
}

/**
 * Collection check request API parameters
 */
export interface CheckCollectionRequest {
  cardId: string;
  variant?: string;
}

/**
 * Collection remove request API parameters
 */
export interface RemoveFromCollectionRequestParams {
  cardId: string;
  quantity?: number;
  removeAll?: boolean;
  variant?: CardVariantType;
}

/**
 * Admin sync request
 */
export interface AdminSyncRequest {
  action: string;
  setId?: string;
  type?: string;
  setIds?: string[];
  updateAll?: boolean;
}

/**
 * Admin user management request
 */
export interface AdminUserRequest {
  action: string;
  email?: string;
}

/**
 * Wishlist add request
 */
export interface WishlistAddRequest {
  cardId: string;
  maxPrice?: number | null;
  desiredCondition?: string;
  priority?: number;
  notes?: string | null;
}

/**
 * Wishlist update request
 */
export interface WishlistUpdateRequest {
  wishlistItemId: string;
  maxPrice?: number | null;
  desiredCondition?: string;
  priority?: number;
  notes?: string | null;
}

/**
 * Wishlist remove request
 */
export interface WishlistRemoveRequest {
  wishlistItemId: string;
}