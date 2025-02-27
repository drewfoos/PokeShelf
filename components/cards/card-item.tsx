import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { JsonValue } from '@prisma/client/runtime/library';

interface CardItemProps {
  card: {
    id: string;
    name: string;
    images: JsonValue;
    number: string;
    setName: string;
    rarity: string;
    types?: string[];
    artist?: string | null;
    tcgplayer?: JsonValue;
  };
}

const CardItem: React.FC<CardItemProps> = ({ card }) => {
  const { id, name, images, setName, rarity, artist } = card;
  
  // Extract image URLs from the JsonValue
  const smallImage =
    images &&
    typeof images === 'object' &&
    images !== null &&
    'small' in images &&
    typeof images.small === 'string'
      ? images.small
      : null;
  
  return (
    <Link href={`/card/${id}`} passHref>
      <Card className="overflow-hidden h-full transition-all duration-300 group relative">
        {/* Card Image */}
        <div className="aspect-[3/4] relative overflow-hidden">
          {smallImage ? (
            <Image
              src={smallImage}
              alt={name}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-lg text-muted-foreground">No image</span>
            </div>
          )}
          
          {/* Rarity Badge (top right corner) */}
          {rarity && rarity !== "Unknown" && (
            <div className="absolute top-2 right-2 z-10">
              <Badge
                variant="outline"
                className="text-xs font-normal bg-background/80 backdrop-blur-sm border-primary/40 text-primary shadow-sm"
              >
                {rarity}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Card Info */}
        <CardContent className="p-3 relative z-20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3
                className="font-medium text-sm truncate transition-colors group-hover:text-primary"
                title={name}
              >
                {name}
              </h3>
              <span
                className="text-xs text-muted-foreground ml-2 truncate whitespace-nowrap max-w-[150px]"
                title={setName}
              >
                {setName}
              </span>
            </div>
            
            {artist && (
              <div
                className="text-xs text-muted-foreground italic mt-1 truncate"
                title={`Artist: ${artist}`}
              >
                Art by {artist}
              </div>
            )}
          </div>
          
          {/* Card shimmer effect on hover */}
          <div className="absolute -inset-x-full -top-2 bottom-0 h-full transform-gpu bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full duration-1000 transition-transform"></div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CardItem;
