// hooks/useSocket.ts
'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import {
  SocketAuthData,
  SocketUserData,
  JoinRoomData,
  FlipCardData,
  ChatMessageData,
  PlayerJoinedData,
  CardFlippedData,
  TurnChangedData,
  CardsMatchedData,
  GameEndedData,
  SocketErrorMessage,
  SocketEvent,
  SocketEventHandler
} from '@/types/socket';

interface UseSocketReturn {
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  joinRoom: (roomId: string) => boolean;
  flipCard: (data: FlipCardData) => boolean;
  sendChatMessage: (data: ChatMessageData) => boolean;
  endTurn: (roomId: string) => boolean;
  onEvent: <T>(event: SocketEvent, handler: SocketEventHandler<T>) => (() => void) | undefined;
  offEvent: <T>(event: SocketEvent, handler: SocketEventHandler<T>) => void;
  usePollingFallback: boolean;
}

export function useSocket(): UseSocketReturn {
  const { token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePollingFallback, setUsePollingFallback] = useState(false);

  const connect = useCallback(() => {
    if (!token) {
      setError('No authentication token available');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Create Socket.io connection
    const socket = io({
      path: '/api/socket',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket.io connected:', socket.id);
      setIsConnected(true);
      setError(null);
      setUsePollingFallback(false);

      // Authenticate with server
      const authData: SocketAuthData = { token };
      socket.emit('authenticate', authData);
    });

    socket.on('authenticated', (data: { success: boolean }) => {
      if (data.success) {
        console.log('✅ Socket authenticated');
      }
    });

    socket.on('disconnect', (reason: string) => {
      console.log('🔌 Socket.io disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err.message);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
    });

  }, [token]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setError(null);
    }
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection requested');
    setError('Reconnecting...');
    connect();
  }, [connect]);

  const joinRoom = useCallback((roomId: string): boolean => {
    if (socketRef.current?.connected) {
      const data: JoinRoomData = { roomId };
      socketRef.current.emit('join-room', data);
      return true;
    }
    setError('Not connected to socket server');
    return false;
  }, []);

  const flipCard = useCallback((data: FlipCardData): boolean => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('flip-card', data);
      return true;
    }
    setError('Not connected to socket server');
    return false;
  }, []);

  const sendChatMessage = useCallback((data: ChatMessageData): boolean => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat-message', data);
      return true;
    }
    setError('Not connected to socket server');
    return false;
  }, []);

  const endTurn = useCallback((roomId: string): boolean => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('end-turn', { roomId });
      return true;
    }
    setError('Not connected to socket server');
    return false;
  }, []);

  const onEvent = useCallback(<T,>(
    event: SocketEvent,
    handler: SocketEventHandler<T>
  ): (() => void) | undefined => {
    if (socketRef.current) {
      const wrappedHandler = (data: T) => {
        handler(data);
      };
      socketRef.current.on(event, wrappedHandler);
      
      return () => {
        socketRef.current?.off(event, wrappedHandler);
      };
    }
    return undefined;
  }, []);

  const offEvent = useCallback(<T,>(
    event: SocketEvent,
    handler: SocketEventHandler<T>
  ) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler as SocketEventHandler);
    }
  }, []);

  // Auto-connect on mount when token is available
  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  // Memoize the returned object
  const socketApi = useMemo((): UseSocketReturn => ({
    isConnected,
    error,
    connect,
    disconnect,
    reconnect,
    joinRoom,
    flipCard,
    sendChatMessage,
    endTurn,
    onEvent,
    offEvent,
    usePollingFallback,
  }), [
    isConnected,
    error,
    connect,
    disconnect,
    reconnect,
    joinRoom,
    flipCard,
    sendChatMessage,
    endTurn,
    onEvent,
    offEvent,
    usePollingFallback,
  ]);

  return socketApi;
}