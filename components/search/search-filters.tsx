'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface FilterOptionsType {
  sets: Array<{
    id: string;
    name: string;
    series: string;
  }>;
  types: string[];
  rarities: string[];
}

interface CurrentFiltersType {
  q?: string;
  set?: string;
  type?: string;
  rarity?: string;
  page?: string;
}

interface SearchFiltersProps {
  filterOptions: FilterOptionsType;
  currentFilters: CurrentFiltersType;
}

export default function SearchFilters({ 
  filterOptions,
  currentFilters 
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [searchTerm, setSearchTerm] = useState(currentFilters.q || '');
  const [selectedSet, setSelectedSet] = useState(currentFilters.set || 'all');
  const [selectedType, setSelectedType] = useState(currentFilters.type || 'all');
  const [selectedRarity, setSelectedRarity] = useState(currentFilters.rarity || 'all');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    const params = new URLSearchParams();
    
    // Add search term
    params.set('q', searchTerm.trim());
    
    // Add filters if selected
    if (selectedSet && selectedSet !== 'all') params.set('set', selectedSet);
    if (selectedType && selectedType !== 'all') params.set('type', selectedType);
    if (selectedRarity && selectedRarity !== 'all') params.set('rarity', selectedRarity);
    
    // Reset to page 1 when applying new filters
    params.set('page', '1');
    
    // Update URL with filters
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  };
  
  const clearFilters = () => {
    // Only keep the search term
    startTransition(() => {
      if (searchTerm) {
        router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
      } else {
        router.push('/search');
      }
    });
    
    // Reset state
    setSelectedSet('all');
    setSelectedType('all');
    setSelectedRarity('all');
  };
  
  const hasFilters = (selectedSet && selectedSet !== 'all') || 
                  (selectedType && selectedType !== 'all') || 
                  (selectedRarity && selectedRarity !== 'all');
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Input
            type="search"
            placeholder="Search for a card name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <Button type="submit" disabled={!searchTerm.trim() || isPending}>
          {isPending ? 'Searching...' : 'Search'}
        </Button>
      </form>
      
      <div className="flex flex-wrap gap-3 items-center">
        {/* Set Filter */}
        <Select 
          value={selectedSet} 
          onValueChange={setSelectedSet}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a set" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sets</SelectItem>
            {filterOptions.sets.map((set) => (
              <SelectItem key={set.id} value={set.id}>
                {set.name} ({set.series})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Type Filter */}
        <Select 
          value={selectedType} 
          onValueChange={setSelectedType}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {filterOptions.types.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Rarity Filter */}
        <Select 
          value={selectedRarity} 
          onValueChange={setSelectedRarity}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select a rarity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rarities</SelectItem>
            {filterOptions.rarities.map((rarity) => (
              <SelectItem key={rarity} value={rarity}>
                {rarity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Removed fuzzy search checkbox - fuzzy search is now always on */}
        
        {/* Clear Filters Button - only show if filters are applied */}
        {hasFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
      
      {/* Applied filters explanation */}
      {hasFilters && (
        <div className="text-sm text-muted-foreground pt-2">
          <p>
            <span className="font-medium">Applied filters:</span>{' '}
            {selectedSet && selectedSet !== 'all' && <span>Set: {filterOptions.sets.find(s => s.id === selectedSet)?.name}</span>}
            {selectedType && selectedType !== 'all' && <span>{selectedSet && selectedSet !== 'all' ? ', ' : ''}Type: {selectedType}</span>}
            {selectedRarity && selectedRarity !== 'all' && <span>{(selectedSet && selectedSet !== 'all') || (selectedType && selectedType !== 'all') ? ', ' : ''}Rarity: {selectedRarity}</span>}
          </p>
        </div>
      )}
      
      <Separator />
    </div>
  );
}