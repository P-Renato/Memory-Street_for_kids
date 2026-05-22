// hooks/useMemoryGame.ts - FIXED VERSION
'use client';
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, handleCardMatch } from "../lib/utils/cardLogic";
import { loadAudioCache } from "../lib/utils/audioHelpers";
import { initializeCards } from "../lib/utils/cardLogic";
import { AudioCache } from "@/lib/audioCache";
import { cityByLanguage } from "@/lib/db"; 

type LanguageKey = keyof typeof cityByLanguage;
export interface GameState {
  cards: Card[];
  flippedCards: number[];  // CHANGED: Use array like server
  lockBoard: boolean;
  audioCache: AudioCache | null;
  matchedPairs: number;
  isGameComplete: boolean;
}

export function useMemoryGame(language: string) {
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    flippedCards: [],  // CHANGED: Use array
    lockBoard: false,
    audioCache: null,
    matchedPairs: 0,
    isGameComplete: false
  });

  // Initialize cards when language changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const newCards = initializeCards(language);
      setGameState(prev => ({ ...prev, cards: newCards, flippedCards: [] }));
    }, 0);

    return () => clearTimeout(timer);
  }, [language]);

  // Load audio cache
  useEffect(() => {
    loadAudioCache().then(audioCache => {
      setGameState(prev => ({ ...prev, audioCache }));
    });
  }, []);

  // Keep a ref to latest audioCache so handlers don't need gameState in deps
  const audioCacheRef = useRef<AudioCache | null>(null);
  useEffect(() => {
    audioCacheRef.current = gameState.audioCache;
  }, [gameState.audioCache]);

  // Keep a ref to latest cards for quick reads (audio, etc.) without adding deps
  const cardsRef = useRef<Card[]>([]);
  useEffect(() => {
    cardsRef.current = gameState.cards;
  }, [gameState.cards]);

  // Reset turn helper
  const resetTurn = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      flippedCards: [],  // CHANGED: Clear array
      lockBoard: false
    }));
  }, []);

  // Sync cards from server (for multiplayer)
  const syncCardsFromServer = useCallback((serverCards: Card[]) => {
    setGameState(prev => {
      // Keep track of current flipped cards for animation
      const currentlyFlipped = new Set(prev.flippedCards);
      const serverFlipped = new Set(
        serverCards
          .map((card, index) => card.flipped ? index : -1)
          .filter(i => i !== -1)
      );
      
      // If server says cards should be unflipped but we have them flipped,
      // we need to handle the transition
      const cardsToUnflip = Array.from(currentlyFlipped).filter(
        index => !serverFlipped.has(index) && !serverCards[index]?.matched
      );
      
      // If there are cards to unflip, animate them first
      if (cardsToUnflip.length > 0) {
        setTimeout(() => {
          setGameState(current => ({
            ...current,
            cards: serverCards,
            flippedCards: Array.from(serverFlipped)
          }));
        }, 500); // Match the flip animation duration
      }
      
      return {
        ...prev,
        cards: serverCards,
        flippedCards: Array.from(serverFlipped),
        lockBoard: serverFlipped.size >= 2
      };
    });
  }, []);

  // Handle card click logic
  const handleCardClick = useCallback((cardIndex: number, options?: { resolve?: boolean }) => {
    const resolve = options?.resolve ?? true;
    // Play audio using latest refs (best-effort)
    const languageCache = audioCacheRef.current?.[language as LanguageKey];
    const city = cardsRef.current[cardIndex]?.city;
    if (languageCache && city && languageCache[city]) {
      try {
        const originalAudio = languageCache[city];
        const audio = originalAudio.cloneNode() as HTMLAudioElement;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch (e) {
        // ignore
      }
    }

    // Update state using functional updater to avoid stale closures
    setGameState(prev => {
      if (prev.lockBoard) return prev;
      const card = prev.cards[cardIndex];
      if (!card || card.flipped || card.matched) return prev;

      const newCards = prev.cards.map((c, i) => i === cardIndex ? { ...c, flipped: true } : c);
      const newFlipped = [...prev.flippedCards, cardIndex];

      const newState = {
        ...prev,
        cards: newCards,
        flippedCards: newFlipped,
        lockBoard: newFlipped.length >= 2
      };

      // If two cards flipped, evaluate match using central logic (only when resolve === true)
      if (resolve && newFlipped.length === 2) {
        const [firstIdx, secondIdx] = newFlipped;
        setTimeout(() => {
          setGameState(innerPrev => {
            const result = handleCardMatch(innerPrev.cards, firstIdx, secondIdx);
            return {
              ...innerPrev,
              cards: result.updatedCards,
              flippedCards: [],
              matchedPairs: result.matchedPairs,
              isGameComplete: result.isGameComplete,
              lockBoard: false
            };
          });
        }, 1000);
      }

      return newState;
    });
  }, [language, resetTurn]);

  // Get first and second card from flippedCards array (for compatibility)
  const firstCard = gameState.flippedCards[0] ?? null;
  const secondCard = gameState.flippedCards[1] ?? null;

  return {
    gameState: {
      ...gameState,
      firstCard,  // For compatibility with existing code
      secondCard  // For compatibility with existing code
    },
    handleCardClick,
    resetTurn,
    syncCardsFromServer,
    setGameState
  };
}
