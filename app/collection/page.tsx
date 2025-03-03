/* eslint-disable @typescript-eslint/no-explicit-any */
// app/collection/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Plus, Search } from "lucide-react";
import CollectionCardItem from '@/components/collection/collection-card-item';

// Updated type definitions with proper typing
interface CardImage {
  small?: string;
  large?: string;
  [key: string]: string | undefined;
}

interface TCGPlayerPriceData {
  low: number;
  mid: number;
  high: number;
  market: number;
  directLow: number | null;
}

interface TCGPlayerPrices {
  normal?: TCGPlayerPriceData;
  holofoil?: TCGPlayerPriceData;
  reverseHolofoil?: TCGPlayerPriceData;
  '1stEditionHolofoil'?: TCGPlayerPriceData;
  [key: string]: TCGPlayerPriceData | undefined;
}

interface TCGPlayerData {
  url: string;
  updatedAt: string;
  prices?: TCGPlayerPrices;
}

interface CardType {
  id: string;
  name: string;
  number: string;
  supertype: string;
  subtypes: string[];
  hp: string | null;
  types: string[];
  setId: string;
  setName: string;
  artist: string | null;
  rarity: string;
  nationalPokedexNumbers: number[];
  images: CardImage | null;
  tcgplayer: TCGPlayerData | null;
  lastUpdated: Date;
}

interface CardVariant {
  id: string;
  cardId: string;
  quantity: number;
  condition: string;
  variant: string;
  isFoil: boolean;
  isFirstEdition?: boolean;
  purchasePrice?: number | null;
}

interface GroupedCardType {
  card: CardType;
  variants: CardVariant[];
}

// This page needs to be dynamic since it shows user-specific data
export const dynamic = "force-dynamic";

async function getUserCollection() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  
  if (!userId || !clerkUser) {
    return null;
  }

  try {
    // First, find the user by clerkId
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        collection: true,
      },
    });

    // If no user exists in database, create one immediately
    if (!user) {
      console.log(`User with Clerk ID ${userId} not found in database. Creating user record immediately.`);
      
      // Get primary email if available
      const primaryEmail = clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0 
        ? clerkUser.emailAddresses[0].emailAddress 
        : '';
      
      // Get user name from Clerk
      const userName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 
                       clerkUser.username || 
                       'User';
      
      // Create user with collection
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: primaryEmail,
          name: userName,
          imageUrl: clerkUser.imageUrl || '',
          collection: {
            create: {
              totalCards: 0,
              uniqueCards: 0,
              estimatedValue: 0,
            },
          },
          wishlist: {
            create: {}
          }
        },
        include: {
          collection: true,
        },
      });
      
      console.log(`User created successfully with ID: ${user.id}`);
    }

    // Ensure the user exists before continuing (TypeScript safety)
    if (!user) {
      throw new Error("Failed to create user record");
    }
    
    // If user exists but doesn't have a collection, create one
    if (!user.collection) {
      console.log(`User ${userId} found but has no collection. Creating collection.`);
      
      user = await prisma.user.update({
        where: { clerkId: userId },
        data: {
          collection: {
            create: {
              totalCards: 0,
              uniqueCards: 0,
              estimatedValue: 0,
            },
          },
        },
        include: {
          collection: true,
        },
      });
      
      console.log(`Collection created successfully for user: ${user.id}`);
    }
    
    // Get all user cards with variants
    const userCards = user.collection ? await prisma.userCard.findMany({
      where: { 
        collectionId: user.collection.id 
      },
      orderBy: { 
        updatedAt: "desc" 
      },
      include: {
        card: true,
      },
    }) : [];

    // Group cards by cardId to support multiple variants of the same card
    const groupedCards: GroupedCardType[] = [];
    const cardMap = new Map<string, GroupedCardType>();
    
    userCards.forEach(userCard => {
      // Properly cast the Prisma JSON to our expected types
      const typedCard: CardType = {
        ...userCard.card,
        images: userCard.card.images as unknown as CardImage | null,
        tcgplayer: userCard.card.tcgplayer as unknown as TCGPlayerData | null
      };
      
      if (!cardMap.has(userCard.cardId)) {
        cardMap.set(userCard.cardId, {
          card: typedCard,
          variants: [userCard as unknown as CardVariant]
        });
      } else {
        cardMap.get(userCard.cardId)?.variants.push(userCard as unknown as CardVariant);
      }
    });
    
    // Convert map to array for rendering
    cardMap.forEach(item => {
      groupedCards.push(item);
    });
    
    // Get the 10 most recently updated cards for the recent tab
    const recentCards = groupedCards.slice(0, 10);
    
    return {
      user,
      collection: user.collection,
      recentCards,
      groupedCards
    };
  } catch (error) {
    console.error("Error fetching or creating user collection:", error);
    return null;
  }
}

export default async function CollectionPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
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