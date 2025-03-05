import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import SearchResults from '@/components/search/search-results';
import SearchFilters from '@/components/search/search-filters';
import { Separator } from '@/components/ui/separator';
import { Prisma } from '@prisma/client';
// Import types and utilities
import { Card, Pagination, SearchCardsRequest, mapMongoCardToInterface } from '@/types';

// Tell Next.js this should be a dynamic page that's not cached
export const revalidate = 86400;

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    set?: string;
    type?: string;
    rarity?: string;
  }>;
}

async function searchCards(params: Awaited<SearchPageProps['searchParams']>) {
  try {
    const { q = '', page = '1', set = '', type = '', rarity = '' } = params;

    // If no query provided at all, return empty results
    if (!q) {
      return {
        cards: [] as Card[],
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0
        } as Pagination
      };
    }

    // Build search filters with proper type from Prisma
    const filters: Prisma.CardWhereInput = {};

    // Search by name using fuzzy search (always on)
    if (q) {
      // Case-insensitive fuzzy search (contains)
      filters.name = {
        contains: q,
        mode: 'insensitive'
      };
    }

    // Filter by set if provided
    if (set && set !== 'all') {
      filters.setId = set;
    }

    // Filter by type if provided
    if (type && type !== 'all') {
      filters.types = {
        has: type
      };
    }

    // Filter by rarity if provided
    if (rarity && rarity !== 'all') {
      filters.rarity = rarity;
    }

    const pageNumber = parseInt(page);
    const pageSize = 20;
    const skip = (pageNumber - 1) * pageSize;

    // Execute search with pagination
    const [cardDocs, totalCount] = await Promise.all([
      prisma.card.findMany({
        where: filters,
        skip,
        take: pageSize,
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.card.count({
        where: filters
      })
    ]);

    // Convert MongoDB documents to our typed Card interface
    const cards: Card[] = cardDocs.map(mapMongoCardToInterface);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      cards,
      pagination: {
        page: pageNumber,
        pageSize,
        totalCount,
        totalPages
      } as Pagination
    };
  } catch (error) {
    console.error('Error searching cards:', error);
    return null;
  }
}

async function getFilterOptions() {
  try {
    // Get all available sets
    const sets = await prisma.set.findMany({
      select: {
        id: true,
        name: true,
        series: true
      },
      orderBy: {
        releaseDate: 'desc'
      }
    });

    // Get all available types (we need to do this differently because types is an array)
    const typesResult = await prisma.card.findMany({
      select: {
        types: true
      },
      distinct: ['types']
    });

    // Extract unique types from the result
    const typesSet = new Set<string>();
    typesResult.forEach(card => {
      card.types.forEach(type => typesSet.add(type));
    });
    const types = Array.from(typesSet).sort();

    // Get all available rarities
    const raritiesResult = await prisma.card.findMany({
      select: {
        rarity: true
      },
      distinct: ['rarity']
    });
    const rarities = raritiesResult.map(r => r.rarity).filter(Boolean).sort();

    return {
      sets,
      types,
      rarities
    };
  } catch (error) {
    console.error('Error getting filter options:', error);
    return null;
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // First await searchParams
  const resolvedSearchParams = await searchParams;

  // Process the search in parallel with getting filter options
  const [searchResults, filterOptions] = await Promise.all([
    searchCards(resolvedSearchParams),
    getFilterOptions()
  ]);

  // Handle errors
  if (!searchResults || !filterOptions) {
    notFound();
  }

  const { cards, pagination } = searchResults;
  const { q = '' } = resolvedSearchParams;
  const isInitialState = !q;

  // Convert string params to the correct types for SearchCardsRequest
  const typedSearchParams: SearchCardsRequest = {
    q: resolvedSearchParams.q || '',
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
    pageSize: 20,
    set: resolvedSearchParams.set || '',
    type: resolvedSearchParams.type || '',
    rarity: resolvedSearchParams.rarity || ''
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Search Cards</h1>
        <p className="text-muted-foreground">
          Search for Pokémon cards by name, set, type, and more
        </p>
      </div>

      <Separator />

      <SearchFilters 
        filterOptions={filterOptions} 
        currentFilters={resolvedSearchParams} 
      />

      <div className="mt-6">
        {isInitialState ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <h3 className="text-xl font-medium mb-2">Enter a search term</h3>
            <p className="text-muted-foreground">
              Search for a Pokémon card by name
            </p>
          </div>
        ) : pagination.totalCount === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <h3 className="text-xl font-medium mb-2">No cards found</h3>
            <p className="text-muted-foreground mb-4">
              No results match your search criteria.
            </p>
            <Link 
              href="/search"
              className="text-primary hover:underline"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <SearchResults 
            cards={cards} 
            pagination={pagination} 
            searchParams={typedSearchParams} 
          />
        )}
      </div>
    </div>
  );
}