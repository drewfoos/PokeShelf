import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import prisma from '@/lib/prisma'
import CardGrid from '@/components/cards/cards-grid'
import { FilterControls } from './filter-controls'
import { Prisma } from '@prisma/client'
// Import standardized types
import { Card, mapMongoCardToInterface, mapMongoSetToInterface } from '@/types'
import type { Set as PokemonSet } from '@/types'

export const revalidate = 604800;

// Fetch a specific Set from the database
async function getSet(id: string): Promise<PokemonSet | null> {
  try {
    const set = await prisma.set.findUnique({
      where: { id },
    })
    return set ? mapMongoSetToInterface(set) : null
  } catch (error) {
    console.error(`Error fetching set ${id}:`, error)
    return null
  }
}


// Fetch ALL Cards in a Set with filtering (no pagination)
async function getSetCards(
  setId: string,
  filters: { rarity?: string; type?: string } = {}
) {
  try {
    // Build filter using Prisma's CardWhereInput
    const filter: Prisma.CardWhereInput = { setId }

    if (filters.rarity && filters.rarity !== 'all') {
      filter.rarity = filters.rarity
    }

    if (filters.type && filters.type !== 'all') {
      filter.types = { has: filters.type }
    }

    // Get ALL cards for this set that match the filters (without pagination)
    const [allCardDocs, totalCount] = await Promise.all([
      prisma.card.findMany({
        where: filter,
      }),
      prisma.card.count({ where: filter }),
    ])
    
    // Convert MongoDB documents to our typed Card interface
    const allCards: Card[] = allCardDocs.map(mapMongoCardToInterface);
    
    // Sort all cards by number properly
    allCards.sort((a, b) => {
      return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Get unique rarities for dropdown
    const rarities = await prisma.card.findMany({
      where: { setId },
      select: { rarity: true },
      distinct: ['rarity'],
    })

    // Get unique types for dropdown
    const typesArray = await prisma.card.findMany({
      where: { setId },
      select: { types: true },
    })

    const uniqueTypes = new Set<string>()
    typesArray.forEach((card) => {
      card.types?.forEach((type) => uniqueTypes.add(type))
    })

    return {
      cards: allCards,
      totalCount,
      filters: {
        rarities: rarities
          .map((r) => r.rarity)
          .filter((r) => r !== 'Unknown')
          .sort(),
        types: Array.from(uniqueTypes).sort(),
      },
    }
  } catch (error) {
    console.error(`Error fetching cards for set ${setId}:`, error)
    return {
      cards: [],
      totalCount: 0,
      filters: {
        rarities: [],
        types: [],
      },
    }
  }
}

type SetParams = { id: string }
type SetSearchParams = {
  rarity?: string
  type?: string
}

// The page component must be async in Next.js 15 for dynamic APIs
export default async function SetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<SetParams> // Now a Promise
  searchParams: Promise<SetSearchParams> // Also a Promise
}) {
  // Await them *before* destructuring
  const { id: setId } = await params
  const { rarity: rarityParam, type: typeParam } = await searchParams

  const rarity = rarityParam ?? 'all'
  const type = typeParam ?? 'all'

  // Fetch the set and its cards concurrently
  const [set, cardsData] = await Promise.all([
    getSet(setId),
    getSetCards(setId, { rarity, type }),
  ])

  if (!set) {
    notFound()
  }

  const { cards, totalCount, filters } = cardsData

  // Get logo/symbol using our strongly typed interface
  const logo = set.images?.logo || null
  const symbol = set.images?.symbol || null

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
                    priority={true}
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 400px"
                    quality={75}
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
                      unoptimized
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
                  <p className="text-xl font-medium">
                    {formatReleaseDate(set.releaseDate)}
                  </p>
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
          <div>
            <h2 className="text-2xl font-bold">Cards in this set</h2>
            <p className="text-muted-foreground">
              {totalCount} cards {(rarity !== 'all' || type !== 'all') ? '(filtered)' : ''}
            </p>
          </div>

          {/* Filters - a client component for interactivity */}
          <FilterControls
            rarities={filters.rarities}
            types={filters.types}
            currentRarity={rarity}
            currentType={type}
            setId={setId}
          />
        </div>

        {/* Render the card grid with all cards */}
        <CardGrid cards={cards} />
      </div>
    </div>
  )
}

// Helper function to format the release date
function formatReleaseDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}