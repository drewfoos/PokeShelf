// app/collection/page.tsx
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Filter, Grid, List, Plus, Search, SortDesc, TrendingUp } from "lucide-react";
import CollectionCardGrid from '@/components/collection/collection-card-grid';
import CollectionStats from '@/components/collection/collection-stats';
import CollectionSetView from '@/components/collection/collection-set-view';
import { getAuthenticatedUser, getCurrentDbUser } from '@/lib/auth';
// Import standardized types
import { 
  GroupedCard,
  UserCollection,
  TCGPlayerData,
  mapMongoCardToInterface,
  mapMongoUserCardToInterface
} from '@/types';

// This page needs to be dynamic since it shows user-specific data
export const dynamic = "force-dynamic";

async function getUserCollection() {
  // Get the authenticated user using our helper
  const authUser = await getAuthenticatedUser();
  
  // If no authenticated user, return null
  if (!authUser) {
    return null;
  }

  try {
    // Get the user from our database using getCurrentDbUser helper
    const dbUser = await getCurrentDbUser();
    
    if (!dbUser) {
      console.error("Failed to get or create user in database");
      return null;
    }

    // Find the user with their collection
    const userWithCollection = await prisma.user.findUnique({
      where: { id: dbUser.id },
      include: {
        collection: true,
      },
    });

    if (!userWithCollection) {
      console.error(`User with ID ${dbUser.id} not found in database after creation.`);
      return null;
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
      
      console.log(`Collection created successfully for user: ${dbUser.id}`);
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
    
    // Get the 10 most recently updated cards for the recent tab
    const recentCards = groupedCards.slice(0, 10);
    
    // Get set statistics for the collection
    const setStats = await getCollectionSetStats(collection);
    
    return {
      user: userWithCollection,
      collection: collection,
      recentCards,
      groupedCards,
      setStats
    };
  } catch (error) {
    console.error("Error fetching or creating user collection:", error);
    return null;
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
      
      // Calculate estimated value
      const userCardsInSet = userCards.filter(uc => uc.card?.set?.id === setId);
      
      let estimatedValue = 0;
      userCardsInSet.forEach(userCard => {
        if (userCard.purchasePrice) {
          estimatedValue += userCard.purchasePrice * userCard.quantity;
        } else if (userCard.card?.tcgplayer) {
          // Use TCGPlayerData type and properly access prices
          const tcgplayer = userCard.card.tcgplayer as unknown as TCGPlayerData;
          if (tcgplayer.prices) {
            if (userCard.variant === 'holofoil' && tcgplayer.prices.holofoil?.market) {
              estimatedValue += tcgplayer.prices.holofoil.market * userCard.quantity;
            } else if (userCard.variant === 'reverseHolofoil' && tcgplayer.prices.reverseHolofoil?.market) {
              estimatedValue += tcgplayer.prices.reverseHolofoil.market * userCard.quantity;
            } else if (tcgplayer.prices.normal?.market) {
              estimatedValue += tcgplayer.prices.normal.market * userCard.quantity;
            }
          }
        }
      });
      
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
        estimatedValue,
        images
      });
    }
    
    // Sort by completion percentage (descending)
    return setStats.sort((a, b) => b.percentComplete - a.percentComplete);
  }

export default async function CollectionPage() {
  // Get the authenticated user
  const authUser = await getAuthenticatedUser();
  
  // If not authenticated, redirect to sign-in
  if (!authUser) {
    redirect("/sign-in?redirect=/collection");
  }
  
  const data = await getUserCollection();
  
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Collection Error</h1>
          <p className="text-muted-foreground mb-4">There was an error loading your collection.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const { collection, recentCards, groupedCards, setStats } = data;

  // Make sure collection is defined (TypeScript safety)
  if (!collection) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Collection Not Found</h1>
          <p className="text-muted-foreground mb-4">
            We couldn&apos;t find your collection. Please try again later.
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">My Collection</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/collection/manage">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Link>
          </Button>
          <Button asChild>
            <Link href="/search">
              <Search className="h-4 w-4 mr-2" />
              Find Cards
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Collection Stats */}
      <CollectionStats collection={collection} />
      
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Recent</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            <span>All Cards</span>
          </TabsTrigger>
          <TabsTrigger value="sets" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span>By Set</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="mt-6">
          {recentCards.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recently Added</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/collection/all">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
              
              <Separator />
              
              <CollectionCardGrid cards={recentCards} />
              
              <div className="flex justify-center mt-6">
                <Button variant="outline" asChild>
                  <Link href="/collection/all">
                    View All Cards
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <EmptyCollection />
          )}
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          {groupedCards.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">All Cards ({collection.uniqueCards})</h2>
                <Button variant="outline" size="sm">
                  <SortDesc className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </div>
              
              <Separator />
              
              <CollectionCardGrid cards={groupedCards} className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" />
            </div>
          ) : (
            <EmptyCollection />
          )}
        </TabsContent>
        
        <TabsContent value="sets" className="mt-6">
          {setStats && setStats.length > 0 ? (
            <CollectionSetView sets={setStats} />
          ) : (
            <EmptyCollection message="Add cards to your collection to see them organized by set." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyCollection({ message }: { message?: string }) {
  return (
    <div className="text-center py-12 border rounded-lg bg-card">
      <h3 className="text-xl font-medium mb-2">Your collection is empty</h3>
      <p className="text-muted-foreground mb-6">
        {message || "Start adding cards to track your Pokémon collection"}
      </p>
      <Button asChild>
        <Link href="/sets">
          <Plus className="h-4 w-4 mr-2" />
          Browse Sets to Add Cards
        </Link>
      </Button>
    </div>
  );
}