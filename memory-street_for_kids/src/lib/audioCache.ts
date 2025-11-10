import { cityByLanguage } from "./db";
import { cities } from "./types";

type LanguageKey = keyof cities;

export type AudioCache = {
    [k in LanguageKey]?: {
        [item: string]: HTMLAudioElement;
    }
}

export const audioCache: AudioCache = {};

const availableAudios = [
  'airplane', 'bicycle', 'bridge', 'bus', 'car', 'castle', 'house', 
  'playground', 'street', 'train'
];

if (typeof window !== 'undefined') {
  (Object.keys(cityByLanguage) as LanguageKey[]).forEach((langKey) => {
    const langData = cityByLanguage[langKey];
    const langCode = langData.code;
    const items = langData.items;

    audioCache[langKey] = {};

    Object.keys(items).forEach((item) => {
      if (availableAudios.includes(item)) {
        const filePath = `/${item}_${langCode}.mp3`;
        const audio = new Audio(filePath);
        audioCache[langKey]![item] = audio;
        
        // console.log(`Cached audio: ${item}_${langCode}.mp3`);
      }
    });
  });
}