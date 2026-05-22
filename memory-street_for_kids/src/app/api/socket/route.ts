// app/api/socket/route.ts - SIMPLE VERSION
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Socket endpoint not needed',
    message: 'Using polling for game sync',
    timestamp: new Date().toISOString()
  });
}

export const dynamic = 'force-dynamic';