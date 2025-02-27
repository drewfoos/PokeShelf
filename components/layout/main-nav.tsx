"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MainNav = () => {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-sm bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 md:px-6 py-3">
        <div className="flex h-14 items-center justify-between">
          {/* Logo & Nav */}
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="font-bold text-lg text-primary-foreground">P</span>
              </div>
              <span className="font-bold text-xl md:text-2xl">PokéShelf</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <SignedIn>
                <Link
                  href="/collection"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  My Collection
                </Link>
                <Link
                  href="/wishlist"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Wishlist
                </Link>
              </SignedIn>
            </nav>
          </div>

          {/* Search, Auth, & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Search Field */}
            <form onSubmit={handleSubmit} className="hidden md:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cards..."
                  className="rounded-full border border-border bg-muted py-2 pl-10 pr-4 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </form>

            {/* Authentication */}
            <SignedOut>
              <div className="hidden md:flex gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign Up</Button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-9 h-9 border-2 border-primary/25'
                  }
                }}
              />
            </SignedIn>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainNav;
