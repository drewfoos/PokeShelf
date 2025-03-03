import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import prisma from '@/lib/prisma';
import { JsonValue } from '@prisma/client/runtime/library';

// Interface matching the Prisma Card model
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
  images: JsonValue;
  tcgplayer: JsonValue | null;
  lastUpdated: Date;
}

// Static list of featured card IDs - including Base Set Charizard
const FEATURED_CARD_IDS = [
  'base1-4',
  'base1-3',
  'base1-2',
  'base1-1',
  'base1-5',
  'base1-6',
  'base1-7',
  'base1-8',
  'base1-9',
  'base1-10'
];

// Cache this component for a week
export const revalidate = 604800; // 7 days in seconds

async function getFeaturedCards() {
  try {
    const cards = await prisma.card.findMany({
      where: {
        id: {
          in: FEATURED_CARD_IDS
        }
      }
    });
    
    // Sort cards to match the order in FEATURED_CARD_IDS
    const sortedCards = FEATURED_CARD_IDS
      .map(id => cards.find(card => card.id === id))
      .filter((card): card is CardType => card !== undefined);
    
    return sortedCards;
  } catch (error) {
    console.error('Error fetching featured cards:', error);
    return [];
  }
}

const HeroSection = async () => {
  const cards = await getFeaturedCards();
  
  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 to-transparent rounded-xl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Track Your Pokémon Card Collection
            </h1>
            <p className="text-xl text-muted-foreground mx-auto">
              Organize, track values, and manage your entire Pokémon TCG collection in one place.
            </p>
          </div>
         
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="shadow-md bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/collection">
                <Button size="lg" className="shadow-md bg-primary hover:bg-primary/90">
                  My Collection
                </Button>
              </Link>
            </SignedIn>
            <Link href="/sets" prefetch={false}>
              <Button size="lg" variant="outline" className="shadow-sm hover:shadow-md">
                Browse Sets
              </Button>
            </Link>
          </div>
          
          <div className="w-full max-w-3xl mx-auto mt-12 relative">
            <div className="relative h-64 sm:h-80 overflow-hidden rounded-xl shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-violet-500/10 z-10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {cards.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 p-4 transform rotate-3">
                    {cards.map((card, i) => {
                      // Extract large image URL when available for better quality
                      let cardImage = null;
                      if (card.images && typeof card.images === 'object' && card.images !== null) {
                        // First try to get large image for better quality
                        if ('large' in card.images && typeof card.images.large === 'string') {
                          cardImage = card.images.large;
                        } 
                        // Fall back to small image if large is not available
                        else if ('small' in card.images && typeof card.images.small === 'string') {
                          cardImage = card.images.small;
                        }
                      }
                      
                      return (
                        <Link href={`/card/${card.id}`} prefetch={false} key={card.id}>
                          <div 
                            className="w-24 h-32 rounded-lg bg-white shadow-md transform transition-transform hover:scale-105 overflow-hidden"
                            style={{ 
                              transformOrigin: 'center', 
                              transform: `rotate(${(i % 2 === 0 ? 2 : -2)}deg)` 
                            }}
                          >
                            {cardImage ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={cardImage}
                                  alt={card.name}
                                  fill
                                  className="object-contain p-0.5"
                                  sizes="96px"
                                  priority={i < 3} // Load first 3 cards with priority
                                  quality={75}
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">{card.name}</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  // Fallback placeholders if no cards are found
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 p-4 transform rotate-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-24 h-32 rounded-lg bg-white shadow-md transform transition-transform"
                        style={{
                          transformOrigin: 'center',
                          transform: `rotate(${(i % 2 === 0 ? 2 : -2)}deg)`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;