// src/types/index.ts

// Game Types (keep these the same)
export interface Card {
  id: number;
  city: string;
  flipped: boolean;
  matched: boolean;
}

export interface GamePlayer {
  userId: string;
  username: string;
  score: number;
  isReady: boolean;
  isHost: boolean;
}

export interface GameState {
  cards: Card[];
  currentTurn: string;
  matchedPairs: number;
  isGameComplete: boolean;
}

export interface GameRoom {
  // _id?: string;
  id: string;
  name: string;
  host: string;
  players: GamePlayer[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  gameState: GameState;
  settings: {
    language: string;
    cardCount: number;
    isPrivate: boolean;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface CurrentUser {
  id: string;
  username: string;
  email?: string;
}

export interface CreateRoomData {
  name: string;
  maxPlayers: number;
  language: string;
  isPrivate: boolean;
}

export interface JoinRoomData {
  roomId: string;
  userId: string;
}

// WebSocket Types - FIXED (no more 'any')
export type WebSocketEvent = 
  | { type: 'ROOM_CREATED'; room: GameRoom }
  | { type: 'PLAYER_JOINED'; player: GamePlayer; roomId: string }
  | { type: 'PLAYER_LEFT'; userId: string; roomId: string }
  | { type: 'GAME_STARTED'; roomId: string; cards: Card[] }
  | { type: 'CARD_FLIPPED'; cardId: number; playerId: string; roomId: string }
  | { type: 'CARDS_MATCHED'; cardIds: number[]; playerId: string; roomId: string }
  | { type: 'TURN_CHANGED'; nextPlayerId: string; roomId: string }
  | { type: 'GAME_ENDED'; winner: GamePlayer; roomId: string }
  | { type: 'CHAT_MESSAGE'; message: string; player: GamePlayer; roomId: string };

// Define specific data types for WebSocket messages
export interface WebSocketMessage {
  type: string;
  data: 
    | GameRoom                   // for ROOM_CREATED
    | { player: GamePlayer; roomId: string } // for PLAYER_JOINED
    | { userId: string; roomId: string }     // for PLAYER_LEFT
    | { roomId: string; cards: Card[] }      // for GAME_STARTED
    | { cardId: number; playerId: string; roomId: string } // for CARD_FLIPPED
    | { cardIds: number[]; playerId: string; roomId: string } // for CARDS_MATCHED
    | { nextPlayerId: string; roomId: string } // for TURN_CHANGED
    | { winner: GamePlayer; roomId: string } // for GAME_ENDED
    | { message: string; player: GamePlayer; roomId: string }; // for CHAT_MESSAGE
  roomId?: string;
  userId?: string;
}

// More specific message types for better type safety
export interface RoomCreatedMessage {
  type: 'ROOM_CREATED';
  data: GameRoom;
}

export interface PlayerJoinedMessage {
  type: 'PLAYER_JOINED';
  data: {
    player: GamePlayer;
    roomId: string;
  };
}

export interface CardFlippedMessage {
  type: 'CARD_FLIPPED';
  data: {
    cardId: number;
    playerId: string;
    roomId: string;
  };
}

export interface GameStartedMessage {
  type: 'GAME_STARTED';
  data: {
    roomId: string;
    cards: Card[];
  };
}

// Union type for all specific message types
export type SpecificWebSocketMessage = 
  | RoomCreatedMessage
  | PlayerJoinedMessage
  | CardFlippedMessage
  | GameStartedMessage
  // ... add other specific message types as needed
  | { type: string; data: unknown }; // fallback for unknown types