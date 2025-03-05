// types/user.ts

/**
 * Core user interface
 * MongoDB stored document (_id maps to id)
 */
export interface User {
    id: string;           // In MongoDB this is _id
    clerkId: string;      // User ID from Clerk authentication
    email: string;
    name?: string | null;
    imageUrl?: string | null;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  /**
   * User with collection stats
   */
  export interface UserWithCollection extends User {
    collection?: {
      id: string;
      totalCards: number;
      uniqueCards: number;
      estimatedValue: number;
    } | null;
  }
  
  /**
   * Wishlist entity
   */
  export interface Wishlist {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  /**
   * Wishlist item
   */
  export interface WishlistItem {
    id: string;
    wishlistId: string;
    cardId: string;
    maxPrice?: number | null;
    desiredCondition: string;
    priority: number;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
  
  /**
   * User permissions
   */
  export interface UserPermissions {
    canEditCards: boolean;
    canManageUsers: boolean;
    canSyncData: boolean;
    canAccessAdmin: boolean;
  }
  
  /**
   * User settings
   */
  export interface UserSettings {
    displayCurrency: string;
    notificationsEnabled: boolean;
    theme: 'light' | 'dark' | 'system';
    privacySettings: {
      showCollection: boolean;
      showWishlist: boolean;
      showStats: boolean;
    };
  }