// app/game/[id]/page.tsx - FIXED VERSION
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GameRoom, GamePlayer } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import GameBoard from '@/components/GameBoard';
import styles from '@/app/ui/home.module.css';

export default function GameRoomPage() {
  const params = useParams();
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
  // Initialize Socket.io server when game page loads
  const initSocket = async () => {
    try {
      console.log('🚀 Initializing Socket.io connection...');
      await fetch('/api/socket');
      console.log('✅ Socket.io endpoint ready');
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
    }
  };
  
  // Only initialize if authenticated
  if (isAuthenticated && token) {
    initSocket();
  }
}, [isAuthenticated, token]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!params?.id || authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setError('You must be logged in to view rooms');
      setLoading(false);
      return;
    }

    const roomId = params.id as string;
    console.log('🎯 Room ID:', roomId, 'User:', user?.id, 'Token exists:', !!token);
    
    fetchRoom(roomId, false); // Fixed: Added force parameter
    
    // Poll for updates every 3 seconds
    const interval = setInterval(() => fetchRoom(roomId, false), 3000);
    
    return () => clearInterval(interval);
  }, [params?.id, isAuthenticated, authLoading, user, token]);

  const fetchRoom = async (roomId: string, force: boolean = false) => { // Added default value
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/rooms/${roomId}`, {
        headers,
        cache: force ? 'no-cache' : 'default',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - token might be invalid
          setError('Session expired. Please log in again.');
          return;
        }
        
        if (response.status === 404) {
          setError('Room not found');
        } else {
          throw new Error(`Failed to load room (${response.status})`);
        }
        return;
      }
      
      const data = await response.json();
      console.log('📥 Room data fetched:', {
        id: data.id,
        players: data.players?.map((p: GamePlayer) => ({ 
          id: p.userId, 
          name: p.username, 
          isHost: p.isHost 
        }))
      });
      setRoom(data);
      setError('');
    } catch (error) {
      console.error('❌ Error fetching room:', error);
      // Don't set error on every failed poll
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!room || !user || !token) {
      console.error('Cannot start game: Missing room, user, or token');
      alert('Please log in again');
      return;
    }
    
    console.log('🎮 Attempting to start game as user:', user.id, 'Username:', user.username);
    
    try {
      const response = await fetch(`/api/rooms/${room.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to start game:', result.error);
        alert(result.error || 'Failed to start game');
        return;
      }
      
      console.log('✅ Game started successfully:', result);
      // Refresh room data - Fixed: check if room exists
      if (room && room.id) {
        setTimeout(() => fetchRoom(room.id, true), 500);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const handleJoinRoom = async () => {
    if (!room || !user || !token) {
      console.error('Cannot join room: Missing room, user, or token');
      return;
    }
    setJoining(true);
    
    try {
      console.log('🔍 Attempting to join room from game page...');
      
      const response = await fetch(`/api/rooms/${room.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          userId: user.id, 
          username: user.username 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Join failed:', errorData);
        alert(errorData.error || 'Failed to join room');
        return;
      }
      
      const result = await response.json();
      console.log('✅ Successfully joined room:', result);
      
      if (result.room) {
        setRoom(result.room);
      }

      // Fixed: check if room exists before calling fetchRoom
      if (room && room.id) {
        setTimeout(() => {
          fetchRoom(room.id, true);
        }, 300);
      }
      
      // Don't reload - just update state and show success
      alert(`Successfully joined room: ${room.name}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  // Show loading states
  if (authLoading || (loading && !error)) {
    return (
      <div className={styles.loadingContainer}>
        <Header />
        <div className={styles.loadingContent}>
          <h2>Loading...</h2>
          <p>Please wait while we load the room</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className={styles.errorContainer}>
        <Header />
        <div className={styles.errorContent}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={styles.notFoundContainer}>
        <Header />
        <div className={styles.notFoundContent}>
          <h2>Room Not Found</h2>
          <p>The room you&apos;re looking for doesn&apos;t exist or has been closed.</p>
        </div>
      </div>
    );
  }

  // Check if user is in the room
  const isUserInRoom = user ? room.players.some(p => p.userId === user.id) : false;
  const hostPlayer = room.players.find(p => p.isHost); // Fixed: removed === true
  const isHost = user ? room.players.some(p => p.isHost && p.userId === user.id) : false;
  
  const currentPlayer = room.players.find(p => p.userId === user?.id);

  console.log('🔍 Room state check:', {
    userId: user?.id,
    isUserInRoom,
    isHost,
    hostPlayer,
    players: room.players.map(p => ({ id: p.userId, name: p.username, isHost: p.isHost }))
  });

  // If user is not in the room, show join button
 if (!isUserInRoom && user && token) {
    return (
      <div className={styles.notInRoomContainer}>
        <Header />
        <div className={styles.notInRoomContent}>
          <h2>You&apos;re Not in This Room</h2>
          <p>You need to join this room to participate.</p>
          <button 
            onClick={handleJoinRoom}
            className={styles.joinButton}
            disabled={joining}
          >
            {joining ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameRoomContainer}>
      <Header />
      
      <main className={styles.gameRoomMain}>
        {/* Room Header */}
        <div className={styles.roomHeader}>
          <div>
            <h1>{room.name}</h1>
            <div className={styles.roomMeta}>
              <span className={`${styles.statusBadge} ${styles[room.status]}`}>
                {room.status.toUpperCase()}
              </span>
              <span>Language: {room.settings.language}</span>
              <span>Cards: {room.settings.cardCount}</span>
              <span>Host: {hostPlayer?.username || 'Unknown'}</span>
            </div>
          </div>
          
          <div className={styles.roomActions}>
            {room.status === 'waiting' && user && token && (
              <button 
                onClick={handleStartGame}
                disabled={!isHost || room.players.length < 2}
                className={styles.startGameButton}
              >
                {!isHost ? 'Only Host Can Start' : 
                 room.players.length < 2 ? 'Need 2 Players' : 'Start Game'}
              </button>
            )}
            
            <div className={styles.playerCount}>
              👥 {room.players.length}/{room.maxPlayers}
            </div>
          </div>
        </div>

        {/* Debug info */}
        <div className={styles.debugInfo}>
          <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
          <p><strong>Token:</strong> {token ? 'Present' : 'Missing'}</p>
          <p><strong>Is Host:</strong> {isHost ? 'Yes' : 'No'}</p>
          <p><strong>User in Room:</strong> {isUserInRoom ? 'Yes' : 'No'}</p>
          <p><strong>Players:</strong> {room.players.map(p => `${p.username}${p.isHost ? ' (H)' : ''}`).join(', ')}</p>
        </div>

        {/* Two-column layout */}
        <div className={styles.roomContent}>
          {/* Players List Sidebar */}
          <div className={styles.playersSidebar}>
            <h2>Players ({room.players.length}/{room.maxPlayers})</h2>
            <div className={styles.playersList}>
              {room.players.map((player, index) => (
                <div 
                  key={player.userId} 
                  className={`${styles.playerCard} ${player.isHost ? styles.host : ''} ${player.userId === user?.id ? styles.currentPlayer : ''}`} // Fixed: removed === true
                >
                  <div className={styles.playerAvatar}>
                    {index + 1}
                  </div>
                  <div className={styles.playerInfo}>
                    <div className={styles.playerName}>
                      <strong>{player.username}</strong>
                      {player.isHost && <span className={styles.hostBadge}>HOST</span>} {/* Fixed */}
                      {player.userId === user?.id && <span className={styles.youBadge}>YOU</span>}
                    </div>
                    <div className={styles.playerStats}>
                      <span>Score: {player.score}</span>
                      <span className={`${styles.readyStatus} ${player.isReady ? styles.ready : ''}`}>
                        {player.isReady ? 'Ready' : 'Not Ready'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.roomIdSection}>
              <p>Share this Room ID:</p>
              <code className={styles.roomId}>{room.id}</code>
            </div>
          </div>

          {/* Main Game Area */}
          <div className={styles.gameArea}>
            {room.status === 'waiting' ? (
              <div className={styles.waitingRoom}>
                <h2>Waiting Room</h2>
                <p>Game will start when host clicks &quot;Start Game&quot;</p>
                {isHost && (
                  <div className={styles.hostMessage}>
                    <p>You are the host. Click &quot;Start Game&quot; above when ready.</p>
                    {room.players.length < 2 && (
                      <p className={styles.warning}>Need at least 2 players to start.</p>
                    )}
                  </div>
                )}
                
                <div className={styles.miniPreview}>
                  <GameBoard room={room} isMultiplayer={true} />
                </div>
              </div>
            ) : (
              <div className={styles.activeGame}>
                <GameBoard room={room} isMultiplayer={true} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}