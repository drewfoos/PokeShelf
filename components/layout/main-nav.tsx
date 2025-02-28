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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import AdminNavLink from './admin-nav-link';

const MainNav = () => {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
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
              <Link
                href="/sets"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Sets
              </Link>
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
                {/* Admin Dashboard Link (only shown to admins) */}
                <AdminNavLink />
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
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-9 h-9 border-2 border-primary/25'
                  }
                }}
              />
            </SignedIn>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] sm:w-[350px]">
                <div className="flex flex-col h-full">
                  <div className="py-6">
                    <Link href="/" className="flex items-center gap-2 mb-6">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="font-bold text-lg text-primary-foreground">P</span>
                      </div>
                      <span className="font-bold text-xl">PokéShelf</span>
                    </Link>
                    
                    {/* Mobile Search */}
                    <form 
                      onSubmit={(e) => {
                        handleSubmit(e);
                        document.querySelector<HTMLButtonElement>('[data-sheet-close]')?.click();
                      }} 
                      className="mb-6"
                    >
                      <div className="relative">
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search cards..."
                          className="w-full rounded-md border border-border bg-muted py-2 pl-10 pr-4 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </form>
                    
                    {/* Mobile Navigation */}
                    <nav className="flex flex-col space-y-4">
                      <SheetClose asChild>
                        <Link
                          href="/sets"
                          className="text-base font-medium px-2 py-1.5 rounded-md hover:bg-muted"
                        >
                          Sets
                        </Link>
                      </SheetClose>
                      <SignedIn>
                        <SheetClose asChild>
                          <Link
                            href="/collection"
                            className="text-base font-medium px-2 py-1.5 rounded-md hover:bg-muted"
                          >
                            My Collection
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href="/wishlist"
                            className="text-base font-medium px-2 py-1.5 rounded-md hover:bg-muted"
                          >
                            Wishlist
                          </Link>
                        </SheetClose>
                        <div className="px-2 py-1.5">
                          <AdminNavLink />
                        </div>
                      </SignedIn>
                    </nav>
                  </div>
                  
                  {/* Mobile Auth Buttons */}
                  <div className="mt-auto border-t border-border pt-6">
                    <SignedOut>
                      <div className="grid grid-cols-2 gap-2">
                        <SheetClose asChild>
                          <SignInButton mode="modal">
                            <Button variant="outline" className="w-full">
                              Sign In
                            </Button>
                          </SignInButton>
                        </SheetClose>
                        <SheetClose asChild>
                          <SignUpButton mode="modal">
                            <Button className="w-full">Sign Up</Button>
                          </SignUpButton>
                        </SheetClose>
                      </div>
                    </SignedOut>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainNav;