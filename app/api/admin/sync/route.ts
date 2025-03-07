// app/api/admin/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { pokemonTcgService } from '@/lib/services/pokemonTcgService';
import { AdminSyncRequest, SyncResponse, SetSyncResult } from '@/types';
import prisma from '@/lib/prisma';

/**
 * Admin API for synchronizing data from the Pokemon TCG API.
 * This endpoint handles different synchronization actions.
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure the user is an admin.
    await requireAdmin();

    // Parse the request body with proper typing
    const body: AdminSyncRequest = await request.json();
    const { action, setId, type, setIds } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    console.log(`[ADMIN] Received sync action: ${action}`);
    let result;
    const startTime = Date.now();

    // Execute the appropriate sync action
    switch (action) {
      case 'syncSets':
        console.log('Syncing all sets...');
        result = await pokemonTcgService.syncSets();
        break;

      case 'syncSetCards':
        if (!setId) {
          return NextResponse.json(
            { error: 'Set ID is required for syncSetCards action' },
            { status: 400 }
          );
        }
        console.log(`Syncing cards for set: ${setId}`);
        result = await pokemonTcgService.syncSetCards(setId);
        break;

      case 'syncSetsAndCards':
        console.log('Starting comprehensive sync of all sets and their cards...');
        result = await syncSetsAndCards();
        break;

      case 'updatePrices':
        console.log('Updating card prices...');
        result = await pokemonTcgService.updateCardPrices();
        break;
        
      case 'checkNewSets':
        console.log('Checking for new sets...');
        result = await pokemonTcgService.syncNewSets();
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const executionTimeMs = Date.now() - startTime;

    // Return a success response with the result
    const response: SyncResponse = {
      success: true,
      message: `Sync operation '${action}' executed successfully.`,
      executionTimeMs,
      result
    };
    
    return NextResponse.json(response);
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

/**
 * Implementation of comprehensive sync for all sets and their cards.
 * This is a separate function to keep the main switch case clean.
 */
async function syncSetsAndCards() {
  try {
    // First sync all sets to get the latest list
    console.log("Step 1: Syncing all sets metadata...");
    const setsResult = await pokemonTcgService.syncSets();
    
    if (!setsResult.success) {
      return {
        success: false,
        error: setsResult.error || "Failed to sync sets",
        phase: "sets",
        progress: 0
      };
    }
    
    // Get all sets from the database
    const sets = await prisma.set.findMany({
      select: { id: true, name: true },
      orderBy: { releaseDate: 'desc' }
    });
    
    console.log(`Step 2: Syncing cards for ${sets.length} sets...`);
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    let totalCards = 0;
    
    // Process each set (newest first)
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      const progress = Math.round((i / sets.length) * 100);
      
      console.log(`[${progress}%] Syncing cards for set ${i+1}/${sets.length}: ${set.name} (${set.id})`);
      
      try {
        const setResult = await pokemonTcgService.syncSetCards(set.id);
        
        if (setResult.success) {
          successCount++;
          totalCards += (setResult.count || 0);
          results.push({
            id: set.id,
            name: set.name,
            count: setResult.count,
            success: true
          });
        } else {
          failCount++;
          results.push({
            id: set.id,
            name: set.name,
            error: setResult.error,
            success: false
          });
        }
      } catch (error) {
        failCount++;
        results.push({
          id: set.id,
          name: set.name,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false
        });
      }
      
      // Add delay between sets to respect API rate limits (longer for larger sets)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    return {
      success: true,
      setCount: sets.length,
      successfulSets: successCount,
      failedSets: failCount,
      totalCards,
      phase: "complete",
      progress: 100,
      sets: results
    };
  } catch (error) {
    console.error("Error in comprehensive sync:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      phase: "unknown",
      progress: 0
    };
  }
}