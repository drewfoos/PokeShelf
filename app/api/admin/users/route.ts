import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, setUserAsAdmin, initializeAdminUser } from '@/lib/admin';
import prisma from '@/lib/prisma';

// GET route to list all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Ensure the user is an admin
    await requireAdmin();
    
    // Get query parameters
    const searchParams = new URL(request.url).searchParams;
    const searchTerm = searchParams.get('search') || '';
    
    // Find users matching the search term
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to 100 users for performance
    });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error getting users:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST route to create/update admin users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email } = body;
    
    if (action === 'initialize') {
      // Special case: Initialize the first admin user
      // This should only be callable when there are no admins
      const adminExists = await prisma.user.findFirst({
        where: { isAdmin: true }
      });
      
      if (adminExists) {
        return NextResponse.json(
          { error: 'Admin user already exists' },
          { status: 400 }
        );
      }
      
      await initializeAdminUser();
      return NextResponse.json({ success: true, message: 'Initial admin user created' });
    }
    
    // All other actions require admin authentication
    await requireAdmin();
    
    if (action === 'setAdmin') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }
      
      const success = await setUserAsAdmin(email);
      if (success) {
        return NextResponse.json({ success, message: `User ${email} is now an admin` });
      } else {
        return NextResponse.json(
          { error: `Failed to set ${email} as admin` },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error managing admin users:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}