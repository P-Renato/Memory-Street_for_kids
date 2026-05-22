// components/GameBoard.tsx - FIXED (works with your existing hook)
'use client';
import { useLanguage } from "../context/LangaugeContext";
import styles from '@/app/ui/home.module.css';
import { getImagePath } from "../lib/utils/gameHelpers";
import { useMemoryGame } from "../hooks/useMemoryGame";
import { useAuth } from "@/context/AuthContext";
import { GameRoom } from "@/types";
import { useEffect, useState, useCallback, useRef } from "react";

interface GameBoardProps {
  room?: GameRoom;
  isMultiplayer?: boolean;
}

export default function GameBoard({ room, isMultiplayer = false }: GameBoardProps) {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const { 
    gameState, 
    handleCardClick,
    syncCardsFromServer,
    resetTurn  // Make sure this exists in your hook
  } = useMemoryGame(language);
  const [localUser, setLocalUser] = useState(user);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef<boolean>(false);
  const pendingEndTurnRef = useRef<boolean>(false);
  
  // Helper to get flipped cards
  const getFlippedCards = useCallback(() => {
    const flipped: number[] = [];
    if (gameState.firstCard !== null) flipped.push(gameState.firstCard);
    if (gameState.secondCard !== null) flipped.push(gameState.secondCard);
    return flipped;
  }, [gameState.firstCard, gameState.secondCard]);

  // Sync user when auth loading completes
  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
  }, [user]);

  // Multiplayer sync logic
  useEffect(() => {
    if (isMultiplayer && room && localUser && syncCardsFromServer) {
      // If game is playing, sync cards from server
      if (room.status === 'playing' && room.gameState) {
        // Sync cards from server to local state
        if (room.gameState.cards && room.gameState.cards.length > 0) {
          console.log('🔄 Syncing cards from server');
          syncCardsFromServer(room.gameState.cards);
          
          // Reset local turn state if server says cards aren't flipped
          const flippedCount = room.gameState.flippedCards?.length || 0;
          if (flippedCount === 0 && (gameState.firstCard !== null || gameState.secondCard !== null)) {
            console.log('🔄 Resetting local turn state to match server');
            resetTurn();
          }
        }
      }
    }
  }, [isMultiplayer, room, localUser, syncCardsFromServer, resetTurn, gameState.firstCard, gameState.secondCard]);

  // Handle when two cards are flipped (for ending turn)
  useEffect(() => {
    if (!isMultiplayer || !room || !localUser || !token || pendingEndTurnRef.current) return;
    
    const flippedCards = getFlippedCards();
    
    // Check if we have exactly 2 cards flipped
    if (flippedCards.length === 2) {
      const [firstIdx, secondIdx] = flippedCards;
      const firstCard = gameState.cards[firstIdx];
      const secondCard = gameState.cards[secondIdx];
      
      // If cards don't match, schedule END_TURN
      if (firstCard && secondCard && firstCard.city !== secondCard.city) {
        console.log('❌ No match, scheduling END_TURN');
        pendingEndTurnRef.current = true;
        
        const timer = setTimeout(async () => {
          try {
            console.log('⏳ Sending END_TURN to server...');
            
            const response = await fetch(`/api/rooms/${room.id}/game-action`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                userId: localUser.id,
                action: 'END_TURN'
              })
            });
            
            const result = await response.json();
            
            if (result.success) {
              console.log('✅ Turn ended successfully');
              // Server will update room state via polling
            } else {
              console.error('❌ Failed to end turn:', result.error);
            }
          } catch (error) {
            console.error('❌ Error sending END_TURN:', error);
          } finally {
            pendingEndTurnRef.current = false;
          }
        }, 1500); // Wait 1.5 seconds before ending turn
        
        return () => {
          clearTimeout(timer);
          pendingEndTurnRef.current = false;
        };
      } else if (firstCard && secondCard && firstCard.city === secondCard.city) {
        console.log('✅ Match found! Turn continues');
        // Match found - server handles scoring, turn continues
      }
    } else {
      // Reset flag if we don't have 2 cards flipped
      pendingEndTurnRef.current = false;
    }
  }, [gameState.firstCard, gameState.secondCard, gameState.cards, isMultiplayer, room, localUser, token, getFlippedCards]);

  const handleMultiplayerCardClick = useCallback(async (index: number) => {
    if (!isMultiplayer || !room || !localUser || !token) {
      // Single player mode
      handleCardClick(index);
      return;
    }
    // Prevent re-entrancy: use a ref for immediate synchronous lock
    if (isProcessingRef.current) {
      console.log('⏳ Still processing previous click');
      return;
    }

    // Multiplayer checks
    if (room.status !== 'playing') {
      console.log("⏳ Game hasn't started yet!");
      return;
    }

    if (room.gameState?.currentTurn !== localUser.id) {
      console.log("⏳ Not your turn! Current turn:", room.gameState?.currentTurn);
      return;
    }

    if (isProcessing) {
      console.log("⏳ Already processing a card click");
      return;
    }

    // Immediately set ref lock to prevent rapid double-clicks
    isProcessingRef.current = true;
    setIsProcessing(true);

    console.log(`🎮 Player ${localUser.username} flipped card ${index}`);

    // 1. First, flip locally for immediate feedback, but DO NOT resolve match locally — server will be source-of-truth
    handleCardClick(index, { resolve: false });
    
    // 2. Send to server
    try {
      const response = await fetch(`/api/rooms/${room.id}/game-action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: localUser.id,
          action: 'FLIP_CARD',
          cardIndex: index,
          cardId: gameState.cards[index]?.id
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Card flip saved to server');
        // The server will update the room state, and polling will sync it
      } else {
        console.error('❌ Server error:', result.error);
        // If server says "Not your turn", it means turn already changed
        if (result.error === 'Not your turn') {
          console.log('🔄 Turn already changed, syncing with server...');
          // Force sync with server state
          if (room.gameState?.cards) {
            syncCardsFromServer(room.gameState.cards);
            resetTurn();
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to send card flip:', error);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [isMultiplayer, room, localUser, token, handleCardClick, gameState.cards, syncCardsFromServer, resetTurn, isProcessing]);

  // Show loading while auth is loading
  if (!localUser) {
    return (
      <div className={styles.loading}>
        <p>Loading user...</p>
      </div>
    );
  }

  // Check if it's current user's turn
  const isMyTurn = room?.gameState?.currentTurn === localUser.id;
  const flippedCards = getFlippedCards();

  return (
    <div className={styles.gameContainer}>

      {/* Multiplayer Status Bar */}
      {isMultiplayer && room && localUser && (
        <div className={styles.multiplayerStatus}>
          <div className={styles.roomInfo}>
            <span className={styles.roomName}>{room.name}</span>
            <span className={`${styles.statusBadge} ${styles[room.status]}`}>
              {room.status.toUpperCase()}
            </span>
          </div>
          
          <div className={styles.playersInfo}>
            <span>Players: {room.players.length}/{room.maxPlayers}</span>
            {room.status === 'playing' && (
              <span className={`${styles.turnInfo} ${isMyTurn ? styles.myTurn : ''}`}>
                {isMyTurn 
                  ? "🎮 YOUR TURN!" 
                  : `${room.players.find(p => p.userId === room.gameState?.currentTurn)?.username || 'Someone'}'s turn`}
              </span>
            )}
          </div>
          
          <div className={styles.scores}>
            {room.players.map(player => (
              <div 
                key={player.userId} 
                className={`${styles.playerScore} ${player.userId === localUser.id ? styles.currentPlayer : ''} ${room.gameState?.currentTurn === player.userId ? styles.activeTurn : ''}`}
              >
                <span>{player.username}{player.userId === localUser.id ? ' (You)' : ''}:</span>
                <strong>{player.score}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game board */}
      <section 
        className={styles.boardTable}
        style={{ backgroundImage: "url(/images/bg_city-memory_game.png)" }}
      >
        {gameState.cards.map((card, index) => {
          // In multiplayer, only allow clicks if it's your turn and game is playing
          const canClick = !isMultiplayer || 
            (room?.status === 'playing' && isMyTurn && !card.flipped && !card.matched && !isProcessingRef.current);
          
          return (
            <div
              key={card.id}
              className={`${styles.card} ${card.flipped ? styles.flipped : ""} ${card.matched ? styles.matched : ""} ${!canClick ? styles.disabled : ''}`}
              onClick={() => canClick && (isMultiplayer ? handleMultiplayerCardClick(index) : handleCardClick(index))}
              title={!canClick && isMultiplayer ? "Wait for your turn" : "Click to flip"}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>
                  {!canClick && !card.flipped && !card.matched && isMultiplayer && (
                    <div className={styles.waitingOverlay}>⏳</div>
                  )}
                </div>
                <div
                  className={styles.cardBack}
                  style={{
                    backgroundImage: `url(${getImagePath(card.city)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}