import React from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 to-transparent rounded-xl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Track Your Pokémon Card Collection
            </h1>
            <p className="text-xl text-muted-foreground mx-auto">
              Organize, track values, and manage your entire Pokémon TCG collection in one place.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg" className="shadow-md bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/collection">
                <Button size="lg" className="shadow-md bg-primary hover:bg-primary/90">
                  My Collection
                </Button>
              </Link>
            </SignedIn>
            <Link href="/sets">
              <Button size="lg" variant="outline" className="shadow-sm hover:shadow-md">
                Browse Sets
              </Button>
            </Link>
          </div>

          <div className="w-full max-w-3xl mx-auto mt-12 relative">
            <div className="relative h-64 sm:h-80 overflow-hidden rounded-xl shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-violet-500/10 z-10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 p-4 transform rotate-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-24 h-32 rounded-lg bg-white shadow-md transform transition-transform"
                      style={{ 
                        transformOrigin: 'center', 
                        transform: `rotate(${(i % 2 === 0 ? 2 : -2)}deg)` 
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;