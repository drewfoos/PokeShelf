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

// Logo component for reusability
const Logo = ({ className = '' }: { className?: string }) => (
  <Link href="/" className={`flex items-center gap-2 ${className}`}>
    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
      <span className="font-bold text-lg text-primary-foreground">P</span>
    </div>
    <span className="font-bold text-xl md:text-2xl">PokéShelf</span>
  </Link>
);

// Search form component
const SearchForm = ({ 
  search, 
  setSearch, 
  handleSubmit, 
  isMobile = false,
  onSearchSubmit = () => {} 
}: { 
  search: string; 
  setSearch: (value: string) => void; 
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isMobile?: boolean;
  onSearchSubmit?: () => void;
}) => (
  <form 
    onSubmit={(e) => {
      handleSubmit(e);
      if (isMobile) onSearchSubmit();
    }} 
    className={isMobile ? "mb-6" : "hidden md:flex items-center"}
  >
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search cards..."
        className={isMobile 
          ? "w-full rounded-md border border-border bg-muted py-2 pl-10 pr-4 text-sm" 
          : "rounded-full border border-border bg-muted py-2 pl-10 pr-4 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        }
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
                <Link href={link.href} className={commonLinkClass}>
                  {link.label}
                </Link>
              </SheetClose>
            ) : (
              <Link href={link.href} className={commonLinkClass}>
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

// Mobile menu content component
const MobileMenuContent = ({ search, setSearch, handleSubmit }: { 
  search: string; 
  setSearch: (value: string) => void; 
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) => (
  <div className="flex flex-col h-full">
    <div className="py-6">
      <Logo className="mb-6" />
      
      {/* Mobile Search */}
      <SearchForm 
        search={search} 
        setSearch={setSearch} 
        handleSubmit={handleSubmit} 
        isMobile={true} 
        onSearchSubmit={() => document.querySelector<HTMLButtonElement>('[data-sheet-close]')?.click()}
      />
      
      {/* Mobile Navigation */}
      <SignedIn>
        <NavLinks isMobile={true} />
      </SignedIn>
    </div>
    
    {/* Mobile Auth Buttons */}
    <div className="mt-auto border-t border-border pt-6">
      <AuthButtons isMobile={true} />
    </div>
  </div>
);

// Main navigation component
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
            <Logo />

            {/* Desktop Navigation */}
            <SignedIn>
              <NavLinks />
            </SignedIn>
          </div>

          {/* Search, Auth, & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Search Field */}
            <SearchForm search={search} setSearch={setSearch} handleSubmit={handleSubmit} />

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

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] sm:w-[350px]">
                <MobileMenuContent 
                  search={search} 
                  setSearch={setSearch} 
                  handleSubmit={handleSubmit} 
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainNav;