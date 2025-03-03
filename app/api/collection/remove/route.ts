// app/api/collection/remove/route.ts - Updated for variant support
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check user auth
    const { userId } = await auth();
    const user = await currentUser();
   
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
   
    // Parse the request body
    const body = await request.json();
    const { 
      cardId, 
      quantity = 1, 
      removeAll = false,
      variant = 'normal' // Default to normal if not specified
    } = body;
   
    if (!cardId) {
      return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
    }
   
    // Get the user record from our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { collection: true }
    });
   
    // If user doesn't exist or doesn't have a collection, there's nothing to remove
    if (!dbUser || !dbUser.collection) {
      return NextResponse.json({ error: "Card not found in collection" }, { status: 404 });
    }
   
    const collectionId = dbUser.collection.id;
   
    // Check if the specific variant exists in the collection
    const userCard = await prisma.userCard.findUnique({
      where: {
        userCard_collection_card_variant_unique: {
          collectionId: collectionId,
          cardId: cardId,
          variant: variant
        }
      }
    });
   
    if (!userCard) {
      return NextResponse.json({ error: "Card variant not found in collection" }, { status: 404 });
    }
   
    // Determine how many cards to remove
    const quantityToRemove = removeAll ? userCard.quantity : Math.min(quantity, userCard.quantity);
    const newQuantity = userCard.quantity - quantityToRemove;
   
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      if (newQuantity <= 0 || removeAll) {
        // Remove the card variant entirely
        await tx.userCard.delete({
          where: { id: userCard.id }
        });
       
        // Update collection stats
        await tx.userCollection.update({
          where: { id: collectionId },
          data: {
            totalCards: { decrement: userCard.quantity },
            uniqueCards: { decrement: 1 }
          }
        });
       
        return { removed: true, newQuantity: 0 };
      } else {
        // Update the quantity
        const updated = await tx.userCard.update({
          where: { id: userCard.id },
          data: {
            quantity: newQuantity
          }
        });
       
        // Update collection stats
        await tx.userCollection.update({
          where: { id: collectionId },
          data: {
            totalCards: { decrement: quantityToRemove }
          }
        });
       
        return { removed: false, newQuantity: updated.quantity };
      }
    });
   
    return NextResponse.json({
      success: true,
      message: result.removed ? "Card variant removed from collection" : "Card variant quantity updated",
      newQuantity: result.newQuantity,
      variant: variant
    });
  } catch (error) {
    console.error("Error removing card from collection:", error);
    return NextResponse.json({ error: "Failed to remove card from collection" }, { status: 500 });
  }
}