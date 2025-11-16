'use client';
import { useLanguage } from "../context/LangaugeContext";
import styles from '@/app/ui/home.module.css';
import { getImagePath } from "../lib/utils/gameHelpers";
import { useMemoryGame } from "../hooks/useMemoryGame";

export default function GameBoard() {
  const { language } = useLanguage();
  const { gameState, handleCardClick } = useMemoryGame(language); 

  // Show results when game is complete
  if (gameState.isGameComplete) {
    return (
      <div className={styles.results}>
        <h2>🎉 Game Complete! 🎉</h2>
        <p>You matched all {gameState.matchedPairs} pairs!</p>
      </div>
    );
  }

  return (
    <section 
      className={styles.boardTable}
      style={{ backgroundImage: "url(/images/bg_city-memory_game.png)" }}
    >
      {gameState.cards.map((card, index) => (
        <div
          key={card.id}
          className={`${styles.card} ${card.flipped ? styles.flipped : ""}`}
          onClick={() => handleCardClick(index)} // Use the handler from hook
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
            >
              <p>{/* We'll fix this text display next */}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}