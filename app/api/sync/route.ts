// app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { pokemonTcgService } from '@/lib/services/pokemonTcgService';

export async function GET() {
  try {
    // This is a simplified version - in production, you'd want authentication
    const result = await pokemonTcgService.syncSets();
    
    if (!result.success) {
      throw new Error('Failed to sync sets');
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.count} sets`,
    });
  } catch (error) {
    console.error('Error syncing data:', error);
    return NextResponse.json(
      { error: 'Failed to sync data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { setId } = body;
    
    if (!setId) {
      return NextResponse.json(
        { error: 'Set ID is required' },
        { status: 400 }
      );
    }
    
    const result = await pokemonTcgService.syncSetCards(setId);
    
    if (!result.success) {
      throw new Error(`Failed to sync cards from set ${setId}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.count} cards from set ${setId}`,
    });
  } catch (error) {
    console.error('Error syncing data:', error);
    return NextResponse.json(
      { error: 'Failed to sync data' },
      { status: 500 }
    );
  }
}