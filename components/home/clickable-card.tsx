'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ClickableCardProps {
  id: string;
  name: string;
  imageUrl: string | null;
  rotationDegree: number;
  priority?: boolean;
}

export default function ClickableCard({
  id,
  name,
  imageUrl,
  rotationDegree,
  priority = false
}: ClickableCardProps) {
  return (
    <Link
      href={`/card/${id}`}
      prefetch={false}
      className="w-24 h-32 rounded-lg bg-white shadow-md transform transition-transform hover:scale-105 overflow-hidden cursor-pointer select-none"
      style={{
        transformOrigin: 'center',
        transform: `rotate(${rotationDegree}deg)`
      }}
    >
      {imageUrl ? (
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-contain p-0.5"
            sizes="96px"
            priority={priority}
            quality={75}
            // Ensure the image doesn't block pointer events:
            style={{ pointerEvents: 'none' }}
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-xs text-muted-foreground">{name}</span>
        </div>
      )}
    </Link>
  );
}
