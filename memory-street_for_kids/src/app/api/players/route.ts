
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/dbConnect';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const players = await db.collection('players').find().toArray();
    
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();

    const existingPlayer = await db.collection('players').findOne({ name });
    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Player already exists' },
        { status: 400 }
      );
    }
    
    const result = await db.collection('players').insertOne({
      name,
      email,
      totalGames: 0,
      totalWins: 0,
      totalScore: 0,
      createdAt: new Date()
    });
    
    return NextResponse.json({ 
      success: true, 
      playerId: result.insertedId 
    });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' }, 
      { status: 500 }
    );
  }
}