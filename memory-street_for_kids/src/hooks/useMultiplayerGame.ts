// hooks/useMultiplayerGame.ts - SIMPLIFIED WORKING VERSION
'use client';
import { useState, useEffect, useMemo } from "react";
import { Card, handleCardMatch } from "../lib/utils/cardLogic";
import { loadAudioCache } from "../lib/utils/audioHelpers";
import { AudioCache } from "@/lib/audioCache";
import { cityByLanguage } from "@/lib/db"; 
import { GameRoom } from "@/types";
import { notifyRoomUpdate } from '@/lib/socket/client';
import { useWebSocket } from "./useWebSocket";

type LanguageKey = keyof typeof cityByLanguage;

interface LocalGameState {
  firstCard: number | null;
  secondCard: number | null;
  lockBoard: boolean;
  audioCache: AudioCache | null;
  isProcessing: boolean;
}

interface GameStateUpdate {
  cards?: Card[];
  currentTurn?: string;
  matchedPairs?: number;
  isGameComplete?: boolean;
}

export function useMultiplayerGame(room: GameRoom, currentUserId: string) {
  const [localState, setLocalState] = useState<LocalGameState>({
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    audioCache: null,
    isProcessing: false
  });

  // Room's game state (from database)
  const gameState = room.gameState;

  // Web Socket connection
  const { emitEvent } = useWebSocket(room.id);

  // Load audio cache
  useEffect(() => {
    loadAudioCache().then(audioCache => {
      setLocalState(prev => ({ ...prev, audioCache }));
    });
  }, []);

  

  // SIMPLIFIED handleCardClick - back to basics
  const handleCardClick = useMemo(() => {
  return async (cardIndex: number) => {
    console.log('🎴 Card clicked:', cardIndex);

    // Basic checks
    if (localState.isProcessing || localState.lockBoard) {
      console.log('❌ Board locked');
      return;
    }
    
    if (gameState.currentTurn !== currentUserId) {
      console.log('❌ Not your turn');
      return;
    }

    const card = gameState.cards[cardIndex];
    if (card.flipped || card.matched) {
      console.log('❌ Card already flipped');
      return;
    }

    console.log('✅ Processing card');
    setLocalState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Play audio
      if (localState.audioCache) {
        const languageCache = localState.audioCache[room.settings.language as LanguageKey];
        if (languageCache?.[card.city]) {
          const audio = languageCache[card.city].cloneNode() as HTMLAudioElement;
          audio.currentTime = 0;
          audio.play().catch(error => console.warn('Audio play failed:', error));
        }
      }

      // DECLARE VARIABLES OUTSIDE IF/ELSE BLOCKS
      let newCards: Card[];
      const isFirstCard = localState.firstCard === null;

      if (isFirstCard) {
        // First card
        console.log('✅ First card flipped');
        setLocalState(prev => ({ ...prev, firstCard: cardIndex }));
        
        newCards = gameState.cards.map((c, i) => 
          i === cardIndex ? { ...c, flipped: true } : c
        );
        await updateRoomGameState(room.id, { cards: newCards });
        
        // WebSocket notification
        emitEvent('card_flip', {
          roomId: room.id,
          cardIndex: cardIndex,
          playerId: currentUserId
        });
        
     
      } else {
        // Second card  
        console.log('✅ Second card flipped');
        setLocalState(prev => ({ ...prev, secondCard: cardIndex, lockBoard: true }));
        
        newCards = gameState.cards.map((c, i) => 
          (i === localState.firstCard || i === cardIndex) ? { ...c, flipped: true } : c
        );
        await updateRoomGameState(room.id, { cards: newCards });

        // WebSocket notification for second card
        emitEvent('card_flip', {
          roomId: room.id,
          cardIndex: cardIndex,
          playerId: currentUserId
        });

        // Handle matching after delay - NOW WE CAN ACCESS newCards AND cardIndex
        setTimeout(async () => {
          console.log('🔍 DEBUG: Entering match timeout');
          
          const result = handleCardMatch(newCards, localState.firstCard!, cardIndex);
          console.log('🔍 DEBUG: Match result:', { 
            isMatch: result.matchedPairs > 0, 
            matchedPairs: result.matchedPairs 
          });
          
          await updateRoomGameState(room.id, {
            cards: result.updatedCards,
            matchedPairs: result.matchedPairs,
            isGameComplete: result.isGameComplete
          });

          console.log('🔍 DEBUG: Calling changeTurn...');
          await changeTurn(room, currentUserId);
          console.log('🔍 DEBUG: changeTurn completed');

          // WebSocket notification for turn change
          const nextPlayerId = getNextPlayerId(room, currentUserId);
          emitEvent('turn_changed', {
            roomId: room.id,
            nextPlayerId: nextPlayerId,
            previousPlayerId: currentUserId
          });

          // Reset for next turn
          setLocalState({ 
            firstCard: null, 
            secondCard: null, 
            lockBoard: false,
            isProcessing: false,
            audioCache: localState.audioCache
          });

        }, 1000);
      }

    } catch (error) {
      console.error('❌ Error:', error);
      setLocalState(prev => ({ ...prev, isProcessing: false }));
    }
  };
}, [localState, gameState, room, currentUserId, emitEvent]);

  return {
    gameState,
    handleCardClick,
    isMyTurn: gameState.currentTurn === currentUserId
  };
}

// Keep your existing helper functions...
async function updateRoomGameState(roomId: string, updates: GameStateUpdate) {
  const response = await fetch(`/api/rooms/${roomId}/game`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameState: updates }),
  });

  if (!response.ok) {
    throw new Error('Failed to update game state');
  }
  notifyRoomUpdate(roomId);
  return response.json();
}

async function changeTurn(room: GameRoom, currentPlayerId: string) {
  console.log('🔄 changeTurn called for room:', room.id);
  
  const currentIndex = room.players.findIndex(p => p.userId === currentPlayerId);
  const nextIndex = (currentIndex + 1) % room.players.length;
  const nextPlayerId = room.players[nextIndex]?.userId;

  console.log('🔄 Turn change details:', {
    currentPlayer: currentPlayerId,
    nextPlayer: nextPlayerId,
    currentIndex,
    nextIndex
  });

  const response = await fetch(`/api/rooms/${room.id}/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nextPlayerId: nextPlayerId,
      currentPlayerId: currentPlayerId
    }),
  });

  console.log('🔄 Turn change API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Turn change failed:', errorText);
    throw new Error('Failed to change turn');
  }

  const result = await response.json();
  console.log('✅ Turn change successful:', result);
  
  notifyRoomUpdate(room.id);
}

// Helper function to get next player ID
function getNextPlayerId(room: GameRoom, currentPlayerId: string): string {
  const currentIndex = room.players.findIndex(p => p.userId === currentPlayerId);
  const nextIndex = (currentIndex + 1) % room.players.length;
  return room.players[nextIndex]?.userId;
}