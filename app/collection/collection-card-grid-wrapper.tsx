'use client';

import React from 'react';
import CollectionCardGrid from '@/components/collection/collection-card-grid';
import { GroupedCard } from '@/types';

interface CollectionCardGridWrapperProps {
  cards: GroupedCard[];
  className?: string;
}

export default function CollectionCardGridWrapper({ 
  cards, 
  className 
}: CollectionCardGridWrapperProps) {
  
  // Function to handle card deletion
  const handleCardDeleted = () => {
    // Dispatch a custom event that the parent component listens for
    const event = new CustomEvent('collection-updated');
    window.dispatchEvent(event);
  };

  // Pass the callback to the original component
  return (
    <CollectionCardGrid 
      cards={cards} 
      className={className} 
      onCardDeleted={handleCardDeleted}
    />
  );
}