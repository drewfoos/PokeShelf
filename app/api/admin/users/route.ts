// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, setUserAsAdmin, initializeAdminUser } from '@/lib/admin';
import prisma from '@/lib/prisma';
import { AdminUserRequest, AdminUserManagementResponse, AdminUsersResponse, mapMongoUserToInterface } from '@/types';

// GET route to list all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Ensure the user is an admin
    await requireAdmin();
    
    // Get query parameters
    const searchParams = new URL(request.url).searchParams;
    const searchTerm = searchParams.get('search') || '';
    
    // Find users matching the search term
    const userDocs = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to 100 users for performance
    });
    
    // Map the user documents to our User interface
    const users = userDocs.map(mapMongoUserToInterface);
    
    const response: AdminUsersResponse = { users };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting users:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' } as Partial<AdminUsersResponse>,
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' } as Partial<AdminUsersResponse>,
      { status: 500 }
    );
  }
}

// POST route to create/update admin users
export async function POST(request: NextRequest) {
  try {
    const body: AdminUserRequest = await request.json();
    const { action, email } = body;
    
    if (action === 'initialize') {
      // Special case: Initialize the first admin user
      // This should only be callable when there are no admins
      const adminExists = await prisma.user.findFirst({
        where: { isAdmin: true }
      });
      
      if (adminExists) {
        const response: AdminUserManagementResponse = {
          success: false,
          message: 'Admin user already exists'
        };
        return NextResponse.json(response, { status: 400 });
      }
      
      await initializeAdminUser();
      
      const response: AdminUserManagementResponse = {
        success: true,
        message: 'Initial admin user created'
      };
      return NextResponse.json(response);
    }
    
    // All other actions require admin authentication
    await requireAdmin();
    
    if (action === 'setAdmin') {
      if (!email) {
        const response: AdminUserManagementResponse = {
          success: false,
          message: 'Email is required'
        };
        return NextResponse.json(response, { status: 400 });
      }
      
      const success = await setUserAsAdmin(email);
      
      const response: AdminUserManagementResponse = {
        success,
        message: success ? `User ${email} is now an admin` : `Failed to set ${email} as admin`
      };
      
      return NextResponse.json(
        response, 
        success ? { status: 200 } : { status: 500 }
      );
    }
    
    const response: AdminUserManagementResponse = {
      success: false,
      message: `Unknown action: ${action}`
    };
    return NextResponse.json(response, { status: 400 });
  } catch (error) {
    console.error('Error managing admin users:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      const response: AdminUserManagementResponse = {
        success: false,
        message: 'Unauthorized: Admin access required'
      };
      return NextResponse.json(response, { status: 403 });
    }
    
    const response: AdminUserManagementResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(response, { status: 500 });
  }
}