// components/cards/card-item.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthenticatedCollectionAction from '@/components/collection/authenticated-collection-action';
// Import the standardized Card type
import { Card as CardType } from '@/types';

interface CardItemProps {
  card: CardType;
  onAddVariant?: (cardId: string) => void;
}

const CardItem: React.FC<CardItemProps> = ({ card, onAddVariant }) => {
  const { id, name, images, artist, number } = card;
  
  // Extract image URLs - images is now properly typed as CardImage
  const smallImage = images?.small || null;
  
  // Handle add variant click without navigating to card detail page
  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddVariant) {
      onAddVariant(id);
    }
  };
  
  return (
    <Link href={`/card/${id}`} passHref>
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg transition-all duration-300 group hover:shadow-md border border-muted bg-card">
        {/* Card Image - centered with fixed proportions */}
        <div className="flex items-center justify-center h-full px-2 pt-2 pb-10">
          {smallImage ? (
            <div className="relative w-[85%] h-[85%]">
              <Image
                src={smallImage}
                alt={name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
                quality={75}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-lg text-muted-foreground">No image</span>
            </div>
          )}
        </div>
        
        {/* Card shimmer effect on hover */}
        <div className="absolute -inset-x-full -top-2 bottom-0 h-full transform-gpu bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full duration-1000 transition-transform"></div>
        
        {/* Add Variants Button (top right corner) */}
        <div className="absolute top-2 right-2 z-10">
          <AuthenticatedCollectionAction 
            size="sm" 
            isIconOnly={true}
            onClick={handleAddClick}
          >
            <Button
              size="sm"
              className="h-8 w-8 p-0 rounded-full bg-primary text-white shadow-md hover:bg-primary/90 transition-colors"
              onClick={handleAddClick}
              title="Add to Collection"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
              <span className="sr-only">Add to Collection</span>
            </Button>
          </AuthenticatedCollectionAction>
        </div>
        
        {/* Semi-transparent name bar at the bottom with number on the right */}
        <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm px-2 py-1.5">
          <div className="flex justify-between items-baseline">
            <h3
              className="font-medium text-sm text-white truncate mr-2"
              title={name}
            >
              {name}
            </h3>
            <span className="text-xs text-white/90 font-mono whitespace-nowrap">
              #{number}
            </span>
          </div>
          
          {artist && (
            <div
              className="text-xs text-white/70 italic truncate"
              title={`Artist: ${artist}`}
            >
              {artist}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CardItem;