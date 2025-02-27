import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Prisma client
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('Clearing database...');
    
    // Use Prisma's raw MongoDB access to drop collections
    const collections = [
      'Card',
      'Set',
      'User',
      'UserCollection',
      'UserCard',
      'Wishlist',
      'WishlistItem',
      'PriceHistory'
    ];
    
    for (const collection of collections) {
      try {
        // @ts-ignore - using Prisma's internal MongoDB client
        await prisma.$runCommandRaw({
          drop: collection
        });
        console.log(`Dropped collection: ${collection}`);
      } catch (error) {
        if (error instanceof Error) {
          console.log(`Could not drop collection ${collection}: ${error.message}`);
        } else {
          console.log(`Could not drop collection ${collection}:`, error);
        }
      }
    }
    
    console.log('Database cleared successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error clearing database:', error.message);
    } else {
      console.error('Error clearing database:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
clearDatabase();
