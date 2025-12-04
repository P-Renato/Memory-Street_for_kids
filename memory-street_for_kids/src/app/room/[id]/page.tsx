// app/room/[id]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameRoom } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRoomUpdates, notifyRoomUpdate } from '@/lib/socket/client';
import MultiplayerGameBoard from '@/components/MultiPlayerGameBoard'; // Import your game board

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, isAuthenticated } = useAuth();

  console.log('🔍 RoomPage - Room ID:', roomId);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (roomId && isAuthenticated) {
      fetchRoom();
    }
  }, [roomId, isAuthenticated]);

 useEffect(() => {
  if (roomId && isAuthenticated) {
    fetchRoom();
  }
}, [roomId, isAuthenticated]);

const updateCount = useRoomUpdates(roomId);

useEffect(() => {
    if (roomId && isAuthenticated) {
      fetchRoom();
    }
  }, [roomId, isAuthenticated, updateCount]); 

  useEffect(() => {
  if (room?.status === 'playing') {
    console.log('🔄 Starting gameplay auto-refresh');
    const interval = setInterval(() => {
      fetchRoom();
    }, 3000);
    
    return () => {
      console.log('🔄 Stopping gameplay auto-refresh');
      clearInterval(interval);
    };
  }
}, [room?.status]);


console.log('🔍 Room debug:', {
  roomId,
  roomStatus: room?.status,
  players: room?.players.map(p => p.username),
  currentUser: user?.username,
  isAuthenticated
});

  const fetchRoom = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching room:', roomId);
      const response = await fetch(`/api/rooms/${roomId}`);
      
      console.log('🔍 Room response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch room');
      }
      
      const data = await response.json();
      console.log('🔍 Room data received:', data);
      setRoom(data.room);
      
    } catch (err) {
      console.error('❌ Error fetching room:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const fetchAndNotify = async () => {
    await fetchRoom();
    notifyRoomUpdate(roomId);
  };

  const startGame = async () => {
    try {
      console.log('🎮 Starting game for room:', roomId);
      
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start game');
      }

      const result = await response.json();
      console.log('✅ Game started:', result);
      
      // Refresh room data to show the game board
      await fetchAndNotify();
      
    } catch (err) {
      console.error('❌ Error starting game:', err);
      setError((err as Error).message);
    }
  };

  const toggleReady = async () => {
    try {
      if (!room || !user) return;
      
      const currentPlayer = room.players.find(p => p.userId === user.id);
      if (!currentPlayer) return;

      // Toggle ready status locally first for immediate feedback
      const updatedPlayers = room.players.map(player => 
        player.userId === user.id 
          ? { ...player, isReady: !player.isReady }
          : player
      );

      setRoom({ ...room, players: updatedPlayers });

      // Send update to server
      const response = await fetch(`/api/rooms/${roomId}/players`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: updatedPlayers
        }),
      });

      if (!response.ok) {
        // Revert if server update fails
        setRoom(room);
        throw new Error('Failed to update ready status');
      }

    } catch (err) {
      console.error('Error toggling ready:', err);
      setError((err as Error).message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Please log in to view rooms</h1>
        <Link href="/">← Back to Game</Link>
      </div>
    );
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading room...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
  if (!room) return <div style={{ padding: '2rem', textAlign: 'center' }}>Room not found</div>;

  const currentPlayer = room.players.find(p => p.userId === user?.id);
  const isHost = currentPlayer?.isHost || false;
  const allPlayersReady = room.players.every(p => p.isReady);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Room: {room.name}</h1>
          <p>Status: <strong>{room.status}</strong></p>
          <p>Players: {room.players.length}/{room.maxPlayers}</p>
          <p>Language: {room.settings.language}</p>
        </div>
        <div>
          <button 
            onClick={fetchAndNotify}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginRight: '1rem',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
          <Link 
            href="/rooms" 
            style={{ 
              padding: '0.5rem 1rem', 
              border: '1px solid #ccc', 
              textDecoration: 'none', 
              borderRadius: '4px' 
            }}
          >
            ← Back to Rooms
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Players List */}
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: 'white' }}>
          <h3 style={{ marginTop: 0 }}>Players ({room.players.length}/{room.maxPlayers})</h3>
          {room.players.map(player => (
            <div 
              key={player.userId} 
              style={{ 
                padding: '0.75rem', 
                margin: '0.5rem 0',
                background: player.userId === user?.id ? '#e7f3ff' : '#f9f9f9',
                border: player.userId === user?.id ? '1px solid #0070f3' : '1px solid #eee',
                borderRadius: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{player.username}</strong>
                  {player.isHost && ' 👑'}
                  {player.userId === user?.id && ' (You)'}
                </div>
                <span style={{ 
                  fontSize: '0.8rem',
                  color: player.isReady ? 'green' : 'orange',
                  fontWeight: 'bold'
                }}>
                  {player.isReady ? 'Ready ✅' : 'Not Ready ❌'}
                </span>
              </div>
              {player.userId === user?.id && (
                <button 
                  onClick={toggleReady}
                  style={{ 
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    background: player.isReady ? '#ff6b35' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {player.isReady ? 'Mark Not Ready' : 'Mark Ready'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Game Area */}
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: 'white' }}>
          <h3 style={{ marginTop: 0 }}>Game Area</h3>
          
          {room.status === 'waiting' ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h4>🕐 Waiting for Players</h4>
              <p>The game will start when all players are ready.</p>
              <p>Currently {room.players.length} of {room.maxPlayers} players joined.</p>
              
              {/* Auto-start when room is full OR manual start */}
              {room.players.length >= room.maxPlayers && isHost && (
                <div style={{ marginTop: '2rem' }}>
                  <button 
                    onClick={startGame}
                    disabled={!allPlayersReady}
                    style={{ 
                      padding: '1rem 2rem', 
                      background: allPlayersReady ? '#28a745' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1.2rem',
                      cursor: allPlayersReady ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {allPlayersReady ? '🎮 Start Game Now!' : 'Waiting for players to be ready'}
                  </button>
                  <p style={{ marginTop: '0.5rem', color: '#666' }}>
                    {allPlayersReady 
                      ? 'All players are ready! Start the game.' 
                      : `${room.players.filter(p => !p.isReady).length} player(s) not ready`}
                  </p>
                </div>
              )}
            </div>
          ) : room.status === 'playing' ? (
            <div>
              {/* Show the actual game board */}
              <MultiplayerGameBoard room={room} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h4>🏁 Game Finished</h4>
              <p>This game has ended.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}