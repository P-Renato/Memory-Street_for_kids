// hooks/useWebSocket.ts
'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(roomId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    console.log('🔌 Connecting to WebSocket for room:', roomId);
    
    // Connect to WebSocket server
    socketRef.current = io({
      path: '/api/socket', // This matches our API route
      addTrailingSlash: false,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      
      // Join the specific room
      socket.emit('join_room', roomId);
    });

    socket.on('player_joined', (data) => {
      console.log('👋 Player joined via WebSocket:', data);
      // We'll handle this event later
    });

    socket.on('turn_changed', (data) => {
      console.log('🔄 Turn changed via WebSocket:', data);
      // We'll handle this event later  
    });

    socket.on('card_flipped', (data) => {
      console.log('🎴 Card flipped via WebSocket:', data);
      // We'll handle this event later
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId]);

  // Function to send events to server
  const emitEvent = useCallback((event: string, data: unknown) => {
    if (socketRef.current) {
      console.log(`📤 Sending ${event}:`, data);
      socketRef.current.emit(event, data);
    }
  }, []);

  return { emitEvent };
}