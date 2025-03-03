import React from 'react';
import Link from 'next/link';

// Todo: add not affiliated with pokemon company
const SiteFooter = () => {
  return (
    <footer className="border-t py-6 md:py-0 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PokéTracker. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a
            href="https://andrewdryfoos.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            About
          </a>
          <Link href="/privacy" prefetch={false} className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" prefetch={false} className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
