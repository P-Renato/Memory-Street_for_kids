// middleware.ts (in project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth-utils';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // If no token and trying to access protected route, redirect to login
  if (!token && request.nextUrl.pathname.startsWith('/profile')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If token exists, verify it
  if (token) {
    try {
      verifyToken(token);
      // Token is valid, continue
    } catch (error) {
      // Invalid token, clear cookie and redirect
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

// Specify which routes should use this middleware
export const config = {
  matcher: [
    '/profile/:path*',
    '/api/protected/:path*'  // Protect API routes too if needed
  ]
};