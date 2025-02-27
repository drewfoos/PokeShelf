import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import CardGrid from '@/components/cards/cards-grid';
import { Button } from '@/components/ui/button';
import { FilterControls } from './filter-controls';

// Make this page dynamic to get fresh data
export const dynamic = 'force-dynamic';

interface SearchParams {
  page?: string;
  rarity?: string;
  type?: string;
}

async function getSet(id: string) {
  try {
    const set = await prisma.set.findUnique({
      where: { id },
    });
    
    if (!set) {
      return null;
    }
    
    return set;
  } catch (error) {
    console.error(`Error fetching set ${id}:`, error);
    return null;
  }
}

async function getSetCards(setId: string, page = 1, filters: { rarity?: string, type?: string } = {}) {
  try {
    const pageSize = 20; // Number of cards per page
    const skip = (page - 1) * pageSize;
    
    // Build filter object
    const filter: any = { setId };
    
    if (filters.rarity && filters.rarity !== "all") {
      filter.rarity = filters.rarity;
    }
    
    if (filters.type && filters.type !== "all") {
      filter.types = { has: filters.type };
    }
    
    // Exclude "Unknown" rarity if not specifically filtered for it
    if (!filters.rarity || filters.rarity === "all") {
      filter.rarity = { not: "Unknown" };
    }
    
    // Get cards with pagination
    const [cards, totalCount] = await Promise.all([
      prisma.card.findMany({
        where: filter,
        orderBy: { number: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.card.count({
        where: filter,
      }),
    ]);
    
    // Get unique rarities for this set
    const rarities = await prisma.card.findMany({
      where: { setId },
      select: { rarity: true },
      distinct: ['rarity'],
    });
    
    // Get unique types for this set
    const types = await prisma.card.findMany({
      where: { setId },
      select: { types: true },
    });
    
    // Extract unique types from the results
    const uniqueTypes = new Set<string>();
    types.forEach(card => {
      if (card.types && Array.isArray(card.types)) {
        card.types.forEach(type => uniqueTypes.add(type));
      }
    });
    
    return {
      cards,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      filters: {
        rarities: rarities.map(r => r.rarity).filter(r => r !== "Unknown").sort(),
        types: Array.from(uniqueTypes).sort(),
      }
    };
  } catch (error) {
    console.error(`Error fetching cards for set ${setId}:`, error);
    return {
      cards: [],
      pagination: {
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      },
      filters: {
        rarities: [],
        types: [],
      }
    };
  }
}

export default async function SetDetailPage({
    params,
    searchParams,
  }: {
    params: any;
    searchParams: any;
  }) {
    // Await the parameters to resolve them
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
  
    // Now access the properties directly (they’re plain objects)
    const pageParam = resolvedSearchParams.page;
    const rarityParam = resolvedSearchParams.rarity;
    const typeParam = resolvedSearchParams.type;
  
    const page = pageParam ? parseInt(pageParam) : 1;
    const rarity = rarityParam || 'all';
    const type = typeParam || 'all';
  
    const setId = resolvedParams.id;
  
    const [set, cardsData] = await Promise.all([
      getSet(setId),
      getSetCards(setId, page, { rarity, type }),
    ]);
  
    if (!set) {
      notFound();
    }
  
  const { cards, pagination, filters } = cardsData;
  
  // Get the logo and symbol URLs if they exist
  const logo = set.images && typeof set.images === 'object' && set.images !== null && 
    'logo' in set.images && typeof set.images.logo === 'string' ? set.images.logo : null;
    
  const symbol = set.images && typeof set.images === 'object' && set.images !== null && 
    'symbol' in set.images && typeof set.images.symbol === 'string' ? set.images.symbol : null;
  
  // Generate pagination URLs
  const createPageUrl = (newPage: number, newRarity?: string, newType?: string) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    
    if (newRarity && newRarity !== 'all') {
      params.set('rarity', newRarity);
    }
    
    if (newType && newType !== 'all') {
      params.set('type', newType);
    }
    
    return `?${params.toString()}`;
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <Link 
          href="/sets" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Sets
        </Link>
      </div>
      
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Set Logo */}
            <div className="w-full max-w-xs flex items-center justify-center">
              {logo ? (
                <div className="relative w-full h-40">
                  <Image 
                    src={logo}
                    alt={`${set.name} logo`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <div className="w-40 h-40 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-6xl font-bold text-primary/40">
                    {set.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Set Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl md:text-4xl font-bold">{set.name}</h1>
                {symbol && (
                  <div className="h-8 w-8">
                    <Image 
                      src={symbol}
                      alt={`${set.name} symbol`}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
              
              <p className="text-lg text-muted-foreground mt-2">
                {set.series} Series
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 max-w-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cards</p>
                  <p className="text-xl font-medium">{set.printedTotal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Release Date</p>
                  <p className="text-xl font-medium">{formatReleaseDate(set.releaseDate)}</p>
                </div>
                {set.ptcgoCode && (
                  <div>
                    <p className="text-sm text-muted-foreground">Code</p>
                    <p className="text-xl font-medium">{set.ptcgoCode}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Cards in this set</h2>
          
          {/* Filters - now using a client component for interactivity */}
          <FilterControls 
            rarities={filters.rarities} 
            types={filters.types}
            currentRarity={rarity}
            currentType={type}
            setId={setId}
          />
        </div>
        
        {/* Cards */}
        <CardGrid cards={cards} />
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} cards
            </div>
            
            <div className="flex items-center gap-2">
              {pagination.page > 1 && (
                <Link href={createPageUrl(pagination.page - 1, rarity, type)}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                </Link>
              )}
              
              {pagination.page < pagination.totalPages && (
                <Link href={createPageUrl(pagination.page + 1, rarity, type)}>
                  <Button variant="outline" size="sm">
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
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
  } catch (error) {
    return dateString;
  }
}