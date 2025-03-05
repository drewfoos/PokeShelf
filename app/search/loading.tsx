import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

export default function SearchLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Search Cards</h1>
        <p className="text-muted-foreground">
          Search for Pokémon cards by name, set, type, and more
        </p>
      </div>
     
      <Separator />
     
      {/* Search Filters Skeleton with sort dropdown */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div>
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
        </div>
       
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-40 rounded-md" /> {/* Set filter */}
          <Skeleton className="h-10 w-40 rounded-md" /> {/* Type filter */}
          <Skeleton className="h-10 w-40 rounded-md" /> {/* Rarity filter */}
          <Skeleton className="h-10 w-40 rounded-md" /> {/* Sort dropdown */}
        </div>
      </div>
     
      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <Card key={i} className="overflow-hidden h-full">
            <div className="p-2">
              <Skeleton className="aspect-[3/4] rounded w-full" />
            </div>
            <CardContent className="p-3 pt-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
     
      {/* Pagination Skeleton */}
      <div className="flex items-center justify-center mt-8">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}