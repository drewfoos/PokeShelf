'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import CardItem from '@/components/cards/card-item';
import CollectionVariantsDialog from '@/components/collection/collection-variants-dialog';
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
  // State to track which card to show the variants dialog for
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  
  // Find the selected card in the cards array
  const selectedCard = selectedCardId ? cards.find(card => card.id === selectedCardId) : null;

  // Handle adding a variant
  const handleAddVariant = (cardId: string) => {
    setSelectedCardId(cardId);
    
    // Only open the dialog if the user is signed in
    if (isLoaded && isSignedIn) {
      setIsDialogOpen(true);
    }
  };

  // Handle closing the dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCardId(null);
  };

  // Show a loading state while the cards are being fetched
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            className="aspect-[3/4] rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Show an empty state if no cards are found
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
    xl: 5      // (keeping xl at 5 columns for better visibility)
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
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <CardItem key={card.id} card={card} onAddVariant={handleAddVariant} />
        ))}
        
        {/* Invisible placeholders to maintain grid alignment */}
        {placeholders.map((placeholder: Placeholder) => (
          <div key={placeholder.id} className="invisible" aria-hidden="true">
            {/* Placeholder to maintain grid layout */}
          </div>
        ))}
      </div>

      {/* Variants Dialog */}
      {selectedCard && isSignedIn && (
        <CollectionVariantsDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          cardId={selectedCard.id}
          cardName={selectedCard.name}
          setId={selectedCard.setId}
          setName={selectedCard.setName}
          releaseDate={selectedCard.releaseDate || "2000/01/01"}
          cardImage={selectedCard.images?.large || selectedCard.images?.small || undefined}
          tcgplayer={selectedCard.tcgplayer || null}
        />
      )}
    </>
  );
};

export default CardGrid;