// types/socket.ts

// Socket.io Event Types
export interface SocketAuthData {
  token: string;
}

export interface SocketUserData {
  userId: string;
  username: string;
  roomId?: string;
}

export interface JoinRoomData {
  roomId: string;
}

export interface FlipCardData {
  roomId: string;
  cardIndex: number;
  cardId?: number;
}

export interface ChatMessageData {
  roomId: string;
  message: string;
}

export interface PlayerJoinedData {
  userId: string;
  username: string;
}

export interface CardFlippedData {
  cardIndex: number;
  timestamp: number;
  userId?: string;
}

export interface TurnChangedData {
  nextPlayerId: string;
  nextPlayerName: string;
}

export interface CardsMatchedData {
  cardIndices: number[];
  userId: string;
  score: number;
}

export interface GameEndedData {
  winner: {
    userId: string;
    username: string;
    score: number;
  };
}

export interface SocketErrorMessage {
  message: string;
}

// Event Names
export type SocketEvent =
  | 'authenticate'
  | 'authenticated'
  | 'join-room'
  | 'player-joined'
  | 'flip-card'
  | 'card-flipped'
  | 'turn-changed'
  | 'cards-matched'
  | 'game-ended'
  | 'chat-message'
  | 'error'
  | 'disconnect';

// Event Handlers
export type SocketEventHandler<T = unknown> = (data: T) => void;