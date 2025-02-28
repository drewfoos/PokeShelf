import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * Checks if the current user is an admin
 * @returns A boolean indicating if the user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    // Get the current user's Clerk ID
    const { userId } = await auth();
    
    if (!userId) return false;
    
    // Query the database to check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true }
    });
    
    return !!user?.isAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Middleware-like function to ensure the current user is an admin
 * Throws an error if the user is not an admin
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized: Admin access required");
  }
}

/**
 * Set a user as an admin by their email address
 * This should be called from admin-only routes
 */
export async function setUserAsAdmin(email: string): Promise<boolean> {
  try {
    // First ensure the current user is an admin
    await requireAdmin();
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }
    
    // Set the user as admin
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true }
    });
    
    return true;
  } catch (error) {
    console.error("Error setting user as admin:", error);
    return false;
  }
}

/**
 * Create initial admin based on environment variable
 * This should be called on app initialization or at a secure endpoint
 */
export async function initializeAdminUser(): Promise<void> {
  try {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    
    if (!adminEmail) {
      console.log("No INITIAL_ADMIN_EMAIL environment variable set, skipping admin initialization");
      return;
    }
    
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    });
    
    if (existingAdmin) {
      console.log("Admin user already exists, skipping initialization");
      return;
    }
    
    // Find the user by the email from the environment variable
    const user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!user) {
      console.log(`User with email ${adminEmail} not found, cannot set as admin`);
      return;
    }
    
    // Set the user as admin
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true }
    });
    
    console.log(`User ${adminEmail} has been set as the initial admin`);
  } catch (error) {
    console.error("Error initializing admin user:", error);
  }
}