// app/api/collection/check/route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CollectionCheckResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Check user auth
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ 
        success: false,
        inCollection: false,
        error: "Unauthorized" 
      } as CollectionCheckResponse, { status: 401 });
    }
    
    // Get the cardId and optional variant from the query parameters
    const url = new URL(request.url);
    const cardId = url.searchParams.get('cardId');
    const variant = url.searchParams.get('variant') || 'normal'; // Default to 'normal' if not specified
    
    if (!cardId) {
      return NextResponse.json({
        success: false,
        inCollection: false,
        error: "Card ID is required"
      } as CollectionCheckResponse, { status: 400 });
    }
    
    // Get the card to validate it exists
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true }
    });
   
    if (!card) {
      return NextResponse.json({ 
        success: false,
        inCollection: false,
        error: "Card not found" 
      } as CollectionCheckResponse, { status: 404 });
    }
    
    // Get the user record from our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { collection: true }
    });
    
    // If user doesn't exist in our database or doesn't have a collection
    if (!dbUser || !dbUser.collection) {
      return NextResponse.json({
        success: true,
        inCollection: false,
        variants: []
      } as CollectionCheckResponse, { status: 200 });
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
      
      return NextResponse.json({ 
        success: true,
        inCollection: userCard !== null,
        quantity: userCard?.quantity || 0,
        variant: variant
      } as CollectionCheckResponse, { status: 200 });
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
      
      return NextResponse.json({ 
        success: true,
        inCollection: userCards.length > 0,
        variants: variants
      } as CollectionCheckResponse, { status: 200 });
    }
  } catch (error) {
    console.error('Error checking collection status:', error);
    return NextResponse.json({
      success: false,
      inCollection: false,
      error: "Failed to check collection status" 
    } as CollectionCheckResponse, { status: 500 });
  }
}