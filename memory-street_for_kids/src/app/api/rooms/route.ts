// app/api/rooms/route.ts - Updated to handle token auth
import { NextResponse, NextRequest } from 'next/server';
import { getRooms, createRoom } from '@/lib/dbConnect';
import { authenticateRequest } from '@/lib/authMiddleware';
import { AuthContextType } from '@/context/AuthContext';

export async function GET(request: Request) {
  try {
    // Authenticate the request
    const auth = authenticateRequest(request as NextRequest);
    
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('🎯 GET rooms - Authenticated user:', auth.userId);
    
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
    // Authenticate the request
    const auth = authenticateRequest(request as NextRequest);
    
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { name, maxPlayers, language, isPrivate, userId, username } = await request.json();
    
    console.log('📝 Creating room - Authenticated user:', auth.userId, 'Request userId:', userId);
    
    // Validate that the authenticated user matches the request userId
    if (auth.userId !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }
    
    // Validate input
    if (!name || !maxPlayers || !language || !userId || !username) {
      return NextResponse.json(
        { error: 'Name, maxPlayers, language, userId, and username are required' },
        { status: 400 }
      );
    }

    // Create the first player (host)
    const hostPlayer = {
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
        isGameComplete: false,
        flippedCards: [],
        lastMove: null
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