import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronLeft, Heart, TrendingUp, Info, Sparkles } from 'lucide-react';
import { auth } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CollectionButton from '@/components/collection/collection-button';
import WishlistButton from '@/components/wishlist/wishlist-button';
import { formatPrice } from '@/lib/utils';

// Make this page dynamic
export const dynamic = 'force-dynamic';

// Define interfaces for TCGPlayer data
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
}

interface TCGPlayerData {
  url: string;
  updatedAt: string;
  prices?: TCGPlayerPrices;
}

// Add this utility function to extract price data
function getCardPrice(tcgplayer: TCGPlayerData | null, isFoil: boolean = false, isFirstEdition: boolean = false): number | null {
  if (!tcgplayer || !tcgplayer.prices) return null;
  
  const prices = tcgplayer.prices;
  
  // Try to get the appropriate price based on card properties
  if (isFirstEdition && prices['1stEditionHolofoil']) {
    return prices['1stEditionHolofoil'].market || null;
  }
  
  if (isFoil && prices.holofoil) {
    return prices.holofoil.market || null;
  }
  
  if (isFoil && prices.reverseHolofoil) {
    return prices.reverseHolofoil.market || null;
  }
  
  // Default to normal price
  if (prices.normal) {
    return prices.normal.market || null;
  }
  
  // If no appropriate price is found, return null
  return null;
}

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

  // Cast the tcgplayer data to your interface
  const tcgplayer = card.tcgplayer ? (card.tcgplayer as unknown as TCGPlayerData) : null;
  const prices = tcgplayer?.prices || {};
  const hasPrice = !!(prices.normal || prices.holofoil || prices.reverseHolofoil || prices['1stEditionHolofoil']);
  
  // Get market price for display in header
  const marketPrice = getCardPrice(tcgplayer);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <Link 
          href={`/sets/${card.setId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {card.setName} Set
        </Link>
      </div>

      {/* Header with card name, set info, and type */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{card.name}</h1>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <span>{card.setName} · #{card.number} · {card.rarity}</span>
              {marketPrice && (
                <Badge variant="outline" className="ml-3 bg-primary/10 border-primary/30 text-primary">
                  {formatPrice(marketPrice)}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
            {card.types && Array.isArray(card.types) && card.types.map((type: string) => (
              <Badge 
                key={type} 
                className={`${getTypeClass(type)} text-sm px-3 py-1`}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card Image and Direct Actions */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md relative aspect-[3/4] rounded-xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300 border border-primary/10 group">
            {largeImage ? (
              <Image
                src={largeImage}
                alt={card.name}
                fill
                className="object-contain p-2 transition-transform duration-700"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : smallImage ? (
              <Image
                src={smallImage}
                alt={card.name}
                fill
                className="object-contain p-2 transition-transform duration-700"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-xl text-muted-foreground">No image available</span>
              </div>
            )}
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="absolute -inset-x-full top-0 h-[500px] transform-gpu bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all ease-out duration-1500"></div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col w-full max-w-md space-y-3">
            {userId ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <CollectionButton 
                    cardId={card.id} 
                    variant="default"
                    size="lg"
                  />
                  <WishlistButton
                    cardId={card.id}
                    variant="secondary"
                    size="lg"
                  />
                </div>
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button className="w-full h-12">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Sign in to Track Collection
                  </Button>
                </SignInButton>
              </>
            )}
          </div>
        </div>

        {/* Card Details */}
        <div className="space-y-6">
          {/* Card Info Card */}
          <Card className="p-6 border-primary/10 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-5">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Card Information</h2>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-sm text-muted-foreground mb-1">Supertype</dt>
                <dd className="font-medium">{card.supertype}</dd>
              </div>
              
              {card.subtypes && Array.isArray(card.subtypes) && card.subtypes.length > 0 && (
                <div>
                  <dt className="text-sm text-muted-foreground mb-1">Subtypes</dt>
                  <dd className="font-medium">{card.subtypes.join(', ')}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm text-muted-foreground mb-1">Set</dt>
                <dd className="font-medium">{card.setName}</dd>
              </div>
              
              <div>
                <dt className="text-sm text-muted-foreground mb-1">Number</dt>
                <dd className="font-medium">#{card.number}</dd>
              </div>
              
              <div>
                <dt className="text-sm text-muted-foreground mb-1">Rarity</dt>
                <dd className="font-medium">{card.rarity}</dd>
              </div>
              
              {card.hp && (
                <div>
                  <dt className="text-sm text-muted-foreground mb-1">HP</dt>
                  <dd className="font-medium">{card.hp}</dd>
                </div>
              )}
              
              {card.artist && (
                <div className="col-span-2">
                  <dt className="text-sm text-muted-foreground mb-1">Artist</dt>
                  <dd className="font-medium">{card.artist}</dd>
                </div>
              )}
              
              {card.nationalPokedexNumbers && Array.isArray(card.nationalPokedexNumbers) && card.nationalPokedexNumbers.length > 0 && (
                <div className="col-span-2">
                  <dt className="text-sm text-muted-foreground mb-1">Pokédex Number</dt>
                  <dd className="font-medium">{card.nationalPokedexNumbers.join(', ')}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Price Information */}
          {hasPrice && (
            <Card className="p-6 border-primary/10 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Price Information</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {prices.normal?.market && (
                  <div className="bg-muted/40 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-sm text-muted-foreground mb-1">Normal</div>
                    <div className="text-2xl font-bold text-primary">{formatPrice(prices.normal.market)}</div>
                    <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                      <span>Low: {formatPrice(prices.normal.low)}</span>
                      <span>High: {formatPrice(prices.normal.high)}</span>
                    </div>
                  </div>
                )}
                
                {prices.holofoil?.market && (
                  <div className="bg-muted/40 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-sm text-muted-foreground mb-1">Holofoil</div>
                    <div className="text-2xl font-bold text-primary">{formatPrice(prices.holofoil.market)}</div>
                    <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                      <span>Low: {formatPrice(prices.holofoil.low)}</span>
                      <span>High: {formatPrice(prices.holofoil.high)}</span>
                    </div>
                  </div>
                )}
                
                {prices.reverseHolofoil?.market && (
                  <div className="bg-muted/40 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-sm text-muted-foreground mb-1">Reverse Holofoil</div>
                    <div className="text-2xl font-bold text-primary">{formatPrice(prices.reverseHolofoil.market)}</div>
                    <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                      <span>Low: {formatPrice(prices.reverseHolofoil.low)}</span>
                      <span>High: {formatPrice(prices.reverseHolofoil.high)}</span>
                    </div>
                  </div>
                )}
                
                {prices['1stEditionHolofoil']?.market && (
                  <div className="bg-muted/40 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-sm text-muted-foreground mb-1">1st Edition</div>
                    <div className="text-2xl font-bold text-primary">{formatPrice(prices['1stEditionHolofoil'].market)}</div>
                    <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                      <span>Low: {formatPrice(prices['1stEditionHolofoil'].low)}</span>
                      <span>High: {formatPrice(prices['1stEditionHolofoil'].high)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg text-sm text-muted-foreground">
                <p>Prices as of {new Date(card.lastUpdated).toLocaleDateString()}. For current prices, check <a href={tcgplayerDirectUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">TCGPlayer</a>.</p>
              </div>
            </Card>
          )}
          
          {/* Sign Up Prompt (only for non-logged in users) */}
          {!userId && (
            <Card className="p-6 border-primary/20 bg-primary/5 shadow-lg">
              <div className="flex flex-col items-center text-center">
                <Heart className="h-10 w-10 text-primary mb-3" />
                <h3 className="text-xl font-bold mb-2">Start Your Collection Today</h3>
                <p className="text-muted-foreground mb-4">
                  Create an account to track your cards, monitor values, and build your Pokémon collection.
                </p>
                <SignUpButton mode="modal">
                  <Button variant="default" className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create a Free Account
                  </Button>
                </SignUpButton>
              </div>
            </Card>
          )}
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