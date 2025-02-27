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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart } from 'lucide-react';

interface WishlistButtonProps {
  cardId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isFullWidth?: boolean;
}

export default function WishlistButton({ 
  cardId, 
  variant = 'outline', 
  size = 'default',
  isFullWidth = false 
}: WishlistButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  // Form state
  const [priority, setPriority] = useState(3); // 1 = High, 5 = Low
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    // TODO: Implement wishlist API endpoint
    // This is a placeholder for now
    
    setTimeout(() => {
      setMessage({
        text: 'Added to wishlist successfully',
        type: 'success'
      });
      
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 1500);
    }, 1000);
    
    setIsLoading(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={isFullWidth ? 'w-full' : ''}
        >
          <Heart className="h-4 w-4 mr-2" />
          Add to Wishlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add to Wishlist</DialogTitle>
            <DialogDescription>
              Add this card to your wishlist with your desired details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Input
                id="priority"
                type="number"
                min={1}
                max={5}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxPrice" className="text-right">
                Max Price
              </Label>
              <Input
                id="maxPrice"
                type="number"
                min={0}
                step={0.01}
                placeholder="Optional"
                value={maxPrice === undefined ? '' : maxPrice}
                onChange={(e) => 
                  setMaxPrice(e.target.value === '' 
                    ? undefined 
                    : parseFloat(e.target.value)
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
              />
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
              {isLoading ? 'Adding...' : 'Add to Wishlist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}