import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">Card Not Found</h1>
      <p className="text-muted-foreground text-lg max-w-md mb-8">
        Sorry, we couldn't find the Pokémon card you're looking for.
      </p>
      <Link href="/sets">
        <Button className="flex items-center">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Browse All Sets
        </Button>
      </Link>
    </div>
  );
}