// lib/socket-server.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './auth-utils';
import { getRoomById, updateRoom } from './dbConnect';
import { GameRoom, GamePlayer, Card } from '@/types';

interface SocketData {
  userId: string;
  username: string;
}

class GameSocketServer {
  private io: SocketIOServer | null = null;
  
  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    // Middleware for authentication
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = verifyToken(token);
        socket.data.userId = decoded.userId;
        socket.data.username = decoded.email?.split('@')[0] || 'Player';
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.data.userId})`);

      // Join room
      socket.on('join-room', async (roomId: string) => {
        try {
          const room = await getRoomById(roomId);
          if (!room) {
            socket.emit('error', 'Room not found');
            return;
          }

          // Check if user is in the room
          const player = room.players.find(p => p.userId === socket.data.userId);
          if (!player) {
            socket.emit('error', 'You are not in this room');
            return;
          }

          socket.join(roomId);
          socket.data.roomId = roomId;

          console.log(`🎮 User ${socket.data.userId} joined room ${roomId}`);
          
          // Notify others in the room
          socket.to(roomId).emit('player-connected', {
            userId: socket.data.userId,
            username: socket.data.username
          });

          // Send current room state to the joining user
          socket.emit('room-state', room);

        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', 'Failed to join room');
        }
      });

      // Leave room
      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        socket.data.roomId = null;
        socket.to(roomId).emit('player-left', {
          userId: socket.data.userId
        });
      });

      // Flip card
      socket.on('flip-card', async (data: { roomId: string; cardIndex: number; cardId: number }) => {
        try {
          const { roomId, cardIndex, cardId } = data;
          const room = await getRoomById(roomId);
          
          if (!room || room.status !== 'playing') {
            socket.emit('error', 'Game not active');
            return;
          }

          // Check if it's user's turn
          if (room.gameState.currentTurn !== socket.data.userId) {
            socket.emit('not-your-turn', {
              currentTurn: room.gameState.currentTurn
            });
            return;
          }

          // Update game state
          const flippedCards = [...(room.gameState.flippedCards || []), cardIndex];
          const updatedGameState = {
            ...room.gameState,
            flippedCards
          };

          await updateRoom(roomId, { gameState: updatedGameState });

          // Broadcast to room
          this.io!.to(roomId).emit('card-flipped', {
            userId: socket.data.userId,
            cardIndex,
            cardId,
            flippedCards
          });

          // Check if two cards are flipped
          if (flippedCards.length >= 2) {
            setTimeout(async () => {
              // Check for match (simplified - use your actual match logic)
              const card1 = room.gameState.cards[flippedCards[0]];
              const card2 = room.gameState.cards[flippedCards[1]];
              const isMatch = card1?.id === card2?.id;

              if (isMatch) {
                // Update player score
                const updatedPlayers = room.players.map(player => 
                  player.userId === socket.data.userId
                    ? { ...player, score: player.score + 10 }
                    : player
                );

                // Update cards to matched
                const updatedCards = room.gameState.cards.map((card, index) =>
                  flippedCards.includes(index) ? { ...card, matched: true } : card
                );

                const matchedPairs = (room.gameState.matchedPairs || 0) + 1;
                const isGameComplete = matchedPairs >= room.settings.cardCount / 2;

                const finalGameState = {
                  ...updatedGameState,
                  cards: updatedCards,
                  matchedPairs,
                  isGameComplete,
                  flippedCards: []
                };

                await updateRoom(roomId, {
                  players: updatedPlayers,
                  gameState: finalGameState
                });

                // Broadcast match
                this.io!.to(roomId).emit('cards-matched', {
                  userId: socket.data.userId,
                  cardIndices: flippedCards,
                  players: updatedPlayers,
                  gameState: finalGameState
                });

                // Check if game is complete
                if (isGameComplete) {
                  this.io!.to(roomId).emit('game-ended', {
                    winner: updatedPlayers.reduce((prev, current) => 
                      prev.score > current.score ? prev : current
                    )
                  });
                }

              } else {
                // No match - change turn
                const players = room.players;
                const currentIndex = players.findIndex(p => p.userId === socket.data.userId);
                const nextIndex = (currentIndex + 1) % players.length;
                const nextPlayer = players[nextIndex];

                const finalGameState = {
                  ...updatedGameState,
                  currentTurn: nextPlayer.userId,
                  flippedCards: []
                };

                await updateRoom(roomId, { gameState: finalGameState });

                this.io!.to(roomId).emit('turn-changed', {
                  nextPlayer: nextPlayer.userId,
                  gameState: finalGameState
                });
              }
            }, 1500);
          }

        } catch (error) {
          console.error('Error flipping card:', error);
          socket.emit('error', 'Failed to flip card');
        }
      });

      // End turn
      socket.on('end-turn', async (roomId: string) => {
        try {
          const room = await getRoomById(roomId);
          if (!room) return;

          const players = room.players;
          const currentIndex = players.findIndex(p => p.userId === socket.data.userId);
          const nextIndex = (currentIndex + 1) % players.length;
          const nextPlayer = players[nextIndex];

          const updatedGameState = {
            ...room.gameState,
            currentTurn: nextPlayer.userId,
            flippedCards: []
          };

          await updateRoom(roomId, { gameState: updatedGameState });

          this.io!.to(roomId).emit('turn-changed', {
            nextPlayer: nextPlayer.userId,
            gameState: updatedGameState
          });

        } catch (error) {
          console.error('Error ending turn:', error);
        }
      });

      // Chat message
      socket.on('chat-message', (data: { roomId: string; message: string }) => {
        const { roomId, message } = data;
        socket.to(roomId).emit('chat-message', {
          userId: socket.data.userId,
          username: socket.data.username,
          message,
          timestamp: new Date().toISOString()
        });
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
        if (socket.data.roomId) {
          socket.to(socket.data.roomId).emit('player-disconnected', {
            userId: socket.data.userId
          });
        }
      });
    });
  }

  // Helper to emit to room
  emitToRoom(roomId: string, event: string, data: any) {
    this.io?.to(roomId).emit(event, data);
  }

  // Helper to emit to all
  emitToAll(event: string, data: any) {
    this.io?.emit(event, data);
  }
}

// Singleton instance
export const gameSocketServer = new GameSocketServer();