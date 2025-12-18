// app/api/socket/route.ts - TYPE SAFE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '@/lib/auth-utils';

// Extend NextApiResponse for socket server
interface NextApiResponseWithSocket extends NextResponse {
  socket?: {
    server: {
      io?: SocketIOServer;
    };
  };
}

// Socket data type
interface SocketUser {
  userId: string;
  username: string;
  roomId?: string;
}

// Request with socket
interface NextRequestWithSocket extends NextRequest {
  socket?: {
    server: any;
  };
}

// Global Socket.io instance
let io: SocketIOServer | null = null;

// In-memory store for connected sockets
const connectedSockets = new Map<string, SocketUser>();

export async function GET(request: NextRequestWithSocket) {
  console.log('🔌 GET /api/socket');
  
  // Initialize Socket.io if not already done
  if (!io && request.socket?.server) {
    console.log('🚀 Creating Socket.io server');
    
    io = new SocketIOServer(request.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });
    
    setupSocketHandlers(io);
  }
  
  return NextResponse.json({
    status: 'Socket.io ready',
    initialized: !!io,
    timestamp: new Date().toISOString()
  });
}

function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    
    // Initialize socket data
    connectedSockets.set(socket.id, { userId: '', username: '' });
    
    // Handle authentication
    socket.on('authenticate', (data: { token: string }) => {
      try {
        const decoded = verifyToken(data.token);
        const userData: SocketUser = {
          userId: decoded.userId,
          username: decoded.email?.split('@')[0] || 'Player'
        };
        
        connectedSockets.set(socket.id, userData);
        socket.emit('authenticated', { success: true });
        
        console.log(`✅ Socket ${socket.id} authenticated as ${userData.username}`);
      } catch (error) {
        console.error('Authentication failed:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });
    
    // Join room
    socket.on('join-room', (data: { roomId: string }) => {
      const userData = connectedSockets.get(socket.id);
      if (!userData || !userData.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const { roomId } = data;
      socket.join(roomId);
      userData.roomId = roomId;
      
      console.log(`🎮 ${userData.username} joined room ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('player-joined', {
        userId: userData.userId,
        username: userData.username
      });
    });
    
    // Flip card
    socket.on('flip-card', (data: { roomId: string; cardIndex: number; cardId?: number }) => {
      const userData = connectedSockets.get(socket.id);
      if (!userData || !userData.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const { roomId, cardIndex } = data;
      
      console.log(`🃏 ${userData.username} flipped card ${cardIndex} in room ${roomId}`);
      
      // Broadcast to everyone in the room (including sender)
      io?.to(roomId).emit('card-flipped', {
        cardIndex,
        userId: userData.userId,
        username: userData.username,
        timestamp: Date.now()
      });
    });
    
    // End turn
    socket.on('end-turn', (data: { roomId: string }) => {
      const userData = connectedSockets.get(socket.id);
      if (!userData || !userData.userId) {
        return;
      }
      
      socket.to(data.roomId).emit('turn-ended', {
        userId: userData.userId
      });
    });
    
    // Chat message
    socket.on('chat-message', (data: { roomId: string; message: string }) => {
      const userData = connectedSockets.get(socket.id);
      if (!userData || !userData.userId) {
        return;
      }
      
      socket.to(data.roomId).emit('chat-message', {
        userId: userData.userId,
        username: userData.username,
        message: data.message,
        timestamp: new Date().toISOString()
      });
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      const userData = connectedSockets.get(socket.id);
      
      if (userData?.roomId) {
        socket.to(userData.roomId).emit('player-left', {
          userId: userData.userId
        });
      }
      
      connectedSockets.delete(socket.id);
    });
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    status: 'Socket.io handshake',
    timestamp: new Date().toISOString()
  });
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    status: 'CORS preflight',
    timestamp: new Date().toISOString()
  });
}

export const dynamic = 'force-dynamic';