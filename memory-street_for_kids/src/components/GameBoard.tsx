
"use client";
import { useState, useEffect } from "react";
import { cityByLanguage } from "../lib/db";
import { audioCache } from "../lib/audioCache";
import { useLanguage } from "../context/LangaugeContext";

// import Results from "./Results";

interface Card {
  id: number;
  city: string;
  flipped: boolean;
  matched: boolean;
}



type CityKey = keyof typeof cityByLanguage["en"]["items"];


export default function GameBoard() {
  const { language } = useLanguage();
  const [cards, setCards] = useState<Card[]>([]);
  const [firstCard, setFirstCard] = useState<number | null>(null);
  const [secondCard, setSecondCard] = useState<number | null>(null);
  const [lockBoard, setLockBoard] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cities = Object.keys(cityByLanguage[language].items);
      const duplicated = [...cities, ...cities];
      const shuffled = duplicated.sort(() => Math.random() - 0.5);
      setCards(shuffled.map((city, i) => ({ id: i, city, flipped: false, matched: false })));
    }, 0);

    return () => clearTimeout(timer);

  }, [language]);

  function handleCardClick(cardIndex: number) {
    if (lockBoard) return;

    const newCards = [...cards];
    const card = newCards[cardIndex];

    if(card.flipped || card.matched) return;

    card.flipped = true;
    setCards(newCards);

    const cachedAudio = audioCache[language]?.[card.city];
    if (cachedAudio) {
      const audio = new Audio(cachedAudio.src);
      audio.play();
    }

    if (firstCard === null) {
      setFirstCard(cardIndex);
      return;
    }

    setSecondCard(cardIndex);
    setLockBoard(true);

    const isMatch = newCards[firstCard].city === card.city;

    if (isMatch) {
      setTimeout(() => {
        setCards(prev =>
          prev.map((c, i) =>
            i === firstCard || i === cardIndex
              ? { ...c, matched: true }
              : c
          )
        );
        setMatchedPairs(prev => prev + 1);
        resetTurn();
      }, 600);
    } else {
      setTimeout(() => {
        setCards(prev =>
          prev.map((c, i) =>
            i === firstCard || i === cardIndex
              ? { ...c, flipped: false }
              : c
          )
        );
        resetTurn();
      }, 1000);
    }

  }

  function resetTurn() {
    setFirstCard(null);
    setSecondCard(null);
    setLockBoard(false);
  }

  // if (matchedPairs === cards.length / 2) {
  //   return <Results />;
  // }

  return (
    <section className="board-table">
      {cards.map((card, index) => (
        <div
          key={card.id}
          className={`card ${card.flipped ? "flipped" : ""}`}
          onClick={() => handleCardClick(index)}
        >
          <div className="card-inner">
            <div className="card-front" />
            <div
              className="card-back"
              style={{
                backgroundImage: `url(/images/${card.city}.png)`,
              }}
            >
              <p>{cityByLanguage[language].items[card.city as CityKey]}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
