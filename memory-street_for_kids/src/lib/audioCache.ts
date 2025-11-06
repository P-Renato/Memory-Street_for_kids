import { cityByLanguage } from "./db";
import { cities } from "./types";

type LanguageKey = keyof cities;

type AudioCache = {
    [k in LanguageKey]?: {
        [item: string]: HTMLAudioElement;
    }
}

export const audioCache: AudioCache = {};

(Object.keys(cityByLanguage) as LanguageKey[]).forEach((langKey) => {
  const langData = cityByLanguage[langKey];
  const langCode = langData.code; // e.g. 'en', 'es', 'pt'
  const items = langData.items;

  audioCache[langKey] = {};

  Object.keys(items).forEach((item) => {
    
    const filePath = `/public/${item}_${langCode}.mp3`;

    const audio = new Audio(filePath);

    audioCache[langKey]![item] = audio;
  });
});