'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CollectionFiltersProps {
  filters: {
    sets?: Array<{ id: string; name: string }>;
    rarities?: string[];
    types?: string[];
    variants?: string[];
    conditions?: string[];
  };
  currentFilters: {
    set?: string;
    rarity?: string;
    type?: string;
    variant?: string;
    condition?: string;
  };
}

export default function CollectionFilters({ filters, currentFilters }: CollectionFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Local state for filters
  const [setId, setSetId] = useState(currentFilters.set || '');
  const [rarity, setRarity] = useState(currentFilters.rarity || '');
  const [type, setType] = useState(currentFilters.type || '');
  const [variant, setVariant] = useState(currentFilters.variant || '');
  const [condition, setCondition] = useState(currentFilters.condition || '');

  // Apply filters when the filter button is clicked
  const applyFilters = useCallback(() => {
    // Build URL parameters
    const params = new URLSearchParams();
    
    if (setId) params.set('set', setId);
    if (rarity) params.set('rarity', rarity);
    if (type) params.set('type', type);
    if (variant) params.set('variant', variant);
    if (condition) params.set('condition', condition);
    
    // Navigate with filters
    startTransition(() => {
      router.push(`/collection/manage?${params.toString()}`);
    });
  }, [setId, rarity, type, variant, condition, router]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSetId('');
    setRarity('');
    setType('');
    setVariant('');
    setCondition('');
    
    startTransition(() => {
      router.push('/collection/manage');
    });
  }, [router]);

  // Count active filters
  const activeFilterCount = [
    setId, rarity, type, variant, condition
  ].filter(Boolean).length;

  // List of active filters for display
  const getActiveFilters = () => {
    const active = [];
    
    if (setId && filters.sets) {
      const setName = filters.sets.find(s => s.id === setId)?.name || setId;
      active.push({ key: 'set', label: `Set: ${setName}` });
    }
    
    if (rarity) {
      active.push({ key: 'rarity', label: `Rarity: ${rarity}` });
    }
    
    if (type) {
      active.push({ key: 'type', label: `Type: ${type}` });
    }
    
    if (variant) {
      active.push({ key: 'variant', label: `Variant: ${variant}` });
    }
    
    if (condition) {
      active.push({ key: 'condition', label: `Condition: ${condition}` });
    }
    
    return active;
  };

  // Remove a single filter
  const removeFilter = (key: string) => {
    switch (key) {
      case 'set':
        setSetId('');
        break;
      case 'rarity':
        setRarity('');
        break;
      case 'type':
        setType('');
        break;
      case 'variant':
        setVariant('');
        break;
      case 'condition':
        setCondition('');
        break;
    }
    
    // Reapply the remaining filters
    const params = new URLSearchParams();
    if (key !== 'set' && setId) params.set('set', setId);
    if (key !== 'rarity' && rarity) params.set('rarity', rarity);
    if (key !== 'type' && type) params.set('type', type);
    if (key !== 'variant' && variant) params.set('variant', variant);
    if (key !== 'condition' && condition) params.set('condition', condition);
    
    startTransition(() => {
      router.push(`/collection/manage?${params.toString()}`);
    });
  };

  // Load current filters on initial render
  useEffect(() => {
    setSetId(currentFilters.set || '');
    setRarity(currentFilters.rarity || '');
    setType(currentFilters.type || '');
    setVariant(currentFilters.variant || '');
    setCondition(currentFilters.condition || '');
  }, [currentFilters]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Set Filter */}
        <div className="space-y-2">
          <Label htmlFor="set-filter">Set</Label>
          <Select value={setId} onValueChange={setSetId}>
            <SelectTrigger id="set-filter">
              <SelectValue placeholder="All Sets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sets</SelectItem>
              {filters.sets?.map((set) => (
                <SelectItem key={set.id} value={set.id}>
                  {set.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Rarity Filter */}
        <div className="space-y-2">
          <Label htmlFor="rarity-filter">Rarity</Label>
          <Select value={rarity} onValueChange={setRarity}>
            <SelectTrigger id="rarity-filter">
              <SelectValue placeholder="All Rarities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Rarities</SelectItem>
              {filters.rarities?.map((rarityOption) => (
                <SelectItem key={rarityOption} value={rarityOption}>
                  {rarityOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="type-filter">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type-filter">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {filters.types?.map((typeOption) => (
                <SelectItem key={typeOption} value={typeOption}>
                  {typeOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Variant Filter */}
        <div className="space-y-2">
          <Label htmlFor="variant-filter">Variant</Label>
          <Select value={variant} onValueChange={setVariant}>
            <SelectTrigger id="variant-filter">
              <SelectValue placeholder="All Variants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Variants</SelectItem>
              {filters.variants?.map((variantOption) => (
                <SelectItem key={variantOption} value={variantOption}>
                  {variantOption === 'normal' ? 'Regular' : 
                   variantOption === 'holofoil' ? 'Holo' : 
                   variantOption === 'reverseHolofoil' ? 'Reverse Holo' : 
                   variantOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Condition Filter */}
        <div className="space-y-2">
          <Label htmlFor="condition-filter">Condition</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger id="condition-filter">
              <SelectValue placeholder="All Conditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Conditions</SelectItem>
              {filters.conditions?.map((conditionOption) => (
                <SelectItem key={conditionOption} value={conditionOption}>
                  {conditionOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Filter Button */}
        <div className="flex items-end space-x-2">
          <Button 
            onClick={applyFilters} 
            className="flex-1"
            disabled={isPending}
          >
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          {activeFilterCount > 0 && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="mt-4">
          <Label className="text-sm mb-2 block">Active Filters:</Label>
          <div className="flex flex-wrap gap-2">
            {getActiveFilters().map((filter) => (
              <Badge 
                key={filter.key} 
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                {filter.label}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => removeFilter(filter.key)}
                />
              </Badge>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="h-6 text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}