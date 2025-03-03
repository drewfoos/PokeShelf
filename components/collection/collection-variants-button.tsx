'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Minus, Info, HelpCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { formatPrice } from '@/lib/utils';

// Define proper types for TCGPlayer data structure
interface TCGPlayerPriceData {
  low: number;
  mid: number;
  high: number;
  market: number;
  directLow: number | null;
}

interface TCGPlayerPrices {
  normal?: TCGPlayerPriceData;
  holofoil?: TCGPlayerPriceData;
  reverseHolofoil?: TCGPlayerPriceData;
  '1stEditionHolofoil'?: TCGPlayerPriceData;
  [key: string]: TCGPlayerPriceData | undefined;
}

interface TCGPlayerData {
  url: string;
  updatedAt: string;
  prices?: TCGPlayerPrices;
}

// Interface for card variant information
interface CardVariant {
  type: string;
  name: string;
  description: string;
  available: boolean;
  quantity: number;
  condition: string;
  imageSample?: string;
  price?: number | null;
}

// Interface for collection button props
interface CollectionVariantsButtonProps {
  cardId: string;
  cardName: string;
  setId: string;
  setName: string;
  releaseDate: string;
  cardImage?: string;
  tcgplayer?: TCGPlayerData;
  isInCollection?: boolean;
}

// Helper to determine which variants to show based on the set
function getAvailableVariants(
  setId: string, 
  releaseDate: string, 
  tcgplayer?: TCGPlayerData
): CardVariant[] {
  const releaseYear = new Date(releaseDate).getFullYear();
  const variants: CardVariant[] = [];
  
  // Check if set is from 2002 or later (when reverse holos became standard)
  const hasReverseHolo = releaseYear >= 2002;
  
  // Special handling for Prismatic Evolutions
  const isPrismaticEvolutions = setId === 'pevo' || setId === 'sv8pt5';
  
  // Check if card has a standard non-foil version (should be true for most)
  const hasNormal = true;
  
  // Check if card has a standard holo version (typically only for rares)
  const hasHolo = tcgplayer?.prices?.holofoil != null;
  
  // Standard non-foil (available for almost all cards)
  if (hasNormal) {
    variants.push({
      type: 'normal',
      name: 'Regular',
      description: 'Standard non-foil card',
      available: true,
      quantity: 0,
      condition: 'Near Mint',
      price: tcgplayer?.prices?.normal?.market || null,
    });
  }
  
  // Standard holo (typically only for rares)
  if (hasHolo) {
    variants.push({
      type: 'holofoil',
      name: 'Holofoil',
      description: 'Standard holographic foil on the artwork',
      available: true,
      quantity: 0,
      condition: 'Near Mint',
      imageSample: '/examples/holofoil-example.jpg',
      price: tcgplayer?.prices?.holofoil?.market || null,
    });
  }
  
  // Reverse holo (available for commons/uncommons from 2002 onward)
  if (hasReverseHolo) {
    variants.push({
      type: 'reverseHolofoil',
      name: 'Reverse Holofoil',
      description: 'Holographic foil on card body instead of artwork',
      available: true,
      quantity: 0,
      condition: 'Near Mint',
      imageSample: '/examples/reverse-holo-example.jpg',
      price: tcgplayer?.prices?.reverseHolofoil?.market || null,
    });
  }
  
  // Prismatic Evolutions special variants
  if (isPrismaticEvolutions) {
    // Master Ball variant
    variants.push({
      type: 'masterBall',
      name: 'Master Ball Pattern',
      description: 'Special Master Ball foil pattern unique to Prismatic Evolutions',
      available: true,
      quantity: 0,
      condition: 'Near Mint',
      imageSample: '/examples/master-ball-example.jpg',
    });
    
    // Poké Ball variant
    variants.push({
      type: 'pokeBall',
      name: 'Poké Ball Pattern',
      description: 'Special Poké Ball foil pattern unique to Prismatic Evolutions',
      available: true,
      quantity: 0,
      condition: 'Near Mint',
      imageSample: '/examples/poke-ball-example.jpg',
    });
  }
  
  // Return only variants that are applicable to this card
  return variants;
}

// Type for collection status response
interface CollectionCheckResponse {
  inCollection: boolean;
  quantity?: number;
}

// Condition options for dropdown
const conditionOptions = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged'
];

export default function CollectionVariantsButton({
  cardId,
  cardName,
  setId,
  setName,
  releaseDate,
  cardImage,
  tcgplayer,
  isInCollection = false
}: CollectionVariantsButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isInCollectionState, setIsInCollectionState] = useState(isInCollection);
  const [variants, setVariants] = useState<CardVariant[]>([]);
  
  // Initialize available variants based on set information
  useEffect(() => {
    const availableVariants = getAvailableVariants(setId, releaseDate, tcgplayer);
    setVariants(availableVariants);
  }, [setId, releaseDate, tcgplayer]);
  
  // Check if card is in collection on load
  useEffect(() => {
    async function checkCollectionStatus() {
      if (isInCollection) {
        setIsInCollectionState(true);
        setIsCheckingStatus(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/collection/check?cardId=${cardId}`);
        if (response.ok) {
          const data = await response.json() as CollectionCheckResponse;
          setIsInCollectionState(data.inCollection);
        }
      } catch (error) {
        console.error('Error checking collection status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    }
    
    checkCollectionStatus();
  }, [cardId, isInCollection]);
  
  // Update quantity for a specific variant
  const updateVariantQuantity = (type: string, newQuantity: number) => {
    setVariants(variants.map(variant => 
      variant.type === type 
        ? { ...variant, quantity: Math.max(0, newQuantity) }
        : variant
    ));
  };
  
  // Update condition for a specific variant
  const updateVariantCondition = (type: string, condition: string) => {
    setVariants(variants.map(variant => 
      variant.type === type 
        ? { ...variant, condition }
        : variant
    ));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    const selectedVariants = variants.filter(v => v.quantity > 0);
    
    if (selectedVariants.length === 0) {
      toast.error("Please select at least one card variant to add");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Submit each selected variant as a separate request
      for (const variant of selectedVariants) {
        const response = await fetch('/api/collection/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cardId,
            quantity: variant.quantity,
            condition: variant.condition,
            isFoil: variant.type !== 'normal', // All variants except normal are foil
            variant: variant.type, // Store the specific variant type
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add card to collection");
        }
      }
      
      toast.success("Cards added to your collection");
      setIsInCollectionState(true);
      setOpen(false);
      
      // Refresh the page to show updated collection status
      router.refresh();
    } catch (error) {
      console.error('Error adding cards to collection:', error);
      toast.error(error instanceof Error ? error.message : "Failed to add cards to collection");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle removing from collection
  const handleRemove = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/collection/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          removeAll: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove card from collection');
      }
      
      setIsInCollectionState(false);
      setOpen(false);
      toast.success("Card removed from your collection");
      
      router.refresh();
    } catch (error) {
      console.error('Error removing card from collection:', error);
      toast.error(error instanceof Error ? error.message : "Failed to remove card from collection");
    } finally {
      setIsLoading(false);
    }
  };
  
  // If we're still checking the status, show a loading state
  if (isCheckingStatus) {
    return (
      <Button disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking collection...
      </Button>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={isInCollectionState ? "outline" : "default"}
          className={isInCollectionState ? "border-green-200 hover:bg-green-100 text-green-700" : ""}
        >
          {isInCollectionState ? "In Collection" : "Add to Collection"}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isInCollectionState ? "Update Collection" : "Add to Collection"}</DialogTitle>
          <DialogDescription>
            {isInCollectionState 
              ? `Update ${cardName} in your collection or remove it completely.` 
              : `Add ${cardName} to your collection with your preferred options.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Card Image Preview */}
          {cardImage && (
            <div className="flex justify-center">
              <div className="w-32 h-44 relative">
                <Image
                  src={cardImage}
                  alt={cardName}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 120px, 128px"
                />
              </div>
            </div>
          )}
          
          {/* Set Information */}
          <div className="text-center text-sm text-muted-foreground mb-2">
            {setName} • Card #{cardId.split('-')[1]}
          </div>
          
          {/* Variants Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Available Variants</h3>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <HelpCircle className="h-4 w-4" />
                      <span className="sr-only">About Card Variants</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm">
                      {releaseDate && new Date(releaseDate).getFullYear() >= 2002 
                        ? "Since 2002, most commons and uncommons have regular and reverse holo versions." 
                        : "This card is from before reverse holos became standard in 2002."}
                      {setId === 'pevo' || setId === 'sv8pt5' 
                        ? " Prismatic Evolutions also features special Master Ball and Poké Ball patterns." 
                        : ""}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Show each variant with quantity selector and condition dropdown */}
            <div className="space-y-3">
              {variants.map((variant) => (
                <div key={variant.type} className="flex items-center justify-between border rounded-md p-3">
                  <div className="min-w-32">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{variant.name}</span>
                      
                      {/* Information Popover for variant */}
                      {variant.imageSample && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">View Example</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent side="right" className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">{variant.name}</h4>
                              <p className="text-sm text-muted-foreground">{variant.description}</p>
                              {variant.imageSample && (
                                <div className="mt-2">
                                  <span className="text-xs text-muted-foreground">Example:</span>
                                  <div className="h-40 relative mt-1">
                                    <Image 
                                      src={variant.imageSample} 
                                      alt={`${variant.name} example`}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    {variant.price && (
                      <div className="text-xs text-muted-foreground">
                        Market Price: {formatPrice(variant.price)}
                      </div>
                    )}
                  </div>
                  
                  {/* Quantity Selector */}
                  <div className="flex items-center">
                    <div className="flex mr-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        onClick={() => updateVariantQuantity(variant.type, variant.quantity - 1)}
                        disabled={variant.quantity === 0}
                      >
                        <Minus className="h-3 w-3" />
                        <span className="sr-only">Decrease</span>
                      </Button>
                      <div className="h-8 px-3 flex items-center justify-center border-y">
                        {variant.quantity}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        onClick={() => updateVariantQuantity(variant.type, variant.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                        <span className="sr-only">Increase</span>
                      </Button>
                    </div>
                    
                    {/* Condition Dropdown - only visible when quantity > 0 */}
                    {variant.quantity > 0 && (
                      <Select
                        value={variant.condition}
                        onValueChange={(value) => updateVariantCondition(variant.type, value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionOptions.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          {isInCollectionState && (
            <Button 
              variant="destructive" 
              onClick={handleRemove}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Remove from Collection
            </Button>
          )}
          
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || variants.every(v => v.quantity === 0)}
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {isInCollectionState ? "Update Collection" : "Add to Collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}