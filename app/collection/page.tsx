// app/collection/page.tsx
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Plus, Search } from "lucide-react";
import CollectionCardItem from '@/components/collection/collection-card-item';
import { getAuthenticatedUser, getCurrentDbUser } from '@/lib/auth';
// Import standardized types
import { 
  GroupedCard,
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
    // This will create the user if they don't exist
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
    
    return {
      user: userWithCollection,
      collection: collection,
      recentCards,
      groupedCards
    };
  } catch (error) {
    console.error("Error fetching or creating user collection:", error);
    return null;
  }
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
  
  const { collection, recentCards, groupedCards } = data;

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
          <Button asChild>
            <Link href="/search">
              <Search className="h-4 w-4 mr-2" />
              Find Cards
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Collection Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collection.totalCards}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collection.uniqueCards}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(collection.estimatedValue)}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
          <TabsTrigger value="all">All Cards</TabsTrigger>
          <TabsTrigger value="sets">By Set</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="mt-6">
          {recentCards.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentCards.map((item) => (
                  <CollectionCardItem 
                    key={item.card.id} 
                    card={item.card} 
                    variants={item.variants}
                  />
                ))}
              </div>
              
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupedCards.map((item) => (
                <CollectionCardItem 
                  key={item.card.id} 
                  card={item.card} 
                  variants={item.variants}
                />
              ))}
            </div>
          ) : (
            <EmptyCollection />
          )}
        </TabsContent>
        
        <TabsContent value="sets" className="mt-6">
          <div className="text-center py-12 border rounded-lg bg-card">
            <h3 className="text-xl font-medium mb-2">Set view coming soon</h3>
            <p className="text-muted-foreground mb-6">
              We&apos;re working on a way to view your collection organized by sets.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyCollection() {
  return (
    <div className="text-center py-12 border rounded-lg bg-card">
      <h3 className="text-xl font-medium mb-2">Your collection is empty</h3>
      <p className="text-muted-foreground mb-6">
        Start adding cards to track your Pokémon collection
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