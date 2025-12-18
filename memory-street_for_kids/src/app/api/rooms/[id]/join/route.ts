// app/api/rooms/[id]/join/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/dbConnect';
import { GamePlayer } from '@/types';
import { authenticateRequest } from '@/lib/authMiddleware';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🎯 JOIN ROUTE CALLED! Room ID:', id);
    
    // Authenticate the request
    const auth = authenticateRequest(request as NextRequest); 
    
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Now auth.userId is guaranteed to be string (if success is true)
    const userId = auth.userId as string;
    
    const { username } = await request.json();
    
    console.log('🎯 Join request data:', { 
      roomId: id, 
      userId, 
      username: username || auth.email?.split('@')[0] 
    });

    // Use provided username or default from email
    const displayUsername = username || auth.email?.split('@')[0] || 'Player';

    const room = await getRoomById(id);
    console.log('🔍 Found room:', room ? room.id : 'null');
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 });
    }

    // Check if game has already started
    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Game has already started' }, { status: 400 });
    }

    // Check if user is already in the room
    if (room.players.some(player => player.userId === userId)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already in room',
        player: room.players.find(p => p.userId === userId)
      });
    }

    // Create new player
    const newPlayer: GamePlayer = {
      userId: userId!, 
      username: displayUsername,
      score: 0,
      isReady: false,
      isHost: false
    };

    // Update room with new player
    const updatedPlayers = [...room.players, newPlayer];
    await updateRoom(id, { players: updatedPlayers });

    console.log('✅ Player joined room successfully');
    
    return NextResponse.json({ 
      success: true, 
      player: newPlayer,
      room: { ...room, players: updatedPlayers }
    });

  } catch (error) {
    console.error('❌ Error joining room:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}