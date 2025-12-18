// lib/authMiddleware.ts - Create this file
import { NextRequest } from 'next/server';
import { verifyToken } from './auth-utils';

export function authenticateRequest(request: NextRequest) {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyToken(token);

      if (!decoded.userId || typeof decoded.userId !== 'string') {
        return { success: false, error: 'Invalid user ID in token' };
      }
      
      return { 
        success: true, 
        userId: decoded.userId, 
        email: decoded.email 
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return { success: false, error: 'Invalid token' };
    }
  }
   // Try cookies as fallback
  const cookies = request.headers.get('cookie');
  const token = cookies?.split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
  
  if (token) {
    try {
      const decoded = verifyToken(token);
      return { 
        success: true, 
        userId: decoded.userId, 
        email: decoded.email 
      };
    } catch (error) {
      console.error('Cookie token verification failed:', error);
    }
  }
  
  // No token found
  return { success: false, error: 'No token provided' };
}