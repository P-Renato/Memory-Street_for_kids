
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/dbConnect';

export async function POST(request: Request) {
  try {
    const { players, scores } = await request.json();

    if (!players || !scores || players.length !== scores.length) {
      return NextResponse.json(
        { error: 'Players and scores arrays are required and must be the same length' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Find the winner
    const maxScore = Math.max(...scores);
    const winnerIndex = scores.indexOf(maxScore);
    const winnerName = players[winnerIndex];
    
    // 1. Save the game session
    const gameResult = await db.collection('games').insertOne({
      players: players.map((name: string, index: number) => ({
        name,
        score: scores[index]
      })),
      winner: winnerName,
      maxScore,
      playedAt: new Date()
    });
    
    // 2. Update player statistics
    for (let i = 0; i < players.length; i++) {
      await db.collection('players').updateOne(
        { name: players[i] },
        { 
          $inc: { 
            totalGames: 1,
            totalWins: i === winnerIndex ? 1 : 0,
            totalScore: scores[i]
          } 
        },
        { upsert: true } // Create player if doesn't exist
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      winner: winnerName,
      gameId: gameResult.insertedId
    });
    
  } catch (error) {
    console.error('Error saving game:', error);
    return NextResponse.json(
      { error: 'Failed to save game' }, 
      { status: 500 }
    );
  }
}