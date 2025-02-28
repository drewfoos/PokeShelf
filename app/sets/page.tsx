import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { ChevronLeft } from 'lucide-react';

// Make this page dynamic to get fresh data
export const dynamic = 'force-dynamic';

async function getAllSets() {
  try {
    const sets = await prisma.set.findMany({
      orderBy: {
        releaseDate: 'desc',
      },
    });
    
    return sets;
  } catch (error) {
    console.error('Error fetching sets:', error);
    return [];
  }
}

export default async function SetsPage() {
  const sets = await getAllSets();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-6">All Pokémon Card Sets</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sets.map((set) => (
          <Link href={`/sets/${set.id}`} key={set.id} className="block">
            <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-border/50 h-full">
              <div className="aspect-video relative bg-gradient-to-br from-primary/5 to-transparent p-4 flex items-center justify-center">
                {set.images && typeof set.images === 'object' && set.images !== null && 
                 'logo' in set.images && typeof set.images.logo === 'string' ? (
                  <div className="relative w-full h-24">
                    <Image 
                      src={set.images.logo}
                      alt={`${set.name} logo`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      priority
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary/40">
                      {set.name.charAt(0)}
                    </span>
                  </div>
                )}
                
                {set.images && typeof set.images === 'object' && set.images !== null && 
                 'symbol' in set.images && typeof set.images.symbol === 'string' && (
                  <div className="absolute bottom-3 right-3 h-8 w-8">
                    <Image 
                      src={set.images.symbol}
                      alt={`${set.name} symbol`}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold mb-1">{set.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {set.series} • {set.printedTotal} cards
                </p>
                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  <span>Released: {formatReleaseDate(set.releaseDate)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Helper function to format the release date
function formatReleaseDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}
