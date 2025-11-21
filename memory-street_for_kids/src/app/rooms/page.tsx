// app/rooms/page.tsx
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GameRoom } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
    }
  }, [isAuthenticated]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rooms');
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // In app/rooms/page.tsx - FIXED handleJoinRoom
const handleJoinRoom = async (room: GameRoom) => {
  try {
    console.log('🔍 Attempting to join room:', room.id, room.name);
    
    // Use the actual logged-in user from auth context
    if (!user) {
      throw new Error('You must be logged in to join a room');
    }

    const userData = {
      userId: user.id, 
      username: user.username 
    };

    console.log('🔍 Sending join request with REAL user:', userData);

    const response = await fetch(`/api/rooms/${room.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    console.log('🔍 Join response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Join room API not found. Check server routes.');
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to join room (${response.status})`);
    }

    const result = await response.json();
    console.log('✅ Successfully joined room:', result);
    
    alert(`Successfully joined room: ${room.name}`);
    
  } catch (err) {
    console.error('❌ Error joining room:', err);
    const errorMessage = (err as Error).message;
    setError(`Failed to join room: ${errorMessage}`);
  }
};

  // Add these return statements for different states
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to view rooms</h1>
        <Link href="/">← Back to Game</Link>
      </div>
    );
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading rooms...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Error: {error}</div>;

  // Main return statement - THIS WAS MISSING!
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Available Rooms</h1>
        <div>
          <Link 
            href="/" 
            style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', textDecoration: 'none', borderRadius: '4px' }}
          >
            ← Back to Game
          </Link>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>No rooms available. Create one to start playing!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {rooms.map(room => (
            <div key={room.id} style={{ 
              border: '1px solid #ddd', 
              padding: '1.5rem', 
              borderRadius: '8px',
              background: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{room.name}</h3>
                  <p style={{ margin: '0', color: '#666' }}>
                    Host: {room.players.find(p => p.isHost)?.username || 'Unknown'}
                  </p>
                </div>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  background: room.status === 'waiting' ? '#e7f3ff' : '#fff0e7',
                  color: room.status === 'waiting' ? '#0070f3' : '#ff6b35',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {room.status}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ margin: '0' }}>🎮 Players: {room.players.length}/{room.maxPlayers}</p>
                <p style={{ margin: '0' }}>🌐 Language: {room.settings.language}</p>
                <p style={{ margin: '0' }}>🔒 {room.settings.isPrivate ? 'Private' : 'Public'}</p>
                <p style={{ margin: '0' }}>🃏 Cards: {room.settings.cardCount}</p>
              </div>

              <button 
                onClick={() => handleJoinRoom(room)}
                disabled={room.players.length >= room.maxPlayers || room.status !== 'waiting'}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: room.players.length >= room.maxPlayers ? '#ccc' : 
                             room.status !== 'waiting' ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: room.players.length >= room.maxPlayers || room.status !== 'waiting' ? 'not-allowed' : 'pointer'
                }}
              >
                {room.players.length >= room.maxPlayers ? 'Room Full' : 
                 room.status !== 'waiting' ? 'Game in Progress' : 'Join Room'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}