import { SignedOut } from '@clerk/nextjs';
import prisma from '@/lib/prisma';
import HeroSection from '@/components/home/hero-section';
import FeaturesSection from '@/components/home/features-section';
import RecentSets from '@/components/home/recent-sets';
import CTASection from '@/components/home/cta-section';

// Make this page dynamic to ensure we get fresh data each time
export const revalidate = 86400;

async function getRecentSets() {
  try {
    // Get the most recent sets based on release date
    const sets = await prisma.set.findMany({
      orderBy: {
        releaseDate: 'desc',
      },
      take: 4, // Just get the 4 most recent sets
    });
    
    return sets;
  } catch (error) {
    console.error('Failed to fetch recent sets:', error);
    return null;
  }
}

// Home page with modular components and dynamic data
export default async function HomePage() {
  // Fetch recent sets from database
  const recentSets = await getRecentSets();
  
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <HeroSection />

      {/* Recent Sets Section */}
      <RecentSets sets={recentSets} />

      {/* Features Section */}
      <FeaturesSection />
      
      {/* CTA Section - only show when signed out */}
      <SignedOut>
        <CTASection />
      </SignedOut>
    </div>
  );
}