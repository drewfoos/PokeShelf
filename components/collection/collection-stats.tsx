'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3,
  BookText, // Use BookText icon instead of CircleStack
  CreditCard, 
  DollarSign, 
  Layers,
  Star,
  TrendingUp
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { UserCollection } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TrendProps {
  type: 'up' | 'down' | 'neutral';
  value: string;
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: TrendProps;
  footer?: React.ReactNode;
}

const StatsCard = ({ title, value, description, icon, trend, footer }: StatsCardProps) => (
  <Card className="overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {trend && (
        <div className={`flex items-center text-xs mt-1 ${
          trend.type === 'up' ? 'text-green-500' : 
          trend.type === 'down' ? 'text-red-500' : 
          'text-gray-500'
        }`}>
          {trend.type === 'up' ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : trend.type === 'down' ? (
            <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
          ) : null}
          <span>{trend.value}</span>
        </div>
      )}
    </CardContent>
    {footer && <CardFooter className="px-4 pt-0 pb-3">{footer}</CardFooter>}
  </Card>
);

export default function CollectionStats({ collection }: { collection: UserCollection }) {
  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Cards"
          value={collection.totalCards.toString()}
          icon={<BookText className="h-4 w-4 text-primary" />}
          description="Cards in your collection"
          trend={collection.totalCards > 0 ? { type: 'up', value: '100%' } : undefined}
        />
        
        <StatsCard
          title="Unique Cards"
          value={collection.uniqueCards.toString()}
          icon={<CreditCard className="h-4 w-4 text-primary" />}
          description="Different cards collected"
          footer={
            <div className="w-full pt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Completion Rate</span>
                <span>{Math.min(Math.ceil((collection.uniqueCards / 10000) * 100), 100)}%</span>
              </div>
              <Progress value={Math.min(Math.ceil((collection.uniqueCards / 10000) * 100), 100)} className="h-1" />
              <div className="text-xs text-muted-foreground mt-1 text-right">
                Estimated total: 10,000+ cards
              </div>
            </div>
          }
        />
        
        <StatsCard
          title="Estimated Value"
          value={formatPrice(collection.estimatedValue)}
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          description="Based on market prices"
          trend={collection.estimatedValue > 0 ? { type: 'up', value: 'Updated daily' } : undefined}
        />
      </div>
      
      {/* Additional Collection Insights */}
      <div className="p-4 rounded-xl border bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Collection Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Collection Progress
            </h3>
            <p className="text-sm text-muted-foreground">
              {collection.uniqueCards === 0 
                ? "Start adding cards to see your collection progress."
                : `You've collected ${collection.uniqueCards} unique Pokémon cards. Keep going!`}
            </p>
            
            <div className="mt-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/sets">Browse All Sets</Link>
              </Button>
            </div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-primary" />
              Collection Goals
            </h3>
            <p className="text-sm text-muted-foreground">
              {collection.totalCards === 0
                ? "Set goals for your collection to track your progress."
                : `Keep collecting to build your perfect collection.`
              }
            </p>
            
            <div className="mt-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/search">Find New Cards</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}