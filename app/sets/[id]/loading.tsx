import React from 'react';

export default function SetDetailLoading() {
  return (
    <div className="space-y-8">
      <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
      
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Set Logo Placeholder */}
            <div className="w-full max-w-xs flex items-center justify-center">
              <div className="w-full h-40 bg-muted animate-pulse rounded-lg"></div>
            </div>
            
            {/* Set Details Placeholder */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded w-64 mx-auto md:mx-0"></div>
              <div className="h-6 bg-muted animate-pulse rounded w-48 mx-auto md:mx-0"></div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 max-w-lg">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-muted animate-pulse rounded w-24 mb-2"></div>
                    <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}