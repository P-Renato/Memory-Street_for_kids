// components/RoomList.tsx
"use client";
import { useState, useEffect } from 'react';
import { GameRoom } from '@/types';

export default function RoomList() {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      setRooms(data.rooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading rooms...</div>;

  return (
    <div className="room-list">
      <h3>Available Rooms</h3>
      {rooms.length === 0 ? (
        <p>No rooms available. Create one!</p>
      ) : (
        rooms.map(room => (
          <div key={room.id} className="room-item">
            <h4>{room.name}</h4>
            <p>Players: {room.players.length}/{room.maxPlayers}</p>
            <p>Status: {room.status}</p>
            <p>Language: {room.settings.language}</p>
            <button>Join Room</button>
          </div>
        ))
      )}
    </div>
  );
}