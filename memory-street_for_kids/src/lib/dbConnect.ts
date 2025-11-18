
import { MongoClient, Db } from 'mongodb';
import { GameRoom } from '@/types';
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const ATLAS_URI = process.env.ATLAS_URI;
const DB_NAME = 'Memory_Game-City_version';

if (!ATLAS_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Type definitions for our cached connection
interface MongoConnection {
  client: MongoClient;
  db: Db;
}

// Declare types for our cached variables
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<MongoConnection> {
  // If we have a cached connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Create new connection
  const client = new MongoClient(ATLAS_URI!);
  await client.connect();
  
  const db = client.db(DB_NAME);
  
  // Cache the connection
  cachedClient = client;
  cachedDb = db;
  
  console.log('✅ Connected to MongoDB');
  return { client, db };
}

export async function createRoom(roomData: Omit<GameRoom, 'id' | 'createdAt'> & { id?: string }) {
  const { db } = await connectToDatabase();
  
  const roomToCreate: GameRoom = {
    // _id: roomData._id?.toString() || roomData.id,
    id: roomData.id || `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: roomData.name,
    host: roomData.host,
    players: roomData.players,
    maxPlayers: roomData.maxPlayers,
    status: roomData.status,
    gameState: roomData.gameState,
    settings: roomData.settings,
    createdAt: new Date()
  };

  const result = await db.collection('rooms').insertOne(roomToCreate);
  return result;
}

export async function getRooms(): Promise<GameRoom[]> {
  const { db } = await connectToDatabase();
  const rooms = await db.collection('rooms').find().toArray();
  // return rooms as GameRoom[];
  return rooms.map(room => {
    // Explicitly create a GameRoom object with all required properties
    const gameRoom: GameRoom = {
      // _id: room._id,
      id: room._id?.toString(),
      name: room.name,
      host: room.host,
      players: room.players || [],
      maxPlayers: room.maxPlayers,
      status: room.status,
      gameState: room.gameState || {
        cards: [],
        currentTurn: '',
        matchedPairs: 0,
        isGameComplete: false
      },
      settings: room.settings,
      createdAt: room.createdAt,
      // updatedAt: room.updatedAt
    };
    return gameRoom;
  });
}

export async function getRoomById(roomId: string): Promise<GameRoom | null> {
  const { db } = await connectToDatabase();
  const room = await db.collection('rooms').findOne({ id: roomId });
  return room as GameRoom | null;
}

export async function updateRoom(roomId: string, updates: Partial<GameRoom>) {
  const { db } = await connectToDatabase();
  return await db.collection('rooms').updateOne(
    { id: roomId },
    { 
      $set: { 
        ...updates,
        updatedAt: new Date()
      } 
    }
  );
}