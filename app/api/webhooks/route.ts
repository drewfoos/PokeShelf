import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Svix webhook IP addresses
const ALLOWED_IPS = [
  // US
  "44.228.126.217", "50.112.21.217", "52.24.126.164", "54.148.139.208", 
  // US-East
  "54.164.207.221", "54.90.7.123",
  // EU
  "52.215.16.239", "54.216.8.72", "63.33.109.123",
  // India
  "13.126.41.108", "15.207.218.84", "65.2.133.31"
];

export async function POST(req: Request) {
  console.log("Webhook received");
  
  try {
    // Get the SIGNING_SECRET from environment variables
    const SIGNING_SECRET = process.env.SIGNING_SECRET;

    if (!SIGNING_SECRET) {
      console.error("Error: SIGNING_SECRET is missing");
      return new Response('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local', {
        status: 500,
      });
    }

    // Create new Svix instance with secret
    const wh = new Webhook(SIGNING_SECRET);

    // Get headers - must be awaited in Next.js 15
    const headerPayload = headers();
    const svix_id = (await headerPayload).get('svix-id');
    const svix_timestamp = (await headerPayload).get('svix-timestamp');
    const svix_signature = (await headerPayload).get('svix-signature');
    const clientIp = (await headerPayload).get('x-forwarded-for')?.split(',')[0]?.trim();

    // IP validation in production
    if (process.env.NODE_ENV === 'production' && clientIp && !ALLOWED_IPS.includes(clientIp)) {
      console.error(`Unauthorized webhook attempt from IP: ${clientIp}`);
      return new Response('Unauthorized IP', { status: 403 });
    }

    // If there are no Svix headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing Svix headers");
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
    const eventType = evt.type;
    console.log(`Received webhook with event type: ${eventType}`);
    
    if (eventType === 'user.created') {
      // A new user has been created in Clerk
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;
      
      // Get the primary email
      const primaryEmail = email_addresses && email_addresses.length > 0 
        ? email_addresses[0].email_address 
        : '';
      
      console.log(`Creating user with ID: ${id}, username: ${username}, email: ${primaryEmail}`);
      
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
    } else if (eventType === 'user.updated') {
      // User information has been updated in Clerk
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;
      
      // Get the primary email
      const primaryEmail = email_addresses && email_addresses.length > 0 
        ? email_addresses[0].email_address 
        : '';
      
      console.log(`Updating user with ID: ${id}, email: ${primaryEmail}`);
      
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
    } else if (eventType === 'user.deleted') {
      // User has been deleted from Clerk
      const { id } = evt.data;
      
      console.log(`Deleting user with ID: ${id}`);
      
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
    
    // IMPORTANT: Always return a response to prevent webhook retries
    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Return a 200 response even on error to prevent continuous retries that might flood logs
    // You can adjust this strategy based on your preferences
    return new Response(`Error processed: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
      status: 200 
    });
  }
}