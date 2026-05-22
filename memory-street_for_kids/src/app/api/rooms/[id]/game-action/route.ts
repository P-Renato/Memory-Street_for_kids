// app/api/rooms/[id]/game-action/route.ts - FIXED & COMPLETE
import { NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/dbConnect';
import { GameState, Card } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, action, cardIndex, cardId } = await request.json();
    
    console.log('🎮 Game action:', { action, userId, cardIndex, roomId: id });
    
    const room = await getRoomById(id);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // For FLIP_CARD, check if game is playing
    if (action === 'FLIP_CARD' && room.status !== 'playing') {
      return NextResponse.json({ error: 'Game not playing' }, { status: 400 });
    }

    // For END_TURN, check if game is playing
    if (action === 'END_TURN' && room.status !== 'playing') {
      return NextResponse.json({ error: 'Game not playing' }, { status: 400 });
    }

    // Verify user is in the room
    const player = room.players.find(p => p.userId === userId);
    if (!player) {
      return NextResponse.json({ error: 'Player not in room' }, { status: 400 });
    }

    // Process game action
    let updatedGameState: GameState = { 
      ...room.gameState,
      lastMove: { 
        userId, 
        cardIndex, 
        cardId: cardId || -1,
        timestamp: Date.now() 
      }
    };
    
    // Handle different actions
    switch (action) {
      case 'FLIP_CARD':
        
        // Verify it's current player's turn
        if (room.gameState.currentTurn !== userId) {
          return NextResponse.json({ 
            error: 'Not your turn',
            currentTurn: room.gameState.currentTurn,
            yourId: userId
          }, { status: 400 });
        }

        // Check if card exists
        if (cardIndex >= room.gameState.cards.length) {
          return NextResponse.json({ error: 'Invalid card index' }, { status: 400 });
        }

        const card = room.gameState.cards[cardIndex];
        
        // Check if card can be flipped
        if (card.flipped || card.matched) {
          return NextResponse.json({ error: 'Card already flipped or matched' }, { status: 400 });
        }

        // Initialize flippedCards array if it doesn't exist
        const currentFlippedCards = room.gameState.flippedCards || [];
        
        // Add to flipped cards array
        const newFlippedCards = [...currentFlippedCards, cardIndex];
        
        // Update the specific card to be flipped
        const updatedCards = [...room.gameState.cards];
        updatedCards[cardIndex] = { 
          ...updatedCards[cardIndex], 
          flipped: true 
        };
        
        updatedGameState = {
          ...updatedGameState,
          cards: updatedCards,
          flippedCards: newFlippedCards.length > 2 ? [cardIndex] : newFlippedCards
        };

        console.log('🃏 FLIP_CARD received:', {
          userId,
          cardIndex,
          currentTurn: room.gameState.currentTurn,
          flippedCards: room.gameState.flippedCards || [],
          isMatchCheck: newFlippedCards.length === 2
        });                                           
        
        // Check for matches if two cards are flipped
        if (newFlippedCards.length === 2) {
          const [firstIdx, secondIdx] = newFlippedCards;
          const firstCard = updatedCards[firstIdx];
          const secondCard = updatedCards[secondIdx];

          console.log('🔍 Checking match:', {
            firstCard: firstCard.city,
            secondCard: secondCard.city,
            isMatch: firstCard.city === secondCard.city
          });
          
          if (firstCard.city === secondCard.city) {
            // MATCH FOUND!
            console.log('🎯 Match found!');
            
            // Mark cards as matched
            updatedCards[firstIdx] = { ...firstCard, matched: true };
            updatedCards[secondIdx] = { ...secondCard, matched: true };
            
            // Update player score
            const updatedPlayers = room.players.map(p => 
              p.userId === userId 
                ? { ...p, score: (p.score || 0) + 100, matchedPairs: (p.matchedPairs || 0) + 1 }
                : p
            );
            
            updatedGameState = {
              ...updatedGameState,
              cards: updatedCards,
              flippedCards: [], // Clear flipped cards
              matchedPairs: (room.gameState.matchedPairs || 0) + 1
            };
            
            // Update room with matched cards and player score
            const updatedRoom = {
              ...room,
              players: updatedPlayers,
              gameState: updatedGameState
            };
            
            await updateRoom(id, updatedRoom);
            
            return NextResponse.json({ 
              success: true, 
              message: 'Cards matched!',
              matched: true,
              room: updatedRoom
            });
          }
        }
        break;
        
      case 'END_TURN':
        // Verify it's current player's turn
        if (room.gameState.currentTurn !== userId) {
          return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
        }

        // Switch to next player
        const currentPlayerIndex = room.players.findIndex(p => p.userId === userId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
        const nextPlayer = room.players[nextPlayerIndex];
        
        // Reset any flipped cards that weren't matched
        const resetCards = room.gameState.cards.map(card => 
          card.flipped && !card.matched ? { ...card, flipped: false } : card
        );
        
        updatedGameState = {
          ...room.gameState,
          cards: resetCards,
          currentTurn: nextPlayer.userId,
          flippedCards: [] // Clear flipped cards on turn end
        };
        break;
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Update room in database (for non-match cases)
    const updatedRoom = {
      ...room,
      gameState: updatedGameState
    };

    await updateRoom(id, updatedRoom);

    return NextResponse.json({ 
      success: true, 
      room: updatedRoom 
    });

  } catch (error) {
    console.error('❌ Error processing game action:', error);
    return NextResponse.json({ 
      error: 'Failed to process game action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}