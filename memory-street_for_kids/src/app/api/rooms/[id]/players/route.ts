


// app/api/rooms/[id]/players/route.ts
import { NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/dbConnect';
import { GamePlayer } from '@/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { players } = await request.json();
    
    console.log('👥 PLAYERS UPDATE: Room', id);
    console.log('🔍 Updated players:', players);

    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Update room with new players
    await updateRoom(id, { players });

    console.log('✅ Players updated successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Players updated',
      players: players
    });

  } catch (error) {
    console.error('❌ Error updating players:', error);
    return NextResponse.json({ error: 'Failed to update players' }, { status: 500 });
  }
}