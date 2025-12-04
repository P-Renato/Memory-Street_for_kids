

// app/api/rooms/[id]/game/route.ts
import { NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/dbConnect';
import { GameState } from '@/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { gameState: gameStateUpdates } = await request.json();
    
    console.log('🎮 GAME STATE UPDATE: Room', id);
    console.log('🔍 Game state updates:', gameStateUpdates);

    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Merge existing game state with updates
    const updatedGameState: GameState = {
      ...room.gameState,
      ...gameStateUpdates
    };

    console.log('🔍 Updated game state:', {
      cardsCount: updatedGameState.cards?.length,
      currentTurn: updatedGameState.currentTurn,
      matchedPairs: updatedGameState.matchedPairs,
      isGameComplete: updatedGameState.isGameComplete
    });

    // Update room with new game state
    await updateRoom(id, { gameState: updatedGameState });

    console.log('✅ Game state updated successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Game state updated',
      gameState: updatedGameState
    });

  } catch (error) {
    console.error('❌ Error updating game state:', error);
    return NextResponse.json({ error: 'Failed to update game state' }, { status: 500 });
  }
}