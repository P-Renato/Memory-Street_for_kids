// hooks/useGameSync.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GameRoom } from '@/types';

interface UseGameSyncProps {
  roomId: string;
  pollInterval?: number;
}

export function useGameSync({ roomId, pollInterval = 2000 }: UseGameSyncProps) {
  const { token } = useAuth();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [lastMoveTime, setLastMoveTime] = useState<number>(0);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoom = useCallback(async () => {
    if (!roomId || !token) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch room: ${response.status}`);
      }
      
      const roomData: GameRoom = await response.json();
      setRoom(roomData);
      setError(null);
      
      // Track last move for change detection
      if (roomData.gameState?.lastMove?.timestamp) {
        setLastMoveTime(roomData.gameState.lastMove.timestamp);
      }
      
      return roomData;
    } catch (error) {
      console.error('Room sync error:', error);
      setError(error instanceof Error ? error.message : 'Sync failed');
      return null;
    }
  }, [roomId, token]);

  // Start polling
  useEffect(() => {
    if (!roomId || !token) return;
    
    setIsPolling(true);
    fetchRoom(); // Immediate fetch
    
    const interval = setInterval(fetchRoom, pollInterval);
    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [roomId, token, pollInterval, fetchRoom]);

  return {
    room,
    isPolling,
    error,
    lastMoveTime,
    refetch: fetchRoom
  };
}