"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import AdminNavLink from './admin-nav-link';

// Directly import DialogTitle since Sheet may use Dialog internally
import * as DialogPrimitive from '@radix-ui/react-dialog';

// Logo component using Next.js Image component
const Logo = ({ className = '' }: { className?: string }) => (
  <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
    <div className="flex items-center justify-center w-8 h-8">
      <Image 
        src="/pokeshelf-logo.svg" 
        alt="PokéShelf Logo" 
        width={32} 
        height={32}
        priority
      />
    </div>
    <span className="inline-block text-xl md:text-2xl font-bold tracking-tight translate-y-[1px]">
      poké<span className="text-primary">shelf</span>
    </span>
  </Link>
);

// Search form component
const SearchForm = ({ 
  search, 
  setSearch, 
  handleSubmit
}: { 
  search: string; 
  setSearch: (value: string) => void; 
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) => (
  <form 
    onSubmit={handleSubmit} 
    className="hidden md:flex items-center"
  >
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
);

// Navigation links component
const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => {
  const commonLinkClass = isMobile
    ? "text-base font-medium px-2 py-1.5 rounded-md hover:bg-muted"
    : "text-sm font-medium transition-colors hover:text-primary";
    
  const links = [
    { href: "/sets", label: "Sets" },
    { href: "/collection", label: "My Collection", requireAuth: true },
    { href: "/wishlist", label: "Wishlist", requireAuth: true },
  ];

  return (
    <nav className={isMobile ? "flex flex-col space-y-4" : "hidden md:flex items-center gap-6"}>
      {links.map(link => (
        (!link.requireAuth || (link.requireAuth)) && (
          <React.Fragment key={link.href}>
            {isMobile ? (
              <SheetClose asChild>
                <Link href={link.href} className={commonLinkClass} prefetch={false}>
                  {link.label}
                </Link>
              </SheetClose>
            ) : (
              <Link href={link.href} className={commonLinkClass} prefetch={false}>
                {link.label}
              </Link>
            )}
          </React.Fragment>
        )
      ))}
      
      {/* Admin link handling is special */}
      {isMobile ? (
        <div className="px-2 py-1.5">
          <AdminNavLink />
        </div>
      ) : (
        <AdminNavLink />
      )}
    </nav>
  );
};

// Authentication buttons component
const AuthButtons = ({ isMobile = false }: { isMobile?: boolean }) => (
  <SignedOut>
    {isMobile ? (
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
    ) : (
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
    )}
  </SignedOut>
);

// Main navigation component
const MainNav = () => {
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleMobileSearch = () => {
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-sm bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 md:px-6 py-3">
        <div className="flex h-14 items-center justify-between">
          {/* Logo & Nav */}
          <div className="flex items-center gap-6 md:gap-8">
            <Logo />

            {/* Desktop Navigation */}
            <SignedIn>
              <NavLinks />
            </SignedIn>
          </div>

          {/* Search, Auth, & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Search Field (desktop only) */}
            <SearchForm search={search} setSearch={setSearch} handleSubmit={handleSubmit} />

            {/* Mobile search button - opens the search dialog */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Authentication */}
            <AuthButtons />
            
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-9 h-9 border-2 border-primary/25'
                  }
                }}
              />
            </SignedIn>

            {/* Mobile Menu Hamburger - with direct Radix Dialog Title */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] sm:w-[350px]">
                {/* This is the key fix - adding the DialogTitle directly from Radix */}
                <DialogPrimitive.Title className="sr-only">
                  Navigation Menu
                </DialogPrimitive.Title>
                
                {/* Standard shadcn SheetHeader for visual title */}
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col h-full py-6">
                  <Logo className="mb-6" />
                  
                  {/* Mobile Navigation */}
                  <SignedIn>
                    <NavLinks isMobile={true} />
                  </SignedIn>
                  
                  {/* Mobile Auth Buttons */}
                  <div className="mt-auto border-t border-border pt-6">
                    <AuthButtons isMobile={true} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Mobile search dialog with proper accessibility */}
            <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogTitle>Search Cards</DialogTitle>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search for a card name..."
                      className="pr-10"
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={() => setMobileSearchOpen(false)} variant="outline">Cancel</Button>
                  <Button type="button" onClick={handleMobileSearch} disabled={!search.trim()}>Search</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainNav;