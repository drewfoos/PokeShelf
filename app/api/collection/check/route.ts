// app/api/collection/check/route.ts
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
    
    // Get the cardId from the query parameters
    const url = new URL(request.url);
    const cardId = url.searchParams.get('cardId');
    
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
        { inCollection: false },
        { status: 200 }
      );
    }
    
    // Check if the card is in the user's collection
    const userCard = await prisma.userCard.findUnique({
      where: {
        userCard_collection_card_unique: {
          collectionId: dbUser.collection.id,
          cardId: cardId
        }
      }
    });
    
    return NextResponse.json(
      { 
        inCollection: userCard !== null,
        quantity: userCard?.quantity || 0
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking collection status:', error);
    return NextResponse.json(
      { error: "Failed to check collection status" },
      { status: 500 }
    );
  }
}