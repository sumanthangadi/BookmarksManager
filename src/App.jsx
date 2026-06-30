import React, { useState, useMemo, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header/Header';
import BookmarkGrid from './components/Bookmarks/BookmarkGrid';
import SessionSaver from './components/Sessions/SessionSaver';
import SettingsModal from './components/Settings/SettingsModal';
import { PRESET_WALLPAPERS } from './utils/constants';
import PaywallScreen from './components/Paywall/PaywallScreen';
import LoginScreen from './components/Auth/LoginScreen';
import { AuthService } from './services/auth';
import { PricingService } from './services/pricing';
import { useTheme } from './context/ThemeContext';
import { setClientJWT, setClientSession, refreshAppwriteSession } from './lib/appwrite';
import { THEMES } from './styles/themes';

function Dashboard({ trialStatus, onLogout, userId }) {
  const { state, updateSettings, isLoaded } = useApp();
  const { themeId } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Compute wallpaper background style
  const wallpaperStyle = useMemo(() => {
    if (THEMES[themeId]?.disableWallpaper) {
      return null;
    }

    if (state.settings.wallpaperId === 'pexels' && state.settings.pexelsData) {
       return { backgroundImage: `url(${state.settings.pexelsData.url})` };
    }

    if (state.settings.customWallpaper) {
      return { backgroundImage: `url(${state.settings.customWallpaper})` };
    }

    const preset = PRESET_WALLPAPERS.find((w) => w.id === state.settings.wallpaperId);
    if (preset) {
      return { background: preset.value };
    }

    return null;
  }, [themeId, state.settings.wallpaperId, state.settings.customWallpaper, state.settings.pexelsData]);

  // Prevent mock default bookmarks/layouts from rendering before storage load completes
  if (!isLoaded) {
    return <div className="min-h-screen animate-fade-in" style={{ background: 'var(--bg-primary)' }} />;
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Wallpaper Background */}
      {wallpaperStyle && (
        <div
          className={`wallpaper-bg ${state.settings.customWallpaper ? '' : ''}`}
          style={wallpaperStyle}
        />
      )}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col" style={{ background: wallpaperStyle ? 'transparent' : 'var(--bg-primary)' }}>
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogout={onLogout}
          trialStatus={trialStatus}
        />
        <main className="flex-1 flex flex-col">
          <BookmarkGrid searchQuery={searchQuery} />
          <SessionSaver userId={userId} />
        </main>

        {/* Footer */}
        <footer className="relative z-10 px-4 py-4 text-center space-y-2">
          {state.settings.wallpaperId === 'pexels' && state.settings.pexelsData && (
            <p className="text-[10px] animate-fade-in" style={{ color: 'var(--text-muted)' }}>
              Photo by{' '}
              <a 
                href={state.settings.pexelsData.photographerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-color)' }}
                className="hover:underline"
              >
                {state.settings.pexelsData.photographer}
              </a>{' '}
              on{' '}
              <a 
                href="https://www.pexels.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-color)' }}
                className="hover:underline"
              >
                Pexels
              </a>
            </p>
          )}
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Folio — Press{' '}
            <kbd 
              className="px-1.5 py-0.5 rounded border font-mono text-[10px]"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}
            >
              Ctrl+K
            </kbd>{' '}
            to search
          </p>
        </footer>
      </div>

      {/* Tutorial Modal */}
      {isLoaded && state.settings.hasSeenTutorial === false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass p-10 max-w-md w-full relative shadow-[0_0_60px_rgba(0,0,0,0.6)] border border-white/10 rounded-[2rem] text-center">
            <div className="w-20 h-20 mx-auto bg-brand-600/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-brand-500/10">
              <span className="text-4xl animate-bounce">👋</span>
            </div>
            
            <h3 className="font-bold text-white mb-8 text-2xl">
              Welcome to Folio
            </h3>
            
            <div className="flex flex-col gap-4 mb-10 text-left">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border border-white/20 bg-white/5 text-brand-400 font-bold text-xl mt-0.5 animate-pulse">
                  <span className="block w-full text-center leading-none transform translate-y-[1.5px]">1</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base">Pin the Extension</h4>
                  <p className="text-gray-300 text-sm mt-1 leading-relaxed">Pin the Extension :pin the extnsion to quickly add the extension, </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border border-white/20 bg-white/5 text-brand-400 font-bold text-xl mt-0.5 animate-pulse">
                  <span className="block w-full text-center leading-none transform translate-y-[1.5px]">2</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base">the shortcut :</h4>
                  <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                    Just press : <kbd className="px-2.5 py-1 rounded border border-white/20 bg-black/40 font-mono text-sm text-white">Ctrl+Shift+K</kbd> to quickly add the extension
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => updateSettings({ hasSeenTutorial: true })}
              className="w-full btn-primary py-4 text-base font-bold rounded-2xl shadow-lg hover:shadow-brand-500/25"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  const [trialStatus, setTrialStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initApp() {
      try {
        let stored = { appwrite_jwt: null, folio_auth: null, appwrite_session: null };
        if (typeof chrome !== 'undefined' && chrome.storage) {
          stored = await chrome.storage.local.get([
            'appwrite_jwt', 'folio_auth', 'appwrite_session'
          ]);

          // If we have a persistent auth record, show the user instantly in the UI
          if (stored.folio_auth && stored.folio_auth.user) {
            setUser(stored.folio_auth.user);
            setTrialStatus(stored.folio_auth.trialStatus || null);
            setLoading(false); // hide spinner immediately
          }
        }

        // Try to authenticate using the session/cookie first
        let currentUser = null;

        console.log('[Auth] Restoring session...');
        const hasSession = await refreshAppwriteSession();
        if (hasSession) {
          currentUser = await AuthService.getCurrentUser();
          if (currentUser) {
            console.log('[Auth] Authenticated successfully via session/cookie.');
          } else {
            console.warn('[Auth] Session/cookie was found but returned 401. Clearing invalid session.');
            // Clear invalid session hash from client and storage
            const { client } = await import('./lib/appwrite');
            delete client.headers['X-Appwrite-Session'];
            delete client.headers['X-Fallback-Cookies'];
            if (typeof chrome !== 'undefined' && chrome.storage) {
              chrome.storage.local.remove('appwrite_session');
            }
          }
        }

        // Fallback to JWT if session authentication failed
        if (!currentUser && stored.appwrite_jwt) {
          console.log('[Auth] Session failed or not found. Trying JWT fallback...');
          setClientJWT(stored.appwrite_jwt);
          currentUser = await AuthService.getCurrentUser();
          if (currentUser) {
            console.log('[Auth] Authenticated successfully via JWT.');
          } else {
            console.warn('[Auth] JWT was found but returned 401. Clearing invalid JWT.');
            if (typeof chrome !== 'undefined' && chrome.storage) {
              chrome.storage.local.remove('appwrite_jwt');
            }
          }
        }

        if (currentUser) {
          // Session or JWT is valid — update cache with fresh data
          setUser(currentUser);
          const status = await PricingService.getUserStatus(currentUser.$id);
          setTrialStatus(status);
          
          // Persist the auth record for next startup
          if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({
              folio_auth: { user: currentUser, trialStatus: status }
            });
          }
        } else {
          // Both session and JWT failed. Check if we have a persisted paid/active trial user to stay logged in offline.
          if (stored.folio_auth) {
            const auth = stored.folio_auth;
            if (auth.user && auth.trialStatus && (auth.trialStatus.paid || auth.trialStatus.trialActive)) {
              console.log('[Folio] Credentials expired but user has active subscription/trial — staying logged in (offline mode)');
              setUser(auth.user);
              setTrialStatus(auth.trialStatus);
            } else {
              // No valid trial/subscription, log out
              if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.remove(['appwrite_jwt', 'appwrite_session', 'folio_auth']);
              }
              setUser(null);
              setTrialStatus(null);
            }
          } else {
            setUser(null);
            setTrialStatus(null);
          }
        }
      } catch (e) {
        console.error('App init failed', e);
        // On error, still try to use persisted auth so we don't log out
        if (typeof chrome !== 'undefined' && chrome.storage) {
          try {
            const stored = await chrome.storage.local.get('folio_auth');
            if (stored.folio_auth && stored.folio_auth.user) {
              setUser(stored.folio_auth.user);
              setTrialStatus(stored.folio_auth.trialStatus || null);
            }
          } catch (_) {}
        }
      } finally {
        setLoading(false);
      }
    }

    initApp();

    // Listen for SET_JWT message from the web login page
    const handleMessage = (request, sender, sendResponse) => {
      if (request.type === 'SET_JWT' && request.jwt) {
        console.log('[Extension] Received auth message from web app');
        // Store JWT + session hash in chrome.storage.local
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const toStore = { appwrite_jwt: request.jwt };
          if (request.session) {
            toStore.appwrite_session = request.session;
          }
          chrome.storage.local.set(toStore);
        }
        // Apply session hash first (long-lived), then JWT as backup
        if (request.session) {
          setClientSession(request.session);
        }
        setClientJWT(request.jwt);
        // Re-initialize the app
        initApp();
        sendResponse({ ok: true });
      } else if (request.type === 'LOGIN_SUCCESS' || request.type === 'PAYMENT_SUCCESS') {
        initApp();
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessageExternal) {
      chrome.runtime.onMessageExternal.addListener(handleMessage);
    }

    // Also listen for storage changes — triggered when background.js stores the JWT
    const handleStorageChange = (changes, area) => {
      if (area === 'local' && (changes.appwrite_jwt || changes.login_event)) {
        console.log('[Extension] Storage changed, re-initializing...');
        initApp();
      }
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessageExternal) {
        chrome.runtime.onMessageExternal.removeListener(handleMessage);
      }
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  const handleLogout = async () => {
    // Explicit logout — clear everything
    try {
      await AuthService.logout();
    } catch (_) {}
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(['appwrite_jwt', 'appwrite_session', 'folio_auth']);
    }
    setUser(null);
    setTrialStatus(null);
  };

  const handleLoginSuccess = async (newUser) => {
    setUser(newUser);
    setLoading(true);
    const status = await PricingService.getUserStatus(newUser.$id);
    setTrialStatus(status);
    // Persist auth so user survives restarts
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({
        folio_auth: { user: newUser, trialStatus: status }
      });
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-8 h-8 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Not logged in -> Show Login
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Trial expired and not paid -> Show Paywall
  if (trialStatus && !trialStatus.paid && !trialStatus.trialActive) {
    return <PaywallScreen user={user} pricing={trialStatus} />;
  }

  // Main Dashboard
  return (
    <AppProvider user={user}>
      <Dashboard trialStatus={trialStatus} onLogout={handleLogout} userId={user.$id} />
    </AppProvider>
  );
}
