'use client';

import React from 'react';
import Link from 'next/link';
import CardGrid from '@/components/cards/cards-grid';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// Import standardized types
import { Card, Pagination, SearchCardsRequest } from '@/types';

interface SearchResultsProps {
  cards: Card[];
  pagination: Pagination;
  searchParams: SearchCardsRequest;
}

export default function SearchResults({ 
  cards, 
  pagination, 
  searchParams 
}: SearchResultsProps) {
  const { q, set, type, rarity } = searchParams;
  const { page, totalPages, totalCount } = pagination;
  
  // Function to build pagination URLs
  const buildPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams();
    
    // Add all current params
    if (q) params.set('q', q);
    if (set && set !== 'all') params.set('set', set);
    if (type && type !== 'all') params.set('type', type);
    if (rarity && rarity !== 'all') params.set('rarity', rarity);
    
    // Update the page
    params.set('page', newPage.toString());
    
    return `/search?${params.toString()}`;
  };
  
  // Generate pagination links
  const paginationLinks = [];
  
  // Add "Previous" button if not on first page
  if (page > 1) {
    paginationLinks.push(
      <Link key="prev" href={buildPaginationUrl(page - 1)}>
        <Button variant="outline" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
      </Link>
    );
  }
  
  // Generate numbered page links
  const generatePageLinks = () => {
    const links = [];
    const maxLinksToShow = 5; // Maximum number of numbered links to show
    
    let startPage = Math.max(1, page - Math.floor(maxLinksToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxLinksToShow - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxLinksToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxLinksToShow + 1);
    }
    
    // Add first page and ellipsis if necessary
    if (startPage > 1) {
      links.push(
        <Link key="1" href={buildPaginationUrl(1)}>
          <Button 
            variant="outline" 
            size="sm"
            className={`w-10 ${page === 1 ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}
          >
            1
          </Button>
        </Link>
      );
      
      if (startPage > 2) {
        links.push(
          <span key="ellipsis1" className="mx-1 text-muted-foreground">...</span>
        );
      }
    }
    
    // Add numbered links
    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <Link key={i} href={buildPaginationUrl(i)}>
          <Button 
            variant="outline" 
            size="sm"
            className={`w-10 ${page === i ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}
          >
            {i}
          </Button>
        </Link>
      );
    }
    
    // Add last page and ellipsis if necessary
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        links.push(
          <span key="ellipsis2" className="mx-1 text-muted-foreground">...</span>
        );
      }
      
      links.push(
        <Link key={totalPages} href={buildPaginationUrl(totalPages)}>
          <Button 
            variant="outline" 
            size="sm"
            className={`w-10 ${page === totalPages ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}
          >
            {totalPages}
          </Button>
        </Link>
      );
    }
    
    return links;
  };
  
  // Add numbered page links
  paginationLinks.push(...generatePageLinks());
  
  // Add "Next" button if not on last page
  if (page < totalPages) {
    paginationLinks.push(
      <Link key="next" href={buildPaginationUrl(page + 1)}>
        <Button variant="outline" size="sm">
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </Link>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Found {totalCount} result{totalCount !== 1 ? 's' : ''} for &quot;{q}&quot;
      </div>
      
      <CardGrid cards={cards} />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8">
          <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
            Page {page} of {totalPages}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {paginationLinks}
          </div>
        </div>
      )}
    </div>
  );
}