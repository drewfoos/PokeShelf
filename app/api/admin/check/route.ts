// app/api/admin/check/route.ts
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { AdminCheckResponse } from '@/types';

export async function GET() {
  try {
    const userIsAdmin = await isAdmin();
    
    const response: AdminCheckResponse = {
      isAdmin: userIsAdmin
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking admin status:', error);
    
    const errorResponse: AdminCheckResponse = {
      isAdmin: false
    };
    
    return NextResponse.json(
      { ...errorResponse, error: 'Failed to check admin status' },
      { status: 500 }
    );
  }
}