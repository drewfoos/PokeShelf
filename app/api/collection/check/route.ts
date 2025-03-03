// app/api/collection/check/route.ts - Updated for variant support
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check user auth
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the cardId and optional variant from the query parameters
    const url = new URL(request.url);
    const cardId = url.searchParams.get('cardId');
    const variant = url.searchParams.get('variant') || 'normal'; // Default to 'normal' if not specified
    
    if (!cardId) {
      return NextResponse.json(
        { error: "Card ID is required" },
        { status: 400 }
      );
    }
    
    // Get the card to validate it exists
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true }
    });
   
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    
    // Get the user record from our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { collection: true }
    });
    
    // If user doesn't exist in our database or doesn't have a collection
    if (!dbUser || !dbUser.collection) {
      return NextResponse.json(
        { inCollection: false, variants: [] },
        { status: 200 }
      );
    }
    
    // If a specific variant was requested, check just that variant
    if (variant !== 'all') {
      // Check if the specific variant is in the user's collection
      const userCard = await prisma.userCard.findUnique({
        where: {
          userCard_collection_card_variant_unique: {
            collectionId: dbUser.collection.id,
            cardId: cardId,
            variant: variant
          }
        }
      });
      
      return NextResponse.json(
        { 
          inCollection: userCard !== null,
          quantity: userCard?.quantity || 0,
          variant: variant
        },
        { status: 200 }
      );
    } 
    // Otherwise, get all variants of this card
    else {
      // Get all variants of this card in the user's collection
      const userCards = await prisma.userCard.findMany({
        where: {
          collectionId: dbUser.collection.id,
          cardId: cardId
        }
      });
      
      const variants = userCards.map(card => ({
        variant: card.variant,
        quantity: card.quantity,
        condition: card.condition
      }));
      
      return NextResponse.json(
        { 
          inCollection: userCards.length > 0,
          variants: variants
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error checking collection status:', error);
    return NextResponse.json(
      { error: "Failed to check collection status" },
      { status: 500 }
    );
  }
}