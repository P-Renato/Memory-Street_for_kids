

// components/Auth/LoginForm.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(formData);
      onClose(); // Close modal on successful login
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="auth-modal">
      <h2>Login to CoffeeMates</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username or Email"
          value={formData.login}
          onChange={(e) => setFormData({ ...formData, login: e.target.value })}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account? <button type="button" className="link-button">Sign up</button>
      </p>
    </div>
  );
}