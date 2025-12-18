// app/api/rooms/[id]/game-action/route.ts - FIXED
import { NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/dbConnect';
import { GameState } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, action, cardIndex, cardId } = await request.json();
    
    console.log('🎮 Game action:', { action, userId, cardIndex, roomId: id });
    
    const room = await getRoomById(id);
    
    if (!room || room.status !== 'playing') {
      return NextResponse.json({ error: 'Game not found or not playing' }, { status: 404 });
    }

    // Verify it's current player's turn
    if (room.gameState.currentTurn !== userId) {
      return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
    }

    // Process game action
    let updatedGameState: GameState = { 
      ...room.gameState,
      lastMove: { 
        userId, 
        cardIndex, 
        cardId, // cardId should be number to match Card.id type
        timestamp: Date.now() 
      }
    };
    
    // Handle different actions
    switch (action) {
      case 'FLIP_CARD':
        // Initialize flippedCards array if it doesn't exist
        const currentFlippedCards = room.gameState.flippedCards || [];
        
        // Add to flipped cards array
        const newFlippedCards = [...currentFlippedCards, cardIndex];
        updatedGameState = {
          ...updatedGameState,
          flippedCards: newFlippedCards.length > 2 ? [cardIndex] : newFlippedCards
        };
        
        // TODO: Check for matches if two cards are flipped
        // This will require more complex logic
        break;
        
      case 'END_TURN':
        // Switch to next player
        const currentPlayerIndex = room.players.findIndex(p => p.userId === userId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
        const nextPlayer = room.players[nextPlayerIndex];
        
        updatedGameState = {
          ...updatedGameState,
          currentTurn: nextPlayer.userId,
          flippedCards: [] // Clear flipped cards on turn end
        };
        break;
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Update room in database
    const updatedRoom = {
      ...room,
      gameState: updatedGameState
    };

    await updateRoom(id, updatedRoom);

    return NextResponse.json({ 
      success: true, 
      room: updatedRoom 
    });

  } catch (error) {
    console.error('❌ Error processing game action:', error);
    return NextResponse.json({ error: 'Failed to process game action' }, { status: 500 });
  }
}