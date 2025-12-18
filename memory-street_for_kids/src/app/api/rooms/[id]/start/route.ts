// app/api/rooms/[id]/start/route.ts - FIXED
import { NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/dbConnect';
import { initializeCards } from '@/lib/utils/cardLogic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await request.json();
    
    console.log('🎮 Starting game for room:', id, 'by user:', userId);
    
    const room = await getRoomById(id);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Verify user is host
    const isHost = room.players.some(p => p.isHost && p.userId === userId);
    if (!isHost) {
      return NextResponse.json({ error: 'Only host can start the game' }, { status: 403 });
    }

    // Check minimum players
    if (room.players.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 players to start' }, { status: 400 });
    }

    // FIXED: initializeCards only takes language parameter
    const gameCards = initializeCards(room.settings.language);
    // Note: If you want to respect cardCount, you'll need to update initializeCards
    
    // Determine starting player (host starts)
    const startingPlayer = room.players.find(p => p.isHost) || room.players[0];

    // Update room status
    const updatedRoom = {
      ...room,
      status: 'playing' as const,
      gameState: {
        cards: gameCards,
        currentTurn: startingPlayer.userId,
        matchedPairs: 0,
        isGameComplete: false,
        flippedCards: [], // Now this property exists in GameState
        lastMove: null    // Now this property exists in GameState
      },
      players: room.players.map(player => ({
        ...player,
        isReady: true // Mark all players as ready when game starts
      }))
    };

    await updateRoom(id, updatedRoom);

    console.log('✅ Game started successfully for room:', id);
    
    return NextResponse.json({ 
      success: true, 
      room: updatedRoom 
    });

  } catch (error) {
    console.error('❌ Error starting game:', error);
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
  }
}