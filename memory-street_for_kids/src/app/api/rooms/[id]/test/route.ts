// app/api/rooms/[id]/test/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Add Promise
) {
  const { id } = await params; // Await params
  console.log('✅ TEST DYNAMIC ROUTE - Room ID:', id);
  return NextResponse.json({ 
    message: 'Dynamic route test successful!',
    roomId: id, // Use the awaited id
    timestamp: new Date().toISOString()
  });
}