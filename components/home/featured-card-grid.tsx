'use client';

import React from 'react';
import { Card } from '@/types';
import ClickableCard from './clickable-card';

interface FeaturedCardGridProps {
  cards: Card[];
}

export default function FeaturedCardGrid({ cards }: FeaturedCardGridProps) {
  if (cards.length === 0) {
    // Fallback placeholders if no cards are found
    return (
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 p-4" style={{ pointerEvents: 'auto' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="w-24 h-32 rounded-lg bg-white shadow-md transform transition-transform"
            style={{
              transformOrigin: 'center',
              transform: `rotate(${i % 2 === 0 ? 2 : -2}deg)`
            }}
          />
        ))}
      </div>
    );
  }

  return (
    // Remove any rotation from the grid container
    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 p-4" style={{ pointerEvents: 'auto' }}>
      {cards.map((card, i) => {
        // Extract image URL
        const cardImage = card.images?.large || card.images?.small || null;
        
        return (
          <ClickableCard
            key={card.id}
            id={card.id}
            name={card.name}
            imageUrl={cardImage}
            // Apply rotation only to individual cards if desired:
            rotationDegree={i % 2 === 0 ? 2 : -2} 
            priority={i < 3}
          />
        );
      })}
    </div>
  );
}
