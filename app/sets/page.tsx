import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { ChevronLeft } from 'lucide-react';

// Make this page dynamic to get fresh data
export const dynamic = 'force-dynamic';

// Get all sets grouped by series
async function getAllSetsGroupedBySeries() {
  try {
    const sets = await prisma.set.findMany({
      orderBy: [
        { series: 'asc' },
        { releaseDate: 'desc' },
      ],
    });
    
    // Group the sets by their series
    const groupedSets = sets.reduce((groups, set) => {
      const series = set.series || 'Other';
      if (!groups[series]) {
        groups[series] = [];
      }
      groups[series].push(set);
      return groups;
    }, {} as Record<string, typeof sets>);
    
    // Sort the series keys to ensure consistent order
    // Move some important series to the top
    const sortedSeries = Object.keys(groupedSets).sort((a, b) => {
      const prioritySeries = ['Scarlet & Violet', 'Sword & Shield', 'Sun & Moon', 'XY'];
      const aPriority = prioritySeries.indexOf(a);
      const bPriority = prioritySeries.indexOf(b);
      
      if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      return a.localeCompare(b);
    });
    
    return { groupedSets, sortedSeries };
  } catch (error) {
    console.error('Error fetching sets:', error);
    return { groupedSets: {}, sortedSeries: [] };
  }
}

export default async function SetsPage() {
  const { groupedSets, sortedSeries } = await getAllSetsGroupedBySeries();
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-6">All Pokémon Card Sets</h1>
      
      {sortedSeries.map(series => (
        <div key={series} className="mb-10">
          {/* Modified sticky header with proper offset and z-index */}
          <div className="sticky top-[72px] z-20 mb-4 pt-1"> {/* Added padding-top to create visual space */}
            <div className="bg-gradient-to-r from-primary/80 to-primary/40 rounded-lg shadow-md">
              <div className="px-4 py-3 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">{series}</h2>
              </div>
            </div>
          </div>
          
          {/* Enhanced grid for better mobile display - 2 columns on mobile, up to 4 on large screens */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {groupedSets[series].map((set) => (
              <Link href={`/sets/${set.id}`} key={set.id} className="block">
                <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-border/50 h-full">
                  {/* Adjusted aspect ratio to minimize vertical space on mobile */}
                  <div className="aspect-[3/2] sm:aspect-video relative bg-gradient-to-br from-primary/5 to-transparent p-3 sm:p-4 flex items-center justify-center">
                    {set.images && typeof set.images === 'object' && set.images !== null && 
                     'logo' in set.images && typeof set.images.logo === 'string' ? (
                      <div className="relative w-full h-16 sm:h-24">
                        <Image 
                          src={set.images.logo}
                          alt={`${set.name} logo`}
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          priority={false}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold text-primary/40">
                          {set.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    
                    {set.images && typeof set.images === 'object' && set.images !== null && 
                     'symbol' in set.images && typeof set.images.symbol === 'string' && (
                      <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 h-6 w-6 sm:h-8 sm:w-8">
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
                  
                  {/* More compact content section for mobile */}
                  <div className="p-2 sm:p-3 md:p-4">
                    <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1 line-clamp-1" title={set.name}>
                      {set.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                      {set.printedTotal} cards • {formatReleaseDate(set.releaseDate)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
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
    });
  } catch {
    return dateString;
  }
}