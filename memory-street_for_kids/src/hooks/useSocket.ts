// hooks/useSocket.ts - SIMPLIFIED VERSION
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useSocket() {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For now, just return a dummy implementation
  return {
    isConnected: false, // WebSocket is not working, so false
    error: 'WebSocket not supported in current setup',
    useFallback: true, // Force using fallback
    joinRoom: () => true, // Always succeed (will use API)
    flipCard: () => true, // Always succeed (will use API)
    endTurn: () => true, // Always succeed (will use API)
    onEvent: () => () => {}, // Empty cleanup function
    connect: () => {},
    disconnect: () => {},
  };
}