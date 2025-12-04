// FILE 3 (FIXED): src/lib/socket/client.ts - Simple real-time manager
import { useEffect, useState } from 'react';

// Define proper types for our event system
type EventCallback = (data?: unknown) => void;

// Simple event emitter for real-time updates
class RoomEventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: unknown) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        callback(data);
      });
    }
  }
}

export const roomEvents = new RoomEventEmitter();

// Hook for real-time room updates
export function useRoomUpdates(roomId: string | undefined) {
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (!roomId) return;

    const handleRoomUpdate = () => {
      console.log('🔄 Room update received via events');
      setUpdateCount(prev => prev + 1);
    };

    // Listen for room updates
    roomEvents.on(`room:${roomId}:update`, handleRoomUpdate);

    return () => {
      roomEvents.off(`room:${roomId}:update`, handleRoomUpdate);
    };
  }, [roomId]);

  return updateCount;
}

// Function to notify room updates
export function notifyRoomUpdate(roomId: string) {
  console.log(`📢 Notifying room ${roomId} of update`);
  roomEvents.emit(`room:${roomId}:update`);
}