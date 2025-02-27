'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterControlsProps {
  rarities: string[];
  types: string[];
  currentRarity: string;
  currentType: string;
  setId: string;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  rarities,
  types,
  currentRarity,
  currentType,
  setId
}) => {
  const router = useRouter();

  // Handle filter changes
  const handleFilterChange = (type: 'rarity' | 'type', value: string) => {
    // Create new URL with updated parameters
    const params = new URLSearchParams();
    
    // Reset to page 1 when changing filters
    params.set('page', '1');
    
    // Set rarity filter
    if (type === 'rarity') {
      if (value !== 'all') {
        params.set('rarity', value);
      }
      // Keep type filter if it exists
      if (currentType !== 'all') {
        params.set('type', currentType);
      }
    } else {
      // Set type filter
      if (value !== 'all') {
        params.set('type', value);
      }
      // Keep rarity filter if it exists
      if (currentRarity !== 'all') {
        params.set('rarity', currentRarity);
      }
    }
    
    // Navigate to the new URL
    router.push(`/sets/${setId}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* Rarity Filter */}
      {rarities.length > 0 && (
        <div className="flex items-center gap-2">
          <Select 
            defaultValue={currentRarity}
            onValueChange={(value) => handleFilterChange('rarity', value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              {rarities.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Type Filter */}
      {types.length > 0 && (
        <div className="flex items-center gap-2">
          <Select 
            defaultValue={currentType}
            onValueChange={(value) => handleFilterChange('type', value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};