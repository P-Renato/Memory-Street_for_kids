import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/dbConnect';
import { hashPassword, generateToken } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const existingUser = await db.collection('players').findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email or username' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    
    const result = await db.collection('players').insertOne({
      username,
      email,
      password: hashedPassword,
      totalGames: 0,
      totalWins: 0,
      totalScore: 0,
      createdAt: new Date()
    });

    const token = generateToken(result.insertedId.toString(), email);

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.insertedId,
        username,
        email
      },
      message: 'Player registered successfully'
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}