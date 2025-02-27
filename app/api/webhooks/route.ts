import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error: Could not verify webhook:', err);
    return new Response('Error: Verification error', {
      status: 400,
    });
  }

  // Process the webhook based on event type
  try {
    if (evt.type === 'user.created') {
      // A new user has been created in Clerk
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;
      
      // Get the primary email
      const primaryEmail = email_addresses && email_addresses.length > 0 
        ? email_addresses[0].email_address 
        : '';
      
      // Create the user in our database
      await prisma.user.create({
        data: {
          clerkId: id,
          email: primaryEmail,
          name: `${first_name || ''} ${last_name || ''}`.trim() || username || 'User',
          imageUrl: image_url,
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
        }
      });

      console.log(`User created with ID: ${id}`);
    } else if (evt.type === 'user.updated') {
      // User information has been updated in Clerk
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;
      
      // Get the primary email
      const primaryEmail = email_addresses && email_addresses.length > 0 
        ? email_addresses[0].email_address 
        : '';
      
      // Find the user in our database by Clerk ID
      const user = await prisma.user.findUnique({
        where: { clerkId: id }
      });
      
      if (user) {
        // Update the user's information
        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: primaryEmail,
            name: `${first_name || ''} ${last_name || ''}`.trim() || username || 'User',
            imageUrl: image_url
          }
        });
        
        console.log(`User updated with ID: ${id}`);
      } else {
        // If user doesn't exist (which shouldn't happen, but just in case),
        // create them along with a collection and wishlist
        await prisma.user.create({
          data: {
            clerkId: id,
            email: primaryEmail,
            name: `${first_name || ''} ${last_name || ''}`.trim() || username || 'User',
            imageUrl: image_url,
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
          }
        });
        
        console.log(`User created during update with ID: ${id}`);
      }
    } else if (evt.type === 'user.deleted') {
      // User has been deleted from Clerk
      const { id } = evt.data;
      
      // Find and delete the user from our database
      const user = await prisma.user.findUnique({
        where: { clerkId: id }
      });
      
      if (user) {
        // This will cascade delete the collection and wishlist as well
        // based on the onDelete: Cascade in your Prisma schema
        await prisma.user.delete({
          where: { clerkId: id }
        });
        
        console.log(`User deleted with ID: ${id}`);
      }
    }
    
    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}