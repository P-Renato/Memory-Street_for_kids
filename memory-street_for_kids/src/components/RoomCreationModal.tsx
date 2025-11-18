// components/RoomCreationModal.tsx - FIXED TYPES
"use client";
import { useState } from 'react';
import { useLanguage } from '@/context/LangaugeContext';
import { cityByLanguage } from '@/lib/db';
import { GameRoom } from '@/types';
import styles from '@/app/ui/home.module.css';

interface RoomCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: GameRoom) => void;
}

// Define the language type based on your cityByLanguage structure
type LanguageKey = keyof typeof cityByLanguage;

interface RoomFormData {
  name: string;
  maxPlayers: number;
  language: LanguageKey;
  isPrivate: boolean;
}

export default function RoomCreationModal({ isOpen, onClose, onRoomCreated }: RoomCreationModalProps) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    maxPlayers: 4,
    language: language as LanguageKey, // Cast to LanguageKey
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const languages: { code: LanguageKey; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },
    { code: 'cs', name: 'Čeština' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'ar', name: 'العربية' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const result = await response.json();
      onRoomCreated(result.room);
      onClose();
      
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>×</button>
        
        <h3>Create Game Room</h3>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Room Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className={styles.authInput}
          />
          
          <select
            value={formData.maxPlayers}
            onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
            className={styles.authInput}
          >
            <option value={2}>2 Players</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players</option>
            <option value={6}>6 Players</option>
            <option value={8}>8 Players</option>
          </select>
          
          <select
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value as LanguageKey })}
            className={styles.authInput}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
            <input
              type="checkbox"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
            />
            Private Room (Requires invite)
          </label>
          
          <button type="submit" disabled={loading} className={styles.authButton}>
            {loading ? 'Creating Room...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
}