// app/api/auth/debug/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  
  console.log('🍪 All cookies:', cookieStore.getAll());
  
  const response = NextResponse.json({ 
    success: true,
    existingCookies: cookieStore.getAll().map(c => ({
      name: c.name,
      value: c.value.substring(0, 10) + '...', // Show partial for security
    }))
  });
  
  // Try setting a simple cookie
  response.cookies.set('debug-cookie', 'debug-value-' + Date.now(), {
    httpOnly: false, // Make accessible via JS
    secure: false, // Allow in development
    sameSite: 'lax',
    path: '/',
  });
  
  // Try setting an httpOnly cookie
  response.cookies.set('http-only-debug', 'http-only-value-' + Date.now(), {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });
  
  return response;
}