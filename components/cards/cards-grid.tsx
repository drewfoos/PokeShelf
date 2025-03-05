// components/cards/cards-grid.tsx
import React from 'react';
import CardItem from '@/components/cards/card-item';
// Import the standardized Card type
import { Card as CardType } from '@/types';

interface CardGridProps {
  cards: CardType[];
  isLoading?: boolean;
}

// Define a type for placeholders
interface Placeholder {
  id: string;
  isPlaceholder: boolean;
}

const CardGrid: React.FC<CardGridProps> = ({ cards, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            className="aspect-[3/4] rounded-md bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">No cards found</h3>
        <p className="text-muted-foreground mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  // Fill in empty slots in the last row to maintain grid alignment
  const cardsPerRow = {
    xs: 2,     // grid-cols-2
    sm: 3,     // sm:grid-cols-3
    md: 4,     // md:grid-cols-4
    lg: 5,     // lg:grid-cols-5
    xl: 6      // xl:grid-cols-6
  };

  // Use the largest cards-per-row value to calculate needed placeholders
  const maxCardsPerRow = cardsPerRow.xl;
  const remainder = cards.length % maxCardsPerRow;
  
  // Create placeholders array if needed
  const placeholders: Placeholder[] = remainder === 0 
    ? [] 
    : Array.from({ length: maxCardsPerRow - remainder }).map((_, i) => ({ 
        id: `placeholder-${i}`, 
        isPlaceholder: true 
      }));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
      
      {/* Invisible placeholders to maintain grid alignment */}
      {placeholders.map((placeholder: Placeholder) => (
        <div key={placeholder.id} className="invisible" aria-hidden="true">
          {/* Placeholder to maintain grid layout */}
        </div>
      ))}
    </div>
  );
};

export default CardGrid;