'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Modified Set stat interface to be more flexible with null values
interface SetStat {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  totalInSet: number;
  cardsInCollection: number;
  percentComplete: number;
  estimatedValue: number;
  images: {
    symbol?: string;
    logo?: string;
  } | null; // Allow null for images
}

interface CollectionSetViewProps {
  sets: SetStat[];
}

export default function CollectionSetView({ sets }: CollectionSetViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'completion' | 'releaseDate' | 'value' | 'name'>('completion');
  
  // Sort and filter the sets
  const filteredSets = sets
    .filter(set => 
      set.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      set.series.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'completion':
          return b.percentComplete - a.percentComplete;
        case 'releaseDate':
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        case 'value':
          return b.estimatedValue - a.estimatedValue;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Sort by: {getSortLabel(sortBy)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('completion')}>
                Completion %
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('releaseDate')}>
                Release Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('value')}>
                Estimated Value
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Set Name
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {filteredSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSets.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No sets found matching your search.</p>
        </div>
      )}
    </div>
  );
}

// Helper to get the sort label
function getSortLabel(sortBy: string): string {
  switch (sortBy) {
    case 'completion': return 'Completion';
    case 'releaseDate': return 'Release Date';
    case 'value': return 'Value';
    case 'name': return 'Name';
    default: return 'Completion';
  }
}

// Individual set card component
function SetCard({ set }: { set: SetStat }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="relative bg-gradient-to-r from-primary/5 to-primary/10 p-4">
          <div className="flex items-center gap-4">
            {/* Set Logo */}
            <div className="h-16 w-16 relative flex items-center justify-center bg-white/20 rounded-lg overflow-hidden">
              {set.images?.logo ? (
                <Image
                  src={set.images.logo}
                  alt={set.name}
                  width={64}
                  height={64}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="text-2xl font-bold text-primary/40">{set.name.charAt(0)}</div>
              )}
              
              {/* Set Symbol (Small) */}
              {set.images?.symbol && (
                <div className="absolute bottom-0 right-0 h-6 w-6 bg-white/80 rounded-tl overflow-hidden flex items-center justify-center">
                  <Image
                    src={set.images.symbol}
                    alt={`${set.name} symbol`}
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-md truncate">{set.name}</h3>
              <p className="text-sm text-muted-foreground">{set.series} · {formatReleaseDate(set.releaseDate)}</p>
              
              <div className="flex justify-between mt-2 items-center text-xs">
                <span>Progress:</span>
                <span className="font-medium">
                  {set.cardsInCollection} / {set.totalInSet} cards ({Math.round(set.percentComplete)}%)
                </span>
              </div>
              <Progress value={set.percentComplete} className="h-1.5 mt-1" />
            </div>
          </div>
          
          <div className="flex justify-between mt-4 pt-3 border-t border-border/30">
            <div className="text-xs">
              <span className="text-muted-foreground">Estimated Value:</span>
              <span className="ml-1 font-medium">{formatPrice(set.estimatedValue)}</span>
            </div>
            
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/sets/${set.id}`}>
                View Set
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to format the release date
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