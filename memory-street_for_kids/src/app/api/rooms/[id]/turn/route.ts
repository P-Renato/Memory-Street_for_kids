

// app/api/rooms/[id]/turn/route.ts
import { NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/dbConnect';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nextPlayerId, currentPlayerId } = await request.json();
    
    console.log(`🔄 TURN CHANGE REQUEST: Room ${id}`);
    console.log(`🔍 From: ${currentPlayerId} → To: ${nextPlayerId}`);

    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Verify the current player exists in the room
    const currentPlayer = room.players.find(p => p.userId === currentPlayerId);
    if (!currentPlayer) {
      return NextResponse.json({ error: 'Current player not found in room' }, { status: 400 });
    }

    // Verify the next player exists in the room
    const nextPlayer = room.players.find(p => p.userId === nextPlayerId);
    if (!nextPlayer) {
      return NextResponse.json({ error: 'Next player not found in room' }, { status: 400 });
    }

    // Update room with new turn
    const updateData = {
      gameState: {
        ...room.gameState,
        currentTurn: nextPlayerId
      }
    };

    await updateRoom(id, updateData);

    console.log(`✅ Turn changed to: ${nextPlayer.username} (${nextPlayerId})`);

    return NextResponse.json({ 
      success: true,
      message: 'Turn changed successfully',
      nextPlayer: {
        id: nextPlayerId,
        username: nextPlayer.username
      },
      previousPlayer: {
        id: currentPlayerId,
        username: currentPlayer.username
      }
    });

  } catch (error) {
    console.error('❌ Error changing turn:', error);
    return NextResponse.json({ error: 'Failed to change turn' }, { status: 500 });
  }
}