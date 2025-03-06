'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Grid, List, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import CollectionCardGrid from '@/components/collection/collection-card-grid';
import CollectionSetView from '@/components/collection/collection-set-view';
// Import standardized types
import { GroupedCard } from '@/types';

// Client-side collection page component
export default function CollectionPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get query parameters
  const q = searchParams.get('q') || '';
  const set = searchParams.get('set') || '';
  const type = searchParams.get('type') || '';
  const rarity = searchParams.get('rarity') || '';
  
  // State for search form
  const [searchTerm, setSearchTerm] = useState(q);
  const [selectedSet, setSelectedSet] = useState(set || 'all');
  const [selectedType, setSelectedType] = useState(type || 'all');
  const [selectedRarity, setSelectedRarity] = useState(rarity || 'all');
  
  // State for collection data (will be loaded via useEffect)
  const [cards, setCards] = useState<GroupedCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<GroupedCard[]>([]);
  const [setStats, setSetStats] = useState<Array<{
    id: string;
    name: string;
    series: string;
    releaseDate: string;
    totalInSet: number;
    cardsInCollection: number;
    percentComplete: number;
    images: {
      symbol?: string;
      logo?: string;
    } | null;
  }>>([]);
  const [filterOptions, setFilterOptions] = useState({
    sets: [] as {id: string, name: string}[],
    types: [] as string[],
    rarities: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load collection data
  useEffect(() => {
    async function loadCollection() {
      setLoading(true);
      
      try {
        const response = await fetch('/api/collection');
        
        if (!response.ok) {
          throw new Error('Failed to load collection');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load collection');
        }
        
        // Set collection data
        setCards(data.groupedCards || []);
        setSetStats(data.setStats || []);
        
        // Extract filter options
        const uniqueSets = new Map();
        const uniqueTypes = new Set<string>();
        const uniqueRarities = new Set<string>();
        
        data.groupedCards.forEach((item: GroupedCard) => {
          // Add set
          uniqueSets.set(item.card.setId, {
            id: item.card.setId,
            name: item.card.setName
          });
          
          // Add types
          if (item.card.types) {
            item.card.types.forEach(type => uniqueTypes.add(type));
          }
          
          // Add rarity
          if (item.card.rarity) {
            uniqueRarities.add(item.card.rarity);
          }
        });
        
        setFilterOptions({
          sets: Array.from(uniqueSets.values()),
          types: Array.from(uniqueTypes),
          rarities: Array.from(uniqueRarities)
        });
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }
    
    loadCollection();
  }, []);
  
  // Filter cards when search parameters change
  useEffect(() => {
    if (!cards.length) return;
    
    let filtered = [...cards];
    
    // Filter by search term
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(item => 
        item.card.name.toLowerCase().includes(query)
      );
    }
    
    // Filter by set
    if (set && set !== 'all') {
      filtered = filtered.filter(item => item.card.setId === set);
    }
    
    // Filter by type
    if (type && type !== 'all') {
      filtered = filtered.filter(item => 
        item.card.types && item.card.types.includes(type)
      );
    }
    
    // Filter by rarity
    if (rarity && rarity !== 'all') {
      filtered = filtered.filter(item => item.card.rarity === rarity);
    }
    
    setFilteredCards(filtered);
  }, [cards, q, set, type, rarity]);
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build the query string
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('q', searchTerm);
    if (selectedSet && selectedSet !== 'all') params.set('set', selectedSet);
    if (selectedType && selectedType !== 'all') params.set('type', selectedType);
    if (selectedRarity && selectedRarity !== 'all') params.set('rarity', selectedRarity);
    
    // Navigate to the same page with the updated search parameters
    router.push(`/collection?${params.toString()}`);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSet('all');
    setSelectedType('all');
    setSelectedRarity('all');
    router.push('/collection');
  };
  
  // Check if filters are applied
  const hasFilters = q || set || type || rarity;
  
  // Render loading state
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-64 bg-muted rounded-md"></div>
        <div className="h-24 bg-muted rounded-md"></div>
        <div className="h-96 bg-muted rounded-md"></div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Collection Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">My Collection</h1>
      </div>
      
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Card Name</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search by card name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Set Filter */}
              <div className="space-y-2">
                <Label htmlFor="set-filter">Set</Label>
                <Select value={selectedSet} onValueChange={setSelectedSet}>
                  <SelectTrigger id="set-filter">
                    <SelectValue placeholder="All Sets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sets</SelectItem>
                    {filterOptions.sets.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="type-filter">Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {filterOptions.types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Rarity Filter */}
              <div className="space-y-2">
                <Label htmlFor="rarity-filter">Rarity</Label>
                <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                  <SelectTrigger id="rarity-filter">
                    <SelectValue placeholder="All Rarities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rarities</SelectItem>
                    {filterOptions.rarities.map((rarity) => (
                      <SelectItem key={rarity} value={rarity}>
                        {rarity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {hasFilters && (
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={clearFilters}
                  className="flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      
      {hasFilters ? (
        // Show search results
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Search Results ({filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'})
            </h2>
          </div>
          
          <Separator />
          
          {filteredCards.length > 0 ? (
            <CollectionCardGrid cards={filteredCards} className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" />
          ) : (
            <div className="text-center py-12 border rounded-lg bg-card">
              <h3 className="text-xl font-medium mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-4">
                No cards match your search criteria
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Show tabs view when not searching
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              <span>All Cards</span>
            </TabsTrigger>
            <TabsTrigger value="sets" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span>By Set</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {cards.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">All Cards ({cards.length})</h2>
                </div>
                
                <Separator />
                
                <CollectionCardGrid cards={cards} className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" />
              </div>
            ) : (
              <EmptyCollection />
            )}
          </TabsContent>
          
          <TabsContent value="sets" className="mt-6">
            {setStats && setStats.length > 0 ? (
              <CollectionSetView sets={setStats} />
            ) : (
              <EmptyCollection message="Add cards to your collection to see them organized by set." />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function EmptyCollection({ message }: { message?: string }) {
  return (
    <div className="text-center py-12 border rounded-lg bg-card">
      <h3 className="text-xl font-medium mb-2">Your collection is empty</h3>
      <p className="text-muted-foreground mb-6">
        {message || "Start adding cards to track your Pokémon collection"}
      </p>
      <Button asChild>
        <Link href="/sets">
          Browse Sets to Add Cards
        </Link>
      </Button>
    </div>
  );
}