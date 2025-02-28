import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';

export async function GET() {
  try {
    const userIsAdmin = await isAdmin();
    
    return NextResponse.json({
      isAdmin: userIsAdmin
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status', isAdmin: false },
      { status: 500 }
    );
  }
}