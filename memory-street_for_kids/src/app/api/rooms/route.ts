// app/api/rooms/route.ts - MAKE SURE THIS IS CORRECT
import { NextResponse } from 'next/server';
import { createRoom, getRooms } from '@/lib/dbConnect';
import { GamePlayer, GameRoom } from '@/types';

// This should NOT have params - it's for /api/rooms (no ID)
export async function GET(request: Request) {
  try {
    console.log('🔍 GET /api/rooms called');
    const userId = request.headers.get('x-user-id');
    console.log('🔍 Current user ID from headers:', userId);
    
    const rooms = await getRooms();
    console.log('🔍 Rooms fetched from DB:', rooms.length);
    
    console.log('🔍 ALL rooms from DB:');
    rooms.forEach(room => {
      console.log(`   - Room: ${room.name}, Status: ${room.status}, Players: ${room.players.length}/${room.maxPlayers}, ID: ${room.id}`);
    });

    const availableRooms = rooms.filter(room => {
      const isAvailable = room.status === 'waiting' && room.players.length < room.maxPlayers;
      
      // Check if the current user is already in this room
      const userIsInRoom = userId ? 
        room.players.some(player => player.userId === userId) : 
        false;
      
      console.log(`   - ${room.name}: available=${isAvailable}, userInRoom=${userIsInRoom}, show=${isAvailable || userIsInRoom}`);
      
      // Show room if: available OR user is already in it
      return isAvailable || userIsInRoom;
    });
    
    console.log('🔍 Available rooms:', availableRooms.length);
    
    return NextResponse.json({ 
      success: true,
      rooms: availableRooms,
      total: availableRooms.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch rooms',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔍 POST /api/rooms called');
    
    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    const { name, maxPlayers, language, isPrivate, userId, username } = body;

    // Validate input
    if (!name || !maxPlayers || !language || !userId || !username) {
      console.log('❌ Missing required fields');
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
      players: [hostPlayer],
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

    console.log('🔍 Creating room:', newRoom);
    const result = await createRoom(newRoom);
    console.log('✅ Room created:', result);
    
    return NextResponse.json({ 
      success: true, 
      room: result
    });
    
  } catch (error) {
    console.error('❌ Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}