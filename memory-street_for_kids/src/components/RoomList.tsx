// components/RoomList.tsx
"use client";
import { useState, useEffect } from 'react';
import { GameRoom, CurrentUser } from '@/types'; // Import from your types
import styles from '@/app/ui/home.module.css';

interface RoomListProps {
  onJoinRoom: (room: GameRoom) => void;
  currentUser: CurrentUser;
}

export default function RoomList({ onJoinRoom, currentUser }: RoomListProps) {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rooms');
      
      if (!response.ok) throw new Error('Failed to fetch rooms');
      
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinRoom = async (room: GameRoom) => {
    try {
      const response = await fetch(`/api/rooms/${room.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join room');
      }

      onJoinRoom(room);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) return <div className={styles.loading}>Loading rooms...</div>;
  if (error) return <div className={styles.errorMessage}>Error: {error}</div>;

  return (
    <div className={styles.roomList}>
      <div className={styles.roomListHeader}>
        <h3>Available Rooms</h3>
        <button onClick={fetchRooms} className={styles.refreshButton}>
          Refresh
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className={styles.noRooms}>No rooms available. Create one to start playing!</div>
      ) : (
        <div className={styles.roomsGrid}>
          {rooms.map(room => (
            <div key={room.id} className={styles.roomCard}>
              <div className={styles.roomHeader}>
                <h4>{room.name}</h4>
                <span className={`${styles.status} ${styles[room.status]}`}>
                  {room.status}
                </span>
              </div>
              
              <div className={styles.roomDetails}>
                <p>👤 Host: {room.players.find(p => p.isHost)?.username || 'Unknown'}</p>
                <p>🎮 Players: {room.players.length}/{room.maxPlayers}</p>
                <p>🌐 Language: {room.settings.language}</p>
                <p>🔒 {room.settings.isPrivate ? 'Private' : 'Public'}</p>
              </div>

              <button 
                onClick={() => handleJoinRoom(room)}
                disabled={room.players.length >= room.maxPlayers || room.status !== 'waiting'}
                className={styles.joinButton}
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