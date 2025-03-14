'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface SetImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  alt: string;
  type: 'logo' | 'symbol';
  setId: string;
  fallbackSrc?: string;
}

/**
 * Special component for set logos and symbols that allows Next.js image optimization
 * This helps reduce Vercel image optimization costs by only applying it
 * to set images instead of all 20K+ individual card images
 */
export default function SetImage({
  src,
  alt,
  type, // logo or symbol
  setId,
  fallbackSrc = '/set-placeholder.jpg',
  ...props
}: SetImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (src) return src;
    
    // If no src is provided, use the formatted URL
    return `https://images.pokemontcg.io/${setId}/${type}.png`;
  });
  
  // Handle image load error
  const handleError = () => {
    console.warn(`Failed to load set image: ${imgSrc}`);
    
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };
  
  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
}