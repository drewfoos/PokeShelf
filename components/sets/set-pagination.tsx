'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  itemCount: number;
  pageSize: number;
  // Instead of a function, we'll pass the current filter values
  rarity?: string;
  type?: string;
}

const SetPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  baseUrl,
  itemCount,
  pageSize,
  rarity,
  type
}) => {
  // Create the URL with the required parameters
  const createPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set('page', pageNum.toString());
    
    if (rarity && rarity !== 'all') {
      params.set('rarity', rarity);
    }
    
    if (type && type !== 'all') {
      params.set('type', type);
    }
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Function to generate numbered page links
  const generatePageLinks = () => {
    const links = [];
    const maxLinksToShow = 5; // Maximum number of numbered links to show
    
    let startPage = Math.max(1, currentPage - Math.floor(maxLinksToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxLinksToShow - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxLinksToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxLinksToShow + 1);
    }
    
    // Add first page and ellipsis if necessary
    if (startPage > 1) {
      links.push(
        <Link key="1" href={createPageUrl(1)}>
          <Button 
            variant="outline" 
            size="sm"
            className={`w-10 ${currentPage === 1 ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}
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
        <Link key={i} href={createPageUrl(i)}>
          <Button 
            variant="outline" 
            size="sm"
            className={`w-10 ${currentPage === i ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}
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
        <Link key={totalPages} href={createPageUrl(totalPages)}>
          <Button 
            variant="outline" 
            size="sm"
            className={`w-10 ${currentPage === totalPages ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}
          >
            {totalPages}
          </Button>
        </Link>
      );
    }
    
    return links;
  };

  // Calculate the range of items being displayed
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, itemCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-8">
      <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
        Showing {startItem}-{endItem} of {itemCount} cards
      </div>
      
      <div className="flex flex-wrap items-center gap-2 justify-center">
        {/* Previous Button */}
        {currentPage > 1 && (
          <Link href={createPageUrl(currentPage - 1)}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          </Link>
        )}
        
        {/* Numbered Page Links */}
        {generatePageLinks()}
        
        {/* Next Button */}
        {currentPage < totalPages && (
          <Link href={createPageUrl(currentPage + 1)}>
            <Button variant="outline" size="sm">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default SetPagination;