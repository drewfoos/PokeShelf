'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

interface AuthenticatedCollectionActionProps {
  children: React.ReactNode;
  fallbackText?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isIconOnly?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * A component that wraps collection actions and handles authentication state
 * Shows a sign-in button if the user is not authenticated
 */
export default function AuthenticatedCollectionAction({
  children,
  fallbackText = 'Sign in to add',
  size = 'default',
  isIconOnly = false,
  className = '',
  onClick
}: AuthenticatedCollectionActionProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Ensure hydration issues are avoided
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Event handler for unauthenticated users
  const handleUnauthenticatedClick = (e: React.MouseEvent) => {
    // Stop event propagation to prevent navigation
    e.preventDefault();
    e.stopPropagation();
    
    // If there's a custom click handler, call it
    if (onClick) {
      onClick(e);
    }
  };

  // Show a loading state while Clerk is loading
  if (!isClient || !isLoaded) {
    return (
      <Button disabled size={size} className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // If the user is signed in, show the children (actual collection action)
  if (isSignedIn) {
    return <>{children}</>;
  }

  // Otherwise, show a sign in button that matches the styling of the original button
  return (
    <SignInButton mode="modal">
      <Button 
        size={size} 
        className={isIconOnly ? `h-8 w-8 p-0 rounded-full bg-primary text-white shadow-md hover:bg-primary/90 transition-colors ${className}` : className}
        onClick={handleUnauthenticatedClick}
      >
        {isIconOnly ? (
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            {fallbackText}
          </>
        )}
      </Button>
    </SignInButton>
  );
}