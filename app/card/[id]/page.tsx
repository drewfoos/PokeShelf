import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronLeft, ExternalLink, DollarSign, Heart } from 'lucide-react';
import { auth } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CollectionButton from '@/components/collection/collection-button';
import WishlistButton from '@/components/wishlist/wishlist-button';

// Make this page dynamic
export const dynamic = 'force-dynamic';

async function getCard(id: string) {
  try {
    const card = await prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      return null;
    }

    return card;
  } catch (error) {
    console.error(`Error fetching card ${id}:`, error);
    return null;
  }
}

/**
 * Fetches the API URL (which will redirect) and returns the final TCGPlayer URL.
 * This function runs on the server so it can use Node's fetch.
 */
async function getDirectTCGPlayerUrl(cardId: string): Promise<string> {
  const apiUrl = `https://prices.pokemontcg.io/tcgplayer/${cardId}`;
  try {
    const response = await fetch(apiUrl, { redirect: 'follow' });
    return response.url;
  } catch (error) {
    console.error("Failed to resolve direct URL:", error);
    return `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(cardId)}`;
  }
}

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await the params and auth before accessing properties
  const resolvedParams = await params;
  const { userId } = await auth();
  const card = await getCard(resolvedParams.id);

  if (!card) {
    notFound();
  }

  // Extract image URLs
  const images = card.images && typeof card.images === 'object' && card.images !== null 
    ? card.images 
    : {};
    
  const largeImage = 'large' in images && typeof images.large === 'string' 
    ? images.large 
    : null;
    
  const smallImage = 'small' in images && typeof images.small === 'string' 
    ? images.small 
    : null;

  // Get the direct TCGPlayer URL from the prices API server-side
  const tcgplayerDirectUrl = await getDirectTCGPlayerUrl(card.id);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <Link 
          href={`/sets/${card.setId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {card.setName} Set
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card Image */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md relative aspect-[3/4] rounded-lg overflow-hidden shadow-xl border border-border/50">
            {largeImage ? (
              <Image
                src={largeImage}
                alt={card.name}
                fill
                className="object-contain p-2"
                priority
              />
            ) : smallImage ? (
              <Image
                src={smallImage}
                alt={card.name}
                fill
                className="object-contain p-2"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-xl text-muted-foreground">No image available</span>
              </div>
            )}
          </div>

          {/* TCGPlayer Link */}
          <div className="mt-6 flex gap-4">
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <a href={tcgplayerDirectUrl} target="_blank" rel="noopener noreferrer">
                <DollarSign className="h-4 w-4" />
                <span>Check Price on TCGPlayer</span>
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>

        {/* Card Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{card.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline">{card.supertype}</Badge>
              {card.subtypes && Array.isArray(card.subtypes) && card.subtypes.map((subtype: string) => (
                <Badge key={subtype} variant="secondary">{subtype}</Badge>
              ))}
              {card.hp && <Badge variant="destructive">HP {card.hp}</Badge>}
            </div>
          </div>

          {/* Types */}
          {card.types && Array.isArray(card.types) && card.types.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Type</h2>
              <div className="flex flex-wrap gap-2">
                {card.types.map((type: string) => (
                  <Badge 
                    key={type} 
                    className={getTypeClass(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Card Info */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Card Information</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-sm text-muted-foreground">Set</dt>
              <dd>{card.setName}</dd>
              
              <dt className="text-sm text-muted-foreground">Number</dt>
              <dd>#{card.number}</dd>
              
              <dt className="text-sm text-muted-foreground">Rarity</dt>
              <dd>{card.rarity}</dd>
              
              {card.artist && (
                <>
                  <dt className="text-sm text-muted-foreground">Artist</dt>
                  <dd>{card.artist}</dd>
                </>
              )}
              
              {card.nationalPokedexNumbers && Array.isArray(card.nationalPokedexNumbers) && card.nationalPokedexNumbers.length > 0 && (
                <>
                  <dt className="text-sm text-muted-foreground">Pokédex Number</dt>
                  <dd>{card.nationalPokedexNumbers.join(', ')}</dd>
                </>
              )}
            </dl>
          </Card>

          {/* Collection buttons - show for all users, but with different behavior */}
          <div className="flex flex-col space-y-4 mt-6">
            {userId ? (
              <>
                <CollectionButton 
                  cardId={card.id} 
                  isFullWidth 
                />
                <WishlistButton
                  cardId={card.id}
                  isFullWidth
                />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Sign in to Track in Collection
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="outline" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    Create Account to Start Collecting
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get type class
function getTypeClass(type: string): string {
  const typeClasses: Record<string, string> = {
    Colorless: "bg-gray-400 text-white",
    Darkness: "bg-purple-900 text-white",
    Dragon: "bg-indigo-600 text-white",
    Fairy: "bg-pink-400 text-white",
    Fighting: "bg-orange-700 text-white",
    Fire: "bg-red-600 text-white",
    Grass: "bg-green-600 text-white", 
    Lightning: "bg-yellow-500 text-black",
    Metal: "bg-gray-400 text-black",
    Psychic: "bg-purple-600 text-white",
    Water: "bg-blue-500 text-white",
  };
  
  return typeClasses[type] || "bg-gray-200 text-gray-800";
}