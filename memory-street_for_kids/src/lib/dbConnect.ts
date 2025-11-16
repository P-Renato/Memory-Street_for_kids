
import { MongoClient, Db } from 'mongodb';
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