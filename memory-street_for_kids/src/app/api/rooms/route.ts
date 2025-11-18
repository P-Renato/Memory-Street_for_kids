// app/api/rooms/route.ts - UPDATED
import { NextResponse } from 'next/server';
import { createRoom, getRooms } from '@/lib/dbConnect';
import { GameRoom } from '@/types';

export async function GET() {
  try {
    const rooms = await getRooms();
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, maxPlayers, language, isPrivate, userId, username } = await request.json();
    
    // Validate input
    if (!name || !maxPlayers || !language) {
      return NextResponse.json(
        { error: 'Name, maxPlayers, and language are required' },
        { status: 400 }
      );
    }

     const hostUser = userId ? { userId, username } : {
      userId: 'test-user-' + Date.now(),
      username: 'TestUser'
    };

    // Create room with proper structure
    const newRoom: GameRoom = {
      id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      host: hostUser.userId, // TODO: Get from authentication
      players: [{
        userId: hostUser.userId,
        username: hostUser.username,
        score: 0,
        isReady: true,
        isHost: true
      }],
      maxPlayers: Math.min(maxPlayers, 8), // Cap at 8 players
      status: 'waiting' as const,
      gameState: {
        cards: [],
        currentTurn: '',
        matchedPairs: 0,
        isGameComplete: false
      },
      settings: {
        language,
        cardCount: 12, // Default card count
        isPrivate: isPrivate || false
      },
      createdAt: new Date()
    };

    const result = await createRoom(newRoom);
    
    return NextResponse.json({ 
      success: true, 
      room: result,
      
    });
    
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}