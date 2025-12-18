

// app/api/auth/me/route.ts - CRITICAL MISSING ENDPOINT
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-utils';
import { connectToDatabase } from '@/lib/dbConnect';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    console.log('🍪 Token from cookies:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return NextResponse.json({ user: null });
    }
    
    // Verify the JWT token
    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('✅ Token verified:', { userId: decoded.userId });
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return NextResponse.json({ user: null });
    }
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ user: null });
    }
    
    const { db } = await connectToDatabase();
    
    // Find user by ID from token
    const user = await db.collection('players').findOne({ 
      _id: new ObjectId(decoded.userId)
    });
    
    if (!user) {
      return NextResponse.json({ user: null });
    }

    console.log('✅ User found:', { 
      id: user._id.toString(), 
      name: user.name, 
      email: user.email 
    });
    
    return NextResponse.json({ 
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ user: null });
  }
}