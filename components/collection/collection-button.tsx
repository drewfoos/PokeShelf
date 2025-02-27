'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CollectionButtonProps {
  cardId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isFullWidth?: boolean;
}

export default function CollectionButton({ 
  cardId, 
  variant = 'default', 
  size = 'default',
  isFullWidth = false 
}: CollectionButtonProps) {
  const router = useRouter();
  const [isInCollection, setIsInCollection] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  
  // Check if the card is already in the collection
  useEffect(() => {
    async function checkCollectionStatus() {
      try {
        const response = await fetch(`/api/collection/check?cardId=${cardId}`);
        if (response.ok) {
          const data = await response.json();
          setIsInCollection(data.inCollection);
          setQuantity(data.quantity || 0);
        }
      } catch (error) {
        console.error('Error checking collection status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    }
    
    checkCollectionStatus();
  }, [cardId]);
  
  const addToCollection = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/collection/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          quantity: 1,
          condition: 'Near Mint'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add card to collection');
      }
      
      const data = await response.json();
      setIsInCollection(true);
      setQuantity(1);
      
      toast.success("Card added to your collection");
      
      router.refresh();
    } catch (error) {
      console.error('Error adding card to collection:', error);
      toast.error(error instanceof Error ? error.message : "Failed to add card to collection");
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeFromCollection = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/collection/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          removeAll: true
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove card from collection');
      }
      
      setIsInCollection(false);
      setQuantity(0);
      
      toast.success("Card removed from your collection");
      
      router.refresh();
    } catch (error) {
      console.error('Error removing card from collection:', error);
      toast.error(error instanceof Error ? error.message : "Failed to remove card from collection");
    } finally {
      setIsLoading(false);
    }
  };
  
  // If we're still checking the status, show a loading state
  if (isCheckingStatus) {
    return (
      <Button 
        variant={variant} 
        size={size}
        className={isFullWidth ? 'w-full' : ''}
        disabled
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking collection...
      </Button>
    );
  }
  
  // If card is in collection, show remove button with confirmation
  if (isInCollection) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            size={size}
            className={`${isFullWidth ? 'w-full' : ''} border-red-200 hover:bg-red-100 hover:text-red-700`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Remove from Collection
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this card from your collection?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeFromCollection}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  
  // Default: Add to collection button
  return (
    <Button 
      variant={variant} 
      size={size}
      className={isFullWidth ? 'w-full' : ''}
      onClick={addToCollection}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <PlusCircle className="h-4 w-4 mr-2" />
      )}
      Add to Collection
    </Button>
  );
}