import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { JsonValue } from '@prisma/client/runtime/library';

// Types based on your Prisma schema
interface PrismaSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  updatedAt: string;
  ptcgoCode: string | null;
  legalities: JsonValue;
  images: JsonValue;
  lastUpdated: Date;
}

interface RecentSetsProps {
  sets?: PrismaSet[] | null;
}

const RecentSets: React.FC<RecentSetsProps> = ({ sets }) => {
  // If no sets provided or there was an error fetching, show placeholders
  const displaySets = sets && sets.length > 0 ? sets : [
    {
      id: "placeholder-1",
      name: "Base Set",
      series: "Base",
      printedTotal: 102,
      total: 102,
      releaseDate: "1999/01/09",
      updatedAt: "",
      ptcgoCode: null,
      legalities: {},
      images: {},
      lastUpdated: new Date()
    },
    {
      id: "placeholder-2",
      name: "Jungle",
      series: "Base",
      printedTotal: 64,
      total: 64,
      releaseDate: "1999/06/16",
      updatedAt: "",
      ptcgoCode: null,
      legalities: {},
      images: {},
      lastUpdated: new Date()
    },
    {
      id: "placeholder-3",
      name: "Fossil",
      series: "Base",
      printedTotal: 62,
      total: 62,
      releaseDate: "1999/10/10",
      updatedAt: "",
      ptcgoCode: null,
      legalities: {},
      images: {},
      lastUpdated: new Date()
    },
    {
      id: "placeholder-4",
      name: "Team Rocket",
      series: "Base",
      printedTotal: 83,
      total: 83, 
      releaseDate: "2000/04/24",
      updatedAt: "",
      ptcgoCode: null,
      legalities: {},
      images: {},
      lastUpdated: new Date()
    }
  ];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-10 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Latest Sets</h2>
          <Link 
            href="/sets" 
            className="group inline-flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            View All Sets
            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {displaySets.map((set) => (
            <Link href={`/sets/${set.id}`} key={set.id} className="block">
              <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-border/50 h-full">
                <div className="aspect-square relative bg-gradient-to-br from-primary/5 to-transparent p-4 flex items-center justify-center">
                  {/* Handle images safely, since it's a JsonValue */}
                  {set.images && typeof set.images === 'object' && set.images !== null && 
                   'logo' in set.images && typeof set.images.logo === 'string' ? (
                    <div className="relative w-full h-24">
                      <Image 
                        src={set.images.logo}
                        alt={`${set.name} logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-2/3 h-2/3 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-5xl font-bold text-primary/40">
                        {set.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Set symbol if available */}
                  {set.images && typeof set.images === 'object' && set.images !== null && 
                   'symbol' in set.images && typeof set.images.symbol === 'string' && (
                    <div className="absolute bottom-3 right-3 h-8 w-8">
                      <Image 
                        src={set.images.symbol}
                        alt={`${set.name} symbol`}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <h3 className="font-semibold mb-1">{set.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {set.series} • {set.printedTotal} cards
                  </p>
                  <div className="flex items-center mt-3 text-xs text-muted-foreground">
                    <span>Released: {formatReleaseDate(set.releaseDate)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// Helper function to format the release date
function formatReleaseDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export default RecentSets;
