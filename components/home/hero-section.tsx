import React from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import prisma from '@/lib/prisma';
// Import the Card type from the types folder
import { Card, mapMongoCardToInterface } from '@/types';
// Import our new client component
import FeaturedCardGrid from './featured-card-grid';

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
export const revalidate = 'force-dynamic'; // 7 days in seconds

async function getFeaturedCards(): Promise<Card[]> {
  try {
    const cards = await prisma.card.findMany({
      where: {
        id: {
          in: FEATURED_CARD_IDS
        }
      }
    });
    
    // Sort cards to match the order in FEATURED_CARD_IDS and map to our Card type
    const sortedCards = FEATURED_CARD_IDS
      .map(id => cards.find(card => card.id === id))
      .filter(Boolean)
      .map(card => mapMongoCardToInterface(card));
    
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
              <Button size="lg" className="shadow-md bg-primary hover:bg-primary/90" asChild>
                <Link href="/collection">My Collection</Link>
              </Button>
            </SignedIn>
            <Button size="lg" variant="outline" className="shadow-sm hover:shadow-md" asChild>
              <Link href="/sets">Browse Sets</Link>
            </Button>
          </div>
          
          <div className="w-full max-w-3xl mx-auto mt-12 relative">
            <div className="relative h-64 sm:h-80 overflow-hidden rounded-xl shadow-lg">
              {/* Gradient overlay with pointer-events disabled */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary/10 to-violet-500/10 z-10"
                style={{ pointerEvents: 'none' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FeaturedCardGrid cards={cards} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;