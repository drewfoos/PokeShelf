import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CollectionLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="h-10 w-40 bg-muted animate-pulse rounded-md"></div>
        <div className="h-10 w-28 bg-muted animate-pulse rounded-md"></div>
      </div>
      
      {/* Collection Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded-md"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded-md"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded-md"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded-md"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded-md"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded-md"></div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
          <TabsTrigger value="sets">By Set</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden h-full">
                <div className="p-2">
                  <div className="aspect-[3/4] bg-muted animate-pulse rounded"></div>
                </div>
                <CardContent className="p-3 pt-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded-md"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="sets" className="mt-6">
          <div className="h-40 bg-muted animate-pulse rounded-lg"></div>
        </TabsContent>
      </Tabs>
    </div>
  );
}