// app/api/collection/remove/route.ts
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
    const { cardId, quantity = 1, removeAll = false } = body;
   
    if (!cardId) {
      return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
    }
   
    // Get the user record from our database or create it if it doesn't exist
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { collection: true }
    });
   
    // If user doesn't exist in our database, create them
    if (!dbUser) {
      // Extract user info from Clerk
      const primaryEmail = user.emailAddresses && user.emailAddresses.length > 0 
        ? user.emailAddresses[0].emailAddress 
        : '';
      
      const name = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim() 
        : user.username || 'User';
      
      // Create the user in our database
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: primaryEmail,
          name: name,
          imageUrl: user.imageUrl,
          // Also create an empty collection and wishlist for the user
          collection: {
            create: {
              totalCards: 0,
              uniqueCards: 0,
              estimatedValue: 0
            }
          },
          wishlist: {
            create: {}
          }
        },
        include: { collection: true }
      });
      
      console.log(`User created during remove card operation with ID: ${userId}`);
      
      // Since we just created the user, they won't have any cards to remove
      return NextResponse.json({ error: "Card not found in collection" }, { status: 404 });
    }
   
    // Check if user has a collection
    if (!dbUser.collection) {
      const newCollection = await prisma.userCollection.create({
        data: {
          user: { connect: { id: dbUser.id } },
          totalCards: 0,
          uniqueCards: 0,
          estimatedValue: 0
        }
      });
      
      // Since we just created the collection, there won't be any cards to remove
      return NextResponse.json({ error: "Card not found in collection" }, { status: 404 });
    }
   
    const collectionId = dbUser.collection.id;
   
    // Check if the card exists in the collection
    const userCard = await prisma.userCard.findUnique({
      where: {
        userCard_collection_card_unique: {
          collectionId: collectionId,
          cardId: cardId
        }
      }
    });
   
    if (!userCard) {
      return NextResponse.json({ error: "Card not found in collection" }, { status: 404 });
    }
   
    // Determine how many cards to remove
    const quantityToRemove = removeAll ? userCard.quantity : Math.min(quantity, userCard.quantity);
    const newQuantity = userCard.quantity - quantityToRemove;
   
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      if (newQuantity <= 0 || removeAll) {
        // Remove the card entirely
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
      message: result.removed ? "Card removed from collection" : "Card quantity updated",
      newQuantity: result.newQuantity
    });
  } catch (error) {
    console.error("Error removing card from collection:", error);
    return NextResponse.json({ error: "Failed to remove card from collection" }, { status: 500 });
  }
}