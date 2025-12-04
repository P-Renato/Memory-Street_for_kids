

// FILE 1: src/lib/socket/server.ts
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

// Simple type for our WebSocket server
export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

// Store room connections (simple in-memory storage for now)
const roomConnections = new Map<string, Set<string>>();

export function initializeSocketIO(res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('✅ Initializing Socket.IO Server...');
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);

      // Join a room
      socket.on('join_room', (roomId: string) => {
        console.log(`👋 ${socket.id} joining room: ${roomId}`);
        socket.join(roomId);
        
        // Track room connections
        if (!roomConnections.has(roomId)) {
          roomConnections.set(roomId, new Set());
        }
        roomConnections.get(roomId)!.add(socket.id);
        
        console.log(`🏠 Room ${roomId} now has ${roomConnections.get(roomId)!.size} connections`);
        
        // Notify others in the room
        socket.to(roomId).emit('player_joined', {
          playerId: socket.id,
          message: 'New player joined the room'
        });
      });

      // Leave a room
      socket.on('leave_room', (roomId: string) => {
        console.log(`🚪 ${socket.id} leaving room: ${roomId}`);
        socket.leave(roomId);
        
        if (roomConnections.has(roomId)) {
          roomConnections.get(roomId)!.delete(socket.id);
        }
      });

      // Handle turn changes
      socket.on('change_turn', (data: { roomId: string; nextPlayerId: string }) => {
        console.log(`🔄 Turn change in room ${data.roomId} to player ${data.nextPlayerId}`);
        io.to(data.roomId).emit('turn_changed', {
          nextPlayerId: data.nextPlayerId,
          changedBy: socket.id
        });
      });

      // Handle card flips
      socket.on('card_flip', (data: { roomId: string; cardIndex: number; playerId: string }) => {
        console.log(`🎴 Card flipped in room ${data.roomId} by ${data.playerId}`);
        socket.to(data.roomId).emit('card_flipped', {
          cardIndex: data.cardIndex,
          flippedBy: data.playerId
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
        // Clean up room connections
        for (const [roomId, connections] of roomConnections.entries()) {
          if (connections.has(socket.id)) {
            connections.delete(socket.id);
            console.log(`🧹 Removed ${socket.id} from room ${roomId}`);
          }
        }
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('✅ Socket.IO already initialized');
  }
}