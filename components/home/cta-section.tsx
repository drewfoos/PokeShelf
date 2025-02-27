import React from 'react';
import Link from 'next/link';
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  return (
    <section className="py-16 bg-primary/5 rounded-xl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Ready to Start Tracking?</h2>
          <p className="text-muted-foreground max-w-[600px]">
            Create an account to start building your collection, tracking values, and more.
          </p>
          <Link href="/sign-up" className="mt-6">
            <Button size="lg" className="shadow-md bg-primary hover:bg-primary/90">
              Create a Free Account
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;