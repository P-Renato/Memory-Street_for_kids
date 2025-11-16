
// Audio cache loading function
import { AudioCache } from '@/lib/audioCache';

export async function loadAudioCache(): Promise<AudioCache | null> {
  try {
    const audioModule = await import('@/lib/audioCache');
    console.log("✅ audioCache module loaded");
    return audioModule.audioCache;
  } catch (error) {
    console.error("❌ Failed to load audio cache:", error);
    return null;
  }
}