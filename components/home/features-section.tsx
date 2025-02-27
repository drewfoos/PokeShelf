import React from 'react';
import { Search, Database, Heart, TrendingUp } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: 'Browse Cards',
      description: 'Search and browse through thousands of Pokémon cards from all sets.'
    },
    {
      icon: <Database className="h-6 w-6 text-primary" />,
      title: 'Track Collection',
      description: 'Keep track of all the cards you own, including condition and quantity.'
    },
    {
      icon: <Heart className="h-6 w-6 text-primary" />,
      title: 'Manage Wishlist',
      description: 'Create and manage your wishlist to track cards you want to acquire.'
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: 'Price Tracking',
      description: 'Monitor card values and price history to make informed decisions.'
    }
  ];

  return (
    <section className="py-12 bg-muted/50 rounded-xl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Everything You Need For Your Collection</h2>
          <p className="text-muted-foreground">
            PokéTracker gives you powerful tools to manage your Pokémon card collection with ease.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center bg-card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;