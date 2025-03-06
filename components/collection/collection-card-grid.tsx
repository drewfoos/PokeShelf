'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { GroupedCard, CardVariant } from '@/types';

interface CollectionCardGridProps {
  cards: GroupedCard[];
  className?: string;
  onCardDeleted?: () => void; // Add this prop
}

export default function CollectionCardGrid({ cards, className = '', onCardDeleted }: CollectionCardGridProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GroupedCard | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Handle viewing card variants
  const handleViewVariants = (card: GroupedCard) => {
    setSelectedCard(card);
    setIsDialogOpen(true);
  };

  // Handle removing card from collection
  const handleRemoveCard = async (cardId: string, variant: string) => {
    try {
      setIsRemoving(true);
      const response = await fetch('/api/collection/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          removeAll: true,
          variant
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove card from collection');
      }

      // Success - update UI
      toast.success('Card removed from collection');
      setIsDialogOpen(false);
      
      // Call the onCardDeleted callback if provided
      if (onCardDeleted) {
        onCardDeleted();
      } else {
        // If no callback provided, refresh the page as fallback
        router.refresh();
      }
    } catch (error) {
      toast.error('Error removing card from collection');
      console.error('Error removing card:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  // Get variant display information 
  const getVariantDisplayInfo = (variant: CardVariant) => {
    switch (variant.variant) {
      case 'normal':
        return { label: 'Regular', color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' };
      case 'holofoil':
        return { label: 'Holo', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' };
      case 'reverseHolofoil':
        return { label: 'Reverse Holo', color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' };
      case 'masterBall':
        return { label: 'Master Ball', color: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' };
      case 'pokeBall':
        return { label: 'Poké Ball', color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' };
      default:
        return { label: variant.variant, color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' };
    }
  };

  // Calculate total card count and value
  const calculateCardTotals = (variants: CardVariant[]) => {
    const totalQuantity = variants.reduce((sum, variant) => sum + variant.quantity, 0);
    const totalValue = variants.reduce((sum, variant) => {
      return sum + (variant.purchasePrice || 0) * variant.quantity;
    }, 0);
    
    return { totalQuantity, totalValue };
  };

  // Get card rarity class 
  const getRarityClass = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'border-gray-200 dark:border-gray-700';
      case 'uncommon': return 'border-green-300 dark:border-green-800';
      case 'rare': return 'border-blue-300 dark:border-blue-800';
      case 'ultra rare':
      case 'secret': return 'border-purple-300 dark:border-purple-800';
      case 'rare holo': return 'border-indigo-300 dark:border-indigo-800';
      case 'amazing rare': return 'border-teal-300 dark:border-teal-800';
      case 'rare ultra': return 'border-pink-300 dark:border-pink-800';
      default: return 'border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <>
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
        <AnimatePresence>
          {cards.map((item) => {
            const { card, variants } = item;
            const { totalQuantity, totalValue } = calculateCardTotals(variants);
            
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <Card 
                  className={`overflow-hidden h-full transition-all hover:shadow-md group border-l-4 ${getRarityClass(card.rarity)}`}
                >
                  <div className="p-2">
                    <div className="aspect-[3/4] relative rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {card.images?.small ? (
                        <Image
                          src={card.images.small}
                          alt={card.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
                          quality={75}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-foreground">No image</span>
                        </div>
                      )}
                      
                      {/* Quantity Badge */}
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm">
                        {totalQuantity}
                      </div>
                      
                      {/* Set Number Badge */}
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white rounded-md px-1.5 py-0.5 text-xs">
                        {card.setName} #{card.number}
                      </div>
                      
                      {/* Quick Actions Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="flex gap-2">
                          <Link href={`/card/${card.id}`}>
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Card</span>
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => handleViewVariants(item)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit Card</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-3 pt-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm truncate" title={card.name}>
                        {card.name}
                      </h3>
                      {totalValue > 0 && (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 whitespace-nowrap ml-1">
                          {formatPrice(totalValue)}
                        </span>
                      )}
                    </div>
                    
                    {/* Variant Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {variants.map((variant) => {
                        const { label, color } = getVariantDisplayInfo(variant);
                        return (
                          <Badge 
                            key={`${card.id}-${variant.variant}`} 
                            variant="outline" 
                            className={`${color} text-[10px] px-1.5 py-0 h-5`}
                          >
                            {label} {variant.quantity > 1 ? `(${variant.quantity})` : ''}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Card Variants Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Card Variants</DialogTitle>
            <DialogDescription>
              {selectedCard?.card.name} from {selectedCard?.card.setName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="aspect-[3/4] relative rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
              {selectedCard?.card.images?.large ? (
                <Image
                  src={selectedCard.card.images.large}
                  alt={selectedCard.card.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 45vw, 200px"
                  quality={90}
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedCard?.card.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedCard?.card.setName} #{selectedCard?.card.number}</p>
                
                {/* Type badges */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedCard?.card.types?.map(type => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Your Collection:</h4>
                <div className="space-y-2">
                  {selectedCard?.variants.map(variant => {
                    const { label, color } = getVariantDisplayInfo(variant);
                    return (
                      <div key={variant.variant} className="flex justify-between items-center p-2 rounded-md bg-muted">
                        <div>
                          <Badge variant="outline" className={`${color} text-xs`}>
                            {label}
                          </Badge>
                          <span className="text-xs ml-2">
                            {variant.quantity}× {variant.condition}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          disabled={isRemoving}
                          onClick={() => handleRemoveCard(selectedCard.card.id, variant.variant)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/card/${selectedCard?.card.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Card
              </Link>
            </Button>
            
            {selectedCard?.card.tcgplayer?.url && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={selectedCard.card.tcgplayer.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  TCGPlayer
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}