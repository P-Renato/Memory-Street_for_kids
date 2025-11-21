// app/api/rooms/route.ts
import { NextResponse } from 'next/server';
import { createRoom, getRooms } from '@/lib/dbConnect';
import { GamePlayer, GameRoom } from '@/types';

export async function GET() {
  try {
    const rooms = await getRooms();
    // Filter out full rooms or finished games if needed
    const availableRooms = rooms.filter(room => 
      room.status === 'waiting' && room.players.length < room.maxPlayers
    );
    return NextResponse.json({ rooms: availableRooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, maxPlayers, language, isPrivate, userId, username } = await request.json();
    
    // Validate input
    if (!name || !maxPlayers || !language || !userId || !username) {
      return NextResponse.json(
        { error: 'Name, maxPlayers, language, userId, and username are required' },
        { status: 400 }
      );
    }

    // Create the first player (host)
    const hostPlayer: GamePlayer = {
      userId: userId,
      username: username,
      score: 0,
      isReady: true,
      isHost: true
    };

    // Create room with host as first player
    const newRoom = {
      name,
      host: userId,
      players: [{
        userId: userId,
        username: username,
        score: 0,
        isReady: true,
        isHost: true
      }],
      maxPlayers: Math.min(maxPlayers, 4),
      status: 'waiting' as const,
      gameState: {
        cards: [],
        currentTurn: '',
        matchedPairs: 0,
        isGameComplete: false
      },
      settings: {
        language,
        cardCount: 12,
        isPrivate: isPrivate || false
      },
      createdAt: new Date()
    };

    const result = await createRoom(newRoom);
    
    return NextResponse.json({ 
      success: true, 
      room: result
    });
    
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}