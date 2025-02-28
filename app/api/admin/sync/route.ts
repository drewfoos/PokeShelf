import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

/**
 * Stub Admin API for synchronizing data from the Pokemon TCG API.
 * Currently, this endpoint does nothing (a no-op) but requires admin privileges.
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure the user is an admin.
    await requireAdmin();

    // Parse the request body.
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Log the requested action; no actual syncing is performed.
    console.log(`[ADMIN] Received sync action: ${action}. No sync operation performed.`);

    // Return a success response indicating that the operation was a no-op.
    return NextResponse.json({
      success: true,
      message: `Sync operation '${action}' executed as a no-op.`,
      executionTimeMs: 0,
    });
  } catch (error) {
    console.error('[ADMIN ERROR] Error in admin sync API:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
