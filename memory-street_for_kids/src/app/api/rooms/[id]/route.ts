// app/api/rooms/[id]/route.ts - FIXED
import { NextResponse } from 'next/server';
import { getRoomById } from '@/lib/dbConnect';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Make sure params is defined as Promise
) {
  try {
    console.log('🔍 GET /api/rooms/[id] called');
    
    // Check if params exists before destructuring
    if (!params) {
      console.error('❌ params is undefined');
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { id } = await params;
    console.log('🔍 Room ID:', id);

    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const room = await getRoomById(id);
    console.log('🔍 Found room:', room ? room.id : 'null');
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
    
  } catch (error) {
    console.error('❌ Error fetching room:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch room',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}