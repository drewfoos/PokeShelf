import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Plus, Search } from "lucide-react";

// Updated type definitions to match the data shape returned by Prisma

interface CardImages {
  small?: string;
  [key: string]: unknown;
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
  images?: CardImages | null; // allow null value
  tcgplayer: unknown;
  lastUpdated: Date;
}

interface UserCardType {
  id: string;
  quantity: number;
  condition: string;
  card: CardType;
}

// This page is protected by Clerk middleware
export const dynamic = "force-dynamic";

async function getUserCollection() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  try {
    // First, find the user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        collection: true,
      },
    });

    if (!user) {
      return null;
    }

    if (!user.collection) {
      // If no collection exists, create one
      const newUser = await prisma.user.update({
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
      
      return {
        user: newUser,
        collection: newUser.collection,
        recentCards: [],
      };
    }
    
    // Get recent cards in the collection
    const recentCards = await prisma.userCard.findMany({
      where: { 
        collectionId: user.collection.id 
      },
      orderBy: { 
        updatedAt: "desc" 
      },
      take: 10,
      include: {
        card: true,
      },
    });
    
    return {
      user,
      collection: user.collection,
      recentCards,
    };
  } catch (error) {
    console.error("Error fetching user collection:", error);
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
  
  const { collection, recentCards } = data;

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
          <TabsTrigger value="sets">By Set</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="mt-6">
          {recentCards.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(recentCards as UserCardType[]).map((userCard) => (
                  <CollectionCardItem 
                    key={userCard.id} 
                    userCard={userCard} 
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

function CollectionCardItem({ userCard }: { userCard: UserCardType }) {
  const { card, quantity, condition } = userCard;
  
  // Extract image URLs from the card images object
  const images = card.images && typeof card.images === "object" ? card.images : {};
  const smallImage = "small" in images && typeof images.small === "string" ? images.small : null;
  
  return (
    <Link href={`/card/${card.id}`}>
      <Card className="overflow-hidden h-full transition-all hover:shadow-md">
        <div className="p-2">
          <div className="aspect-[3/4] relative rounded overflow-hidden">
            {smallImage ? (
              <Image
                src={smallImage}
                alt={card.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
            
            {/* Quantity Badge */}
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {quantity}
            </div>
          </div>
        </div>
        
        <CardContent className="p-3 pt-1">
          <h3 className="font-medium text-sm truncate" title={card.name}>
            {card.name}
          </h3>
          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
            <span>{card.setName}</span>
            <span>{condition}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
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
