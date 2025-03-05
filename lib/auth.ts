// lib/auth.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from '@/lib/prisma';
import { User } from '@/types';

/**
 * Get the current authenticated user with Clerk
 * @returns The authenticated user's Clerk ID and user information, or null if not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return null;
    }
    
    return { userId, user };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Get the current user from the database, creating it if it doesn't exist
 * @returns The user from the database, or null if not authenticated
 */
export async function getCurrentDbUser(): Promise<User | null> {
  const authUser = await getAuthenticatedUser();
  
  if (!authUser) {
    return null;
  }
  
  const { userId, user } = authUser;
  
  try {
    // Try to find the user in our database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    // If user doesn't exist in our database, create them
    if (!dbUser) {
      // Extract user info from Clerk
      const primaryEmail = user.emailAddresses && user.emailAddresses.length > 0 
        ? user.emailAddresses[0].emailAddress 
        : '';
      
      const name = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim() 
        : user.username || 'User';
      
      // Create the user in our database
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: primaryEmail,
          name: name,
          imageUrl: user.imageUrl,
          // Also create an empty collection and wishlist for the user
          collection: {
            create: {
              totalCards: 0,
              uniqueCards: 0,
              estimatedValue: 0
            }
          },
          wishlist: {
            create: {}
          }
        }
      });
      
      console.log(`User created with ID: ${userId}`);
    }
    
    return {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      name: dbUser.name || null,
      imageUrl: dbUser.imageUrl || null,
      isAdmin: dbUser.isAdmin,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    };
  } catch (error) {
    console.error('Error getting current user from database:', error);
    return null;
  }
}

/**
 * Get the user's collection ID, creating it if it doesn't exist
 * @returns The collection ID, or null if not authenticated
 */
export async function getUserCollectionId(): Promise<string | null> {
  const authUser = await getAuthenticatedUser();
  
  if (!authUser) {
    return null;
  }
  
  try {
    // First find the user with their collection
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: authUser.userId },
      include: { collection: true }
    });
    
    if (!dbUser) {
      return null;
    }
    
    // If user has no collection, create one
    if (!dbUser.collection) {
      const newCollection = await prisma.userCollection.create({
        data: {
          user: { connect: { id: dbUser.id } },
          totalCards: 0,
          uniqueCards: 0,
          estimatedValue: 0
        }
      });
      
      return newCollection.id;
    }
    
    return dbUser.collection.id;
  } catch (error) {
    console.error('Error getting user collection ID:', error);
    return null;
  }
}