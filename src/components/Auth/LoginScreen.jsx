import React, { useState, useEffect, useRef } from 'react';
import { AuthService } from '../../services/auth';
import GlassCard from '../UI/GlassCard';

export default function LoginScreen({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // Clean up polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  const startPolling = () => {
    // Poll every 2s for JWT stored by the background service worker
    pollRef.current = setInterval(async () => {
      try {
        if (typeof chrome === 'undefined' || !chrome.storage) return;
        const stored = await chrome.storage.local.get('appwrite_jwt');
        if (stored.appwrite_jwt) {
          clearInterval(pollRef.current);
          setStatus('Login detected! Loading your dashboard...');
          // Signal parent App to re-initialize with the new JWT
          // by triggering a storage change that App.jsx listens to
          chrome.storage.local.set({ login_event: Date.now() });
        }
      } catch (_) {}
    }, 2000);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus('Opening sign-in page...');
      // Open the web app login in a new tab
      const domain = import.meta.env.DEV ? 'http://localhost:5173' : 'https://www.getfolio.tech';
      const extId = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id ? chrome.runtime.id : '';
      const webLoginUrl = `${domain}/login?source=extension${extId ? `&extId=${extId}` : ''}`;
      window.open(webLoginUrl, '_blank');
      setStatus('Waiting for you to sign in...');
      startPolling();
    } catch (err) {
      console.error(err);
      setError('Failed to open sign-in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <GlassCard className="max-w-md w-full p-8 text-center">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Folio</h1>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Your new tab, reimagined</h2>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Sign in to sync your setup across devices.</p>
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {status && (
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {status}
          </p>
        )}
        
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full font-medium transition-all"
          style={{ 
            background: loading ? 'rgba(255,255,255,0.7)' : 'white', 
            color: '#1a1a1a',
          }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
              Waiting for sign-in...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </GlassCard>
    </div>
  );
}
