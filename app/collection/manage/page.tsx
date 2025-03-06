// app/collection/manage/page.tsx
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CollectionFilters from '@/components/collection/collection-filters';
import { ChevronLeft } from "lucide-react";
import { getAuthenticatedUser, getCurrentDbUser } from '@/lib/auth';
import { 
  GroupedCard, 
  mapMongoCardToInterface, 
  mapMongoUserCardToInterface 
} from '@/types';

// This page needs to be dynamic since it shows user-specific data
export const dynamic = "force-dynamic";

async function getUserCollection(
  filters: { 
    set?: string,
    rarity?: string,
    type?: string,
    variant?: string,
    condition?: string,
  } = {}
) {
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

    const userWithCollection = await prisma.user.findUnique({
      where: { id: dbUser.id },
      include: { collection: true },
    });

    if (!userWithCollection?.collection) {
      return { groupedCards: [], filters: { sets: [], rarities: [], types: [] } };
    }
    
    // Build the query - we'll manually filter later
    const userCardWhere: any = { collectionId: userWithCollection.collection.id };
    
    // Apply variant and condition filters to the Prisma query if provided
    if (filters.variant) {
      userCardWhere.variant = filters.variant;
    }
    
    if (filters.condition) {
      userCardWhere.condition = filters.condition;
    }
    
    // Get all user cards with variants
    const userCards = await prisma.userCard.findMany({
      where: userCardWhere,
      orderBy: { updatedAt: "desc" },
      include: {
        card: true,
      },
    });

    // Apply set, rarity, and type filters manually in JS
    let filteredUserCards = [...userCards];
    
    if (filters.set) {
      filteredUserCards = filteredUserCards.filter(uc => uc.card?.setId === filters.set);
    }
    
    if (filters.rarity) {
      filteredUserCards = filteredUserCards.filter(uc => uc.card?.rarity === filters.rarity);
    }
    
    if (filters.type) {
      filteredUserCards = filteredUserCards.filter(uc => uc.card?.types?.includes(filters.type || ''));
    }
    
    // Group cards by cardId to support multiple variants of the same card
    const groupedCards: GroupedCard[] = [];
    const cardMap = new Map<string, GroupedCard>();
    
    filteredUserCards.forEach(userCard => {
      // Skip if card is null (shouldn't happen but just in case)
      if (!userCard.card) return;
      
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
    
    // Get filter options for the filter component - by processing all user cards
    const allUserCards = await prisma.userCard.findMany({
      where: { collectionId: userWithCollection.collection.id },
      include: {
        card: true,
      },
    });
    
    // Extract sets
    const uniqueSetsMap = new Map();
    allUserCards.forEach(userCard => {
      if (userCard.card) {
        uniqueSetsMap.set(userCard.card.setId, {
          id: userCard.card.setId,
          name: userCard.card.setName,
        });
      }
    });
    const sets = Array.from(uniqueSetsMap.values());
    
    // Extract rarities
    const uniqueRaritiesSet = new Set<string>();
    allUserCards.forEach(userCard => {
      if (userCard.card?.rarity) {
        uniqueRaritiesSet.add(userCard.card.rarity);
      }
    });
    const rarities = Array.from(uniqueRaritiesSet);
    
    // Extract types
    const uniqueTypes = new Set<string>();
    allUserCards.forEach(userCard => {
      if (userCard.card?.types) {
        userCard.card.types.forEach(type => uniqueTypes.add(type));
      }
    });
    
    // Extract variants
    const variantSet = new Set<string>();
    allUserCards.forEach(userCard => {
      variantSet.add(userCard.variant);
    });
    const variants = Array.from(variantSet);
    
    // Extract conditions
    const conditionSet = new Set<string>();
    allUserCards.forEach(userCard => {
      conditionSet.add(userCard.condition);
    });
    const conditions = Array.from(conditionSet);
    
    return {
      groupedCards,
      filters: {
        sets,
        rarities,
        types: Array.from(uniqueTypes),
        variants,
        conditions
      }
    };
  } catch (error) {
    console.error("Error fetching filtered collection:", error);
    return null;
  }
}

export default async function CollectionManagePage({
  searchParams
}: {
  searchParams: { 
    set?: string;
    rarity?: string;
    type?: string;
    variant?: string;
    condition?: string;
  }
}) {
  // Get the authenticated user
  const authUser = await getAuthenticatedUser();
  
  // If not authenticated, redirect to sign-in
  if (!authUser) {
    redirect("/sign-in?redirect=/collection/manage");
  }
  
  const data = await getUserCollection(searchParams);
  
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Collection Error</h1>
          <p className="text-muted-foreground mb-4">There was an error loading your collection.</p>
          <Button asChild>
            <Link href="/collection">Go Back</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const { groupedCards, filters } = data;
  const hasFilters = Object.values(searchParams).some(value => value != null);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/collection">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Collection
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Manage Collection</h1>
      </div>
      
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <CollectionFilters filters={filters} currentFilters={searchParams} />
        </CardContent>
      </Card>
      
      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">
            {hasFilters ? 'Filtered Results' : 'All Cards'}
            <span className="ml-2 text-muted-foreground">({groupedCards.length})</span>
          </h2>
          
          {hasFilters && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/collection/manage">
                Clear Filters
              </Link>
            </Button>
          )}
        </div>
        
        {groupedCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {groupedCards.map((groupedCard) => (
              <Card key={groupedCard.card.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <Link href={`/card/${groupedCard.card.id}`} className="block p-2">
                    {groupedCard.card.images?.small ? (
                      <div className="aspect-[3/4] relative rounded overflow-hidden">
                        <img 
                          src={groupedCard.card.images.small} 
                          alt={groupedCard.card.name}
                          className="object-contain w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/4] bg-muted flex items-center justify-center rounded">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                  </Link>
                  
                  <div className="p-3 pt-0">
                    <h3 className="font-medium text-sm truncate" title={groupedCard.card.name}>
                      {groupedCard.card.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{groupedCard.card.setName}</p>
                    
                    <div className="mt-2 text-xs">
                      <span className="font-medium">Variants:</span> {groupedCard.variants.length}
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">Total Quantity:</span> {groupedCard.variants.reduce((total, v) => total + v.quantity, 0)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">No cards match your filters</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filter criteria or add more cards to your collection.
            </p>
            <Button asChild>
              <Link href="/sets">Browse Sets</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}