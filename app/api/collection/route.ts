// app/api/collection/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, getCurrentDbUser } from '@/lib/auth';
import { 
  GroupedCard, 
  UserCollection,
  mapMongoCardToInterface, 
  mapMongoUserCardToInterface 
} from '@/types';

export async function GET() {
  try {
    // Check if user is authenticated
    const authUser = await getAuthenticatedUser();
    
    if (!authUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }
    
    // Get the current user from our database
    const dbUser = await getCurrentDbUser();
    
    if (!dbUser) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found in database" 
      }, { status: 404 });
    }

    // Find the user with their collection
    const userWithCollection = await prisma.user.findUnique({
      where: { id: dbUser.id },
      include: {
        collection: true,
      },
    });

    if (!userWithCollection) {
      return NextResponse.json({ 
        success: false, 
        error: "User collection not found" 
      }, { status: 404 });
    }
    
    // If user doesn't have a collection, create one
    let collection = userWithCollection.collection;
    if (!collection) {
      collection = await prisma.userCollection.create({
        data: {
          user: { connect: { id: dbUser.id } },
          totalCards: 0,
          uniqueCards: 0,
          estimatedValue: 0,
        },
      });
    }
    
    // Get all user cards with variants
    const userCards = collection ? await prisma.userCard.findMany({
      where: { 
        collectionId: collection.id 
      },
      orderBy: { 
        updatedAt: "desc" 
      },
      include: {
        card: true,
      },
    }) : [];

    // Group cards by cardId to support multiple variants of the same card
    const groupedCards: GroupedCard[] = [];
    const cardMap = new Map<string, GroupedCard>();
    
    userCards.forEach(userCard => {
      // Map the MongoDB documents to our typed interfaces
      const typedCard = mapMongoCardToInterface(userCard.card);
      const typedVariant = mapMongoUserCardToInterface(userCard);
      
      if (!cardMap.has(userCard.cardId)) {
        cardMap.set(userCard.cardId, {
          card: typedCard,
          variants: [typedVariant]
        });
      } else {
        cardMap.get(userCard.cardId)?.variants.push(typedVariant);
      }
    });
    
    // Convert map to array for rendering
    cardMap.forEach(item => {
      groupedCards.push(item);
    });
    
    // Get set statistics for the collection
    const setStats = await getCollectionSetStats(collection);
    
    // Return the collection data
    return NextResponse.json({
      success: true,
      collection,
      groupedCards,
      setStats
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch collection" 
    }, { status: 500 });
  }
}

// Function to get statistics about sets in the collection
async function getCollectionSetStats(collection: UserCollection) {
  if (!collection) return [];
  
  // Get cards in the collection with their set information
  const userCards = await prisma.userCard.findMany({
    where: { collectionId: collection.id },
    include: {
      card: {
        include: {
          set: true
        }
      }
    }
  });
  
  // Extract unique set IDs
  const setMap = new Map();
  userCards.forEach(userCard => {
    if (userCard.card?.set) {
      setMap.set(userCard.card.set.id, userCard.card.set);
    }
  });
  
  // If no sets, return empty array
  if (setMap.size === 0) return [];
  
  // For each set, count cards in collection and build the SetStat objects
  const setStats = [];
  
  for (const [setId, set] of setMap.entries()) {
    // Count user cards from this set
    const cardsInCollection = userCards.filter(uc => uc.card?.set?.id === setId).length;
    
    // Get total cards in set
    const totalInSet = set.printedTotal;
    
    // Ensure we handle the image fields correctly
    let images = null;
    if (set.images) {
      images = {
        symbol: set.images.symbol || '',
        logo: set.images.logo || ''
      };
    }
    
    // Create the SetStat object with the right structure
    setStats.push({
      id: setId,
      name: set.name,
      series: set.series,
      releaseDate: set.releaseDate,
      totalInSet,
      cardsInCollection,
      percentComplete: totalInSet > 0 ? (cardsInCollection / totalInSet) * 100 : 0,
      images
    });
  }
  
  // Sort by completion percentage (descending)
  return setStats.sort((a, b) => b.percentComplete - a.percentComplete);
}