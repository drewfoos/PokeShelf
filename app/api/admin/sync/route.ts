// app/api/admin/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { pokemonTcgService } from '@/lib/services/pokemonTcgService';

// Define result interfaces to fix type issues
interface SetSyncResult {
  id: string;
  name?: string;
  count?: number;
  error?: unknown;
}

interface BatchSyncResult {
  success: boolean;
  sets: SetSyncResult[];
  [key: string]: unknown;
}

/**
 * Admin API for synchronizing data from the Pokemon TCG API.
 * This endpoint handles different synchronization actions.
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure the user is an admin.
    await requireAdmin();

    // Parse the request body.
    const body = await request.json();
    const { action, setId, type } = body;

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

      case 'syncSpecificSets':
        // Handle special set categories
        if (type === 'mcdonalds') {
          console.log("Syncing McDonald's promotional sets...");
          // Complete array of McDonald's promo set IDs (updated for all years)
          const mcdonaldsSets = ['mcd11', 'mcd12', 'mcd14', 'mcd15', 'mcd16', 'mcd17', 
                               'mcd18', 'mcd19', 'mcd21', 'mcd22', 'mcd23'];
          
          // Create properly typed result object
          const mcResult: BatchSyncResult = { 
            success: true, 
            sets: [] 
          };
          
          // First ensure all sets exist in the database
          await pokemonTcgService.syncSets();
          
          // Then sync each McDonald's set one by one
          for (const mcSetId of mcdonaldsSets) {
            console.log(`Syncing McDonald's set: ${mcSetId}`);
            const setResult = await pokemonTcgService.syncSetCards(mcSetId);
            if (setResult.success) {
              mcResult.sets.push({
                id: mcSetId,
                count: setResult.count
              });
            } else {
              mcResult.sets.push({
                id: mcSetId,
                error: setResult.error
              });
            }
            
            // Add a delay between set syncs to avoid API rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          result = mcResult;
        } else if (type === 'recent') {
          console.log("Syncing recent sets...");
          // Updated to include the most recent sets from 2024-2025
          const recentSets = ['pevo', 'ssp', 'scr', 'sfa', 'tmq', 'tfo', 'sv3pt5', 'sv4', 'sv4a', 'sv3'];
          
          // Create properly typed result object
          const recentResult: BatchSyncResult = { 
            success: true, 
            sets: [] 
          };
          
          // First ensure all sets exist in the database
          await pokemonTcgService.syncSets();
          
          // Then sync each recent set one by one
          for (const setId of recentSets) {
            console.log(`Syncing recent set: ${setId}`);
            try {
              const setResult = await pokemonTcgService.syncSetCards(setId);
              if (setResult.success) {
                recentResult.sets.push({
                  id: setId,
                  count: setResult.count
                });
              } else {
                recentResult.sets.push({
                  id: setId,
                  error: setResult.error
                });
              }
            } catch (error) {
              console.error(`Error syncing set ${setId}:`, error);
              recentResult.sets.push({
                id: setId,
                error: error instanceof Error ? error.message : "Unknown error"
              });
            }
            
            // Add a delay between set syncs to avoid API rate limits
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          result = recentResult;
        } else if (type === 'popular') {
          console.log("Syncing popular vintage sets...");
          // Popular vintage sets that collectors often want
          const popularSets = ['base1', 'base2', 'basep', 'gym1', 'gym2', 'neo1', 'neo2', 'neo3', 'neo4'];
          
          // Create properly typed result object
          const popularResult: BatchSyncResult = { 
            success: true, 
            sets: [] 
          };
          
          // First ensure all sets exist in the database
          await pokemonTcgService.syncSets();
          
          // Then sync each popular set one by one
          for (const setId of popularSets) {
            console.log(`Syncing popular set: ${setId}`);
            try {
              const setResult = await pokemonTcgService.syncSetCards(setId);
              if (setResult.success) {
                popularResult.sets.push({
                  id: setId,
                  count: setResult.count
                });
              } else {
                popularResult.sets.push({
                  id: setId,
                  error: setResult.error
                });
              }
            } catch (error) {
              console.error(`Error syncing set ${setId}:`, error);
              popularResult.sets.push({
                id: setId,
                error: error instanceof Error ? error.message : "Unknown error"
              });
            }
            
            // Add a delay between set syncs to avoid API rate limits
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          result = popularResult;
        } else {
          return NextResponse.json(
            { error: `Unknown set type: ${type}` },
            { status: 400 }
          );
        }
        break;

      case 'updatePrices':
        console.log('Updating card prices...');
        result = await pokemonTcgService.updateCardPrices();
        break;
        
      case 'checkNewSets':
        console.log('Checking for new sets...');
        result = await pokemonTcgService.syncNewSets();
        break;

      case 'syncBatch':
        if (!body.setIds || !Array.isArray(body.setIds) || body.setIds.length === 0) {
          return NextResponse.json(
            { error: 'setIds array is required for syncBatch action' },
            { status: 400 }
          );
        }
        console.log(`Syncing batch of ${body.setIds.length} sets...`);
        result = await pokemonTcgService.syncBatchSets(body.setIds);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const executionTimeMs = Date.now() - startTime;

    // Return a success response with the result
    return NextResponse.json({
      success: true,
      message: `Sync operation '${action}' executed successfully.`,
      executionTimeMs,
      result
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