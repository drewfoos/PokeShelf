/* eslint-disable @typescript-eslint/no-explicit-any */
// components/collection/collection-card-item.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from "@/lib/utils";

// Types (should match your main app types)
interface CardImage {
  small?: string;
  large?: string;
  [key: string]: string | undefined;
}

interface CardType {
  id: string;
  name: string;
  setName: string;
  images: CardImage | null;
  // Other fields that you use in this component
  tcgplayer?: any;
}

interface CardVariant {
  id: string;
  quantity: number;
  condition: string;
  variant: string;
  isFoil: boolean;
  purchasePrice?: number | null;
}

interface CollectionCardItemProps {
  card: CardType;
  variants: CardVariant[];
}

// Collection Card component that handles multiple variants
export default function CollectionCardItem({ card, variants }: CollectionCardItemProps) {
  // Extract image URL from the card images object
  const smallImage = card.images && typeof card.images === "object" ? 
    card.images.small : 
    undefined;
  
  // Total quantity across all variants
  const totalQuantity = variants.reduce((sum, v) => sum + v.quantity, 0);
  
  // Calculate estimated value based on variants and market prices
  const estimatedValue = variants.reduce((total, variant) => {
    if (variant.purchasePrice) {
      return total + (variant.purchasePrice * variant.quantity);
    }
    
    // If no purchase price, try to use market price based on variant type
    if (card.tcgplayer?.prices) {
      const prices = card.tcgplayer.prices;
      if (variant.variant === 'normal' && prices.normal?.market) {
        return total + (prices.normal.market * variant.quantity);
      }
      if (variant.variant === 'holofoil' && prices.holofoil?.market) {
        return total + (prices.holofoil.market * variant.quantity);
      }
      if (variant.variant === 'reverseHolofoil' && prices.reverseHolofoil?.market) {
        return total + (prices.reverseHolofoil.market * variant.quantity);
      }
    }
    
    return total;
  }, 0);
  
  return (
    <Link href={`/card/${card.id}`}>
      <Card className="overflow-hidden h-full transition-all hover:shadow-md group">
        <div className="p-2">
          <div className="aspect-[3/4] relative rounded overflow-hidden">
            {smallImage ? (
              <Image
                src={smallImage}
                alt={card.name}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
                quality={75}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
            
            {/* Quantity Badge */}
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {totalQuantity}
            </div>
          </div>
        </div>
        
        <CardContent className="p-3 pt-1">
          <h3 className="font-medium text-sm truncate" title={card.name}>
            {card.name}
          </h3>
          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
            <span>{card.setName}</span>
            {estimatedValue > 0 && (
              <span className="font-semibold">{formatPrice(estimatedValue)}</span>
            )}
          </div>
          
          {/* Variant Badges */}
          {variants.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {variants.map((variant) => {
                const displayInfo = getVariantDisplayInfo(variant.variant);
                return (
                  <Badge 
                    key={variant.id} 
                    variant="outline" 
                    className={`${displayInfo.color} text-xs`}
                  >
                    {displayInfo.label} ({variant.quantity})
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Helper to get variant display information
function getVariantDisplayInfo(variantType: string) {
  switch (variantType) {
    case 'normal':
      return { label: 'Regular', color: 'bg-gray-200 text-gray-800' };
    case 'holofoil':
      return { label: 'Holo', color: 'bg-blue-500 text-white' };
    case 'reverseHolofoil':
      return { label: 'Reverse Holo', color: 'bg-purple-500 text-white' };
    case 'masterBall':
      return { label: 'Master Ball', color: 'bg-indigo-700 text-white' };
    case 'pokeBall':
      return { label: 'Poké Ball', color: 'bg-red-500 text-white' };
    default:
      return { label: variantType, color: 'bg-gray-500 text-white' };
  }
}