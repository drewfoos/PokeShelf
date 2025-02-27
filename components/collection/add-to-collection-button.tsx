'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle } from 'lucide-react';

interface AddToCollectionButtonProps {
  cardId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isFullWidth?: boolean;
}

export default function AddToCollectionButton({ 
  cardId, 
  variant = 'default', 
  size = 'default',
  isFullWidth = false 
}: AddToCollectionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  // Form state
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('Near Mint');
  const [isFoil, setIsFoil] = useState(false);
  const [isFirstEdition, setIsFirstEdition] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState<number | undefined>(undefined);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/collection/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          quantity,
          condition,
          isFoil,
          isFirstEdition,
          purchasePrice: purchasePrice
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add card to collection');
      }
      
      setMessage({
        text: data.message || 'Card added to your collection',
        type: 'success'
      });
      
      // Close dialog and refresh the page after a short delay
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 1500);
      
    } catch (error) {
      console.error('Error adding card to collection:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to add card',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={isFullWidth ? 'w-full' : ''}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add to Collection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
            <DialogDescription>
              Add this card to your collection with the following details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="condition" className="text-right">
                Condition
              </Label>
              <Select
                value={condition}
                onValueChange={setCondition}
              >
                <SelectTrigger className="col-span-3" id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Near Mint">Near Mint</SelectItem>
                  <SelectItem value="Lightly Played">Lightly Played</SelectItem>
                  <SelectItem value="Moderately Played">Moderately Played</SelectItem>
                  <SelectItem value="Heavily Played">Heavily Played</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Purchase Price
              </Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={0.01}
                placeholder="Optional"
                value={purchasePrice === undefined ? '' : purchasePrice}
                onChange={(e) => 
                  setPurchasePrice(e.target.value === '' 
                    ? undefined 
                    : parseFloat(e.target.value)
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-1"></div>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox 
                  id="foil" 
                  checked={isFoil}
                  onCheckedChange={(checked) => setIsFoil(checked === true)}
                />
                <Label htmlFor="foil">Foil/Holographic</Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-1"></div>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox 
                  id="firstEdition" 
                  checked={isFirstEdition}
                  onCheckedChange={(checked) => setIsFirstEdition(checked === true)}
                />
                <Label htmlFor="firstEdition">First Edition</Label>
              </div>
            </div>
            
            {/* Status message */}
            {message && (
              <div className={`p-3 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
              }`}>
                {message.text}
              </div>
            )}
            
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add to Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}