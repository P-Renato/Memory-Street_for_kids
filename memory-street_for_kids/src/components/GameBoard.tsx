
/*
"use client";
import { useState, useEffect } from "react";
import { cityByLanguage } from "../lib/db";
import { type AudioCache } from "../lib/audioCache";
import { useLanguage } from "../context/LangaugeContext";
import styles from '../app/ui/home.module.css'

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
   const [audioCache, setAudioCache] = useState<AudioCache | null>(null);
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
   useEffect(()=> {
      import('../lib/audioCache').then((module) => {
        setAudioCache(module.audioCache)
      })
    }, [])


  function handleCardClick(cardIndex: number) {
    if (lockBoard) return;

    const newCards = [...cards];
    const card = newCards[cardIndex];

    if(card.flipped || card.matched) return;

    card.flipped = true;
    setCards(newCards);

    if (audioCache?.[language]?.[card.city]) {
      const audio = audioCache[language][card.city];
      
      // Reset audio to start and play
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn('Audio play failed:', error);
      });
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

const getImagePath = (city: string) => {
  const cleanCity = city.replace(/\s+/g, '_');
  const imagePath = `/images/${cleanCity}.png`;
  
  console.log(cleanCity)
  console.log(imagePath)
  
  return imagePath;
};
const newLanguage = (cityByLanguage[language].items)
console.log(newLanguage)
console.log(cards)
// cards.map(card => console.log(card.city))


  return (
    <section className="grid grid-cols-6 grid-rows-6 "
    style={{
            backgroundImage: "url(/images/bg_city-memory_game.png)"
          }}>
      {cards.map((card, index) => (
        <div
          key={card.id}
          className={`${styles.card} ${card.flipped ? styles.flipped : ""}`}
          onClick={() => handleCardClick(index)}
        >
          <div className={styles.cardInner}
          style={{
            backgroundImage: "url(/images/backcardWithoutText.png)"
          }}>
            <div className={styles.cardFront} />
            <div
              className={styles.cardBack}
              style={{
                backgroundImage: `url(${getImagePath(card.city)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: 220,
                height: 200
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


 */


"use client";
import { useState, useEffect } from "react";
import { cityByLanguage } from "../lib/db";
import { type AudioCache } from "../lib/audioCache";
import { useLanguage } from "../context/LangaugeContext";
import styles from '@/app/ui/home.module.css'

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
  const [audioCache, setAudioCache] = useState<AudioCache | null>(null);
  const [matchedPairs, setMatchedPairs] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cities = Object.keys(cityByLanguage[language].items);
      const duplicated = [...cities, ...cities];
      const shuffled = duplicated.sort(() => Math.random() - 0.5);
      setCards(shuffled.map((city, i) => ({ 
        id: i, 
        city, 
        flipped: false, 
        matched: false 
      })));
    }, 0);

    return () => clearTimeout(timer);
  }, [language]);

  useEffect(() => {
    console.log("✅ audioCache module loaded:", module);
    import('../lib/audioCache').then((module) => {
      setAudioCache(module.audioCache)
    })
  }, []);

  function handleCardClick(cardIndex: number) {
    if (lockBoard) return;

    const card = cards[cardIndex];
    console.log(card.flipped)
    if (card.flipped || card.matched) return;

    console.log("Flipping card:", cardIndex, card.city);

    // React way: Update state to flip the card
    setCards(prevCards => 
      prevCards.map((c, i) => 
        i === cardIndex ? { ...c, flipped: true } : c
      )
    );
    console.log(audioCache)

    if (audioCache?.[language]?.[card.city]) {
      const audio = audioCache[language][card.city];
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn('Audio play failed:', error);
      });
    }

    if (firstCard === null) {
      setFirstCard(cardIndex);
    } else {
      setSecondCard(cardIndex);
      setLockBoard(true);
  
      const isMatch = cards[firstCard].city === card.city;

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
                ? { ...c, flipped: false }  // Flip back if no match
                : c
            )
          );
          resetTurn();
        }, 1000);
      }
    }
  }



  function resetTurn() {
    setFirstCard(null);
    setSecondCard(null);
    setLockBoard(false);
  }

  const getImagePath = (city: string) => {
    const cleanCity = city.replace(/\s+/g, '_');
    return `/images/${cleanCity}.png`;
  };

  return (
    <section className={styles.boardTable}
    style={{
            backgroundImage: "url(/images/bg_city-memory_game.png)"
          }}>
      {cards.map((card, index) => (
        <div
          key={card.id}
          // Conditionally apply "flipped" class based on card state
          className={`${styles.card} ${card.flipped ? styles.flipped : ""}`}
          onClick={() => handleCardClick(index)}
        >
          <div className={styles.cardInner}>
            <div className={styles.cardFront} />
            <div
              className={styles.cardBack}
              style={{
                backgroundImage: `url(${getImagePath(card.city)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
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