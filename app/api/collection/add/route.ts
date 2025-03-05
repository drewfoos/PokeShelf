// app/api/collection/add/route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { 
  AddToCollectionRequestParams, 
  CollectionModifyResponse,
  mapMongoUserCardToInterface
} from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Check user auth
    const { userId } = await auth();
    const user = await currentUser();
   
    if (!userId || !user) {
      // Fixed response with correct type structure
      const response: CollectionModifyResponse = {
        success: false,
        error: "Unauthorized"
      };
      return NextResponse.json(response, { status: 401 });
    }
   
    // Parse the request body with proper typing
    const body: AddToCollectionRequestParams = await request.json();
    const { 
      cardId, 
      quantity = 1, 
      condition = "Near Mint", 
      isFoil = false, 
      isFirstEdition = false, 
      purchasePrice,
      variant = "normal" // Default to 'normal' if not specified
    } = body;
   
    if (!cardId) {
      // Fixed response with correct type structure
      const response: CollectionModifyResponse = {
        success: false,
        error: "Card ID is required"
      };
      return NextResponse.json(response, { status: 400 });
    }
   
    // Get the card to validate it exists
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true }
    });
   
    if (!card) {
      // Fixed response with correct type structure
      const response: CollectionModifyResponse = {
        success: false,
        error: "Card not found"
      };
      return NextResponse.json(response, { status: 404 });
    }
   
    // Rest of the function remains the same...
    
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
      
      console.log(`User created during add card operation with ID: ${userId}`);
    }
   
    // Variable to hold the collection ID
    let collectionId: string;
   
    // If no collection exists, create one
    if (!dbUser.collection) {
      const newCollection = await prisma.userCollection.create({
        data: {
          user: { connect: { id: dbUser.id } },
          totalCards: 0,
          uniqueCards: 0,
          estimatedValue: 0
        }
      });
     
      collectionId = newCollection.id;
    } else {
      collectionId = dbUser.collection.id;
    }
   
    // Check if the card already exists with the same variant in the collection
    const existingUserCard = await prisma.userCard.findUnique({
        where: {
          userCard_collection_card_variant_unique: {
            collectionId: collectionId,
            cardId: cardId,
            variant: variant,
          },
        },
      });
   
    // Start a transaction to update everything
    const result = await prisma.$transaction(async (tx) => {
      let userCard;
     
      if (existingUserCard) {
        // Update the existing card
        userCard = await tx.userCard.update({
          where: { id: existingUserCard.id },
          data: {
            quantity: existingUserCard.quantity + quantity,
            condition: condition,
            isFoil: isFoil,
            isFirstEdition: isFirstEdition,
            purchasePrice: purchasePrice || existingUserCard.purchasePrice,
            variant: variant // Ensure variant is saved
          }
        });
       
        // Update collection stats
        await tx.userCollection.update({
          where: { id: collectionId },
          data: {
            totalCards: { increment: quantity }
          }
        });
      } else {
        // Add the new card
        userCard = await tx.userCard.create({
          data: {
            collection: { connect: { id: collectionId } },
            card: { connect: { id: cardId } },
            quantity: quantity,
            condition: condition,
            isFoil: isFoil,
            isFirstEdition: isFirstEdition,
            purchasePrice: purchasePrice,
            purchaseDate: new Date(),
            variant: variant // Save the variant
          }
        });
       
        // Update collection stats
        await tx.userCollection.update({
          where: { id: collectionId },
          data: {
            totalCards: { increment: quantity },
            uniqueCards: { increment: 1 }
          }
        });
      }
     
      return userCard;
    });
   
    // Convert the Prisma result to our typed interface
    const typedUserCard = mapMongoUserCardToInterface(result);
    
    // Fixed response with correct type structure
    const response: CollectionModifyResponse = {
      success: true,
      message: existingUserCard ? "Card quantity updated" : "Card added to collection",
      card: typedUserCard
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error adding card to collection:", error);
    
    // Fixed response with correct type structure
    const response: CollectionModifyResponse = {
      success: false,
      error: "Failed to add card to collection"
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}