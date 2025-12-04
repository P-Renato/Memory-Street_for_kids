

// components/MultiplayerGameBoard.tsx
'use client';
import { useLanguage } from "../context/LangaugeContext";
import styles from '@/app/ui/home.module.css';
import { getImagePath } from "../lib/utils/gameHelpers";
import { useMultiplayerGame } from "../hooks/useMultiplayerGame";
import { GameRoom } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface MultiplayerGameBoardProps {
  room: GameRoom;
}

export default function MultiplayerGameBoard({ room }: MultiplayerGameBoardProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { gameState, handleCardClick, isMyTurn } = useMultiplayerGame(room, user?.id || '');

  // Get current player info
  const currentPlayer = room.players.find(p => p.userId === user?.id);

  // Show results when game is complete
  if (gameState.isGameComplete || room.gameState.isGameComplete) {
    return (
      <div className={styles.results}>
        <h2>🎉 Game Complete! 🎉</h2>
        <p>Matched all {gameState.matchedPairs} pairs!</p>
        <div className={styles.scoreboard}>
          <h3>Final Scores:</h3>
          {room.players.map(player => (
            <div key={player.userId} className={styles.playerScore}>
              {player.username}: {player.score} points
              {player.userId === user?.id && ' (You)'}
            </div>
          ))}
        </div>
      </div>
    );
  }

  console.log('🎮 Game State Debug:', {
    roomTurn: room.gameState.currentTurn,
    myId: user?.id,
    isMyTurn: isMyTurn,
    localGameState: gameState,
    roomGameState: room.gameState
    });

  return (
    <div className={styles.multiplayerGame}>
      {/* Game Info Bar */}
      <div className={styles.gameInfo}>
        <div className={styles.currentTurn}>
          {isMyTurn ? '🎮 Your Turn!' : `Waiting for ${room.players.find(p => p.userId === room.gameState.currentTurn)?.username}...`}
        </div>
        <div className={styles.scores}>
          {room.players.map(player => (
            <div key={player.userId} className={`${styles.playerScore} ${player.userId === user?.id ? styles.myScore : ''}`}>
              {player.username}: {player.score}
            </div>
          ))}
        </div>
      </div>

      {/* Actual Game Board */}
      <section 
        className={styles.boardTable}
        style={{ backgroundImage: "url(/images/bg_city-memory_game.png)" }}
      >
        {gameState.cards.map((card, index) => (
          <div
            key={card.id}
            className={`${styles.card} ${card.flipped ? styles.flipped : ""} ${!isMyTurn ? styles.disabled : ''}`}
            onClick={() => isMyTurn && handleCardClick(index)}
          >
            <div className={styles.cardInner}>
              <div className={styles.cardFront} />
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
        ))}
      </section>
    </div>
  );
}