import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, Bookmark, Plus, ExternalLink, ChevronDown, FolderPlus, X, History, LogIn, Laptop } from 'lucide-react';
import * as Icons from 'lucide-react';
import Button from '../UI/Button';
import { isBookmarksApiAvailable } from '../../utils/bookmarkImporter';

export default function BookmarkPopup() {
  const { state, addBookmark, addSection, saveStateNow, isLoaded } = useApp();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  
  // Tabs and auth state
  const [activeTab, setActiveTab] = useState('bookmark'); // 'bookmark' or 'session'
  const [user, setUser] = useState(null);
  const [sessionName, setSessionName] = useState('');
  const [tabCount, setTabCount] = useState(0);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    // 1. Get current tab information for bookmarking
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab) {
          // Don't allow saving internal chrome pages
          if (currentTab.url?.startsWith('chrome://') || currentTab.url?.startsWith('about:')) {
            setError('Cannot bookmark internal browser pages.');
            return;
          }
          setTitle(currentTab.title || '');
          setUrl(currentTab.url || '');
        }
      });

      // 2. Query total open tabs in current window for session saving
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const validTabs = tabs.filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('about:'));
        setTabCount(validTabs.length);
      });
    } else {
      // Fallback for development/preview
      setTitle('Example Page');
      setUrl('https://example.com');
      setTabCount(5);
    }

    // 3. Retrieve user profile
    const fetchUser = async () => {
      try {
        const { refreshAppwriteSession, setClientJWT } = await import('../../lib/appwrite');
        await refreshAppwriteSession();

        const { AuthService } = await import('../../services/auth');
        let currentUser = await AuthService.getCurrentUser();

        // Fallback to JWT if session authentication failed
        if (!currentUser && typeof chrome !== 'undefined' && chrome.storage) {
          const stored = await chrome.storage.local.get('appwrite_jwt');
          if (stored.appwrite_jwt) {
            setClientJWT(stored.appwrite_jwt);
            currentUser = await AuthService.getCurrentUser();
          }
        }

        if (currentUser) {
          setUser(currentUser);
        }
      } catch (_) {}
    };
    fetchUser();

    // 4. Prefill session name
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSessionName(`Session - ${timeString}`);
  }, []);

  // Update default section when sections load
  useEffect(() => {
    if (isLoaded && state.sections.length > 0 && !sectionId && !isCreatingSection) {
      setSectionId(state.sections[0].id);
    }
  }, [isLoaded, state.sections, sectionId, isCreatingSection]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!title || !url) return;
    
    let targetSectionId = sectionId;
    let updatedSections = state.sections;

    if (isCreatingSection && newSectionName.trim()) {
      const newSec = await addSection({
        name: newSectionName.trim(),
        icon: 'Folder'
      });
      targetSectionId = newSec.id;
      
      const fullNewSec = { ...newSec, order: state.sections.length };
      updatedSections = [...state.sections, fullNewSec];
    } else if (!targetSectionId) {
      return; // No section selected
    }

    const newBookmark = await addBookmark({
      title,
      url,
      sectionId: targetSectionId,
    });

    if (!isBookmarksApiAvailable()) {
      const updatedBookmarks = [...state.bookmarks, { ...newBookmark, id: newBookmark.id || `bm_${Date.now()}` }];
      await saveStateNow({
        ...state,
        sections: updatedSections,
        bookmarks: updatedBookmarks
      });
    }

    setIsSaved(true);
    setTimeout(() => {
      window.close();
    }, 1200);
  };

  const handleSaveSession = async () => {
    if (!user) return;
    if (!sessionName.trim()) {
      setError('Please enter a session name.');
      return;
    }

    setIsSavingSession(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ currentWindow: true }, async (tabs) => {
          const validTabs = tabs
            .filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('about:'))
            .map(t => ({
              title: t.title || 'Untitled',
              url: t.url,
              favicon: t.favIconUrl || ''
            }));

          if (validTabs.length === 0) {
            setError('No valid web pages to save in this window.');
            setIsSavingSession(false);
            return;
          }

          const { SessionsService } = await import('../../services/sessions');
          await SessionsService.saveSession(user.$id, sessionName.trim(), validTabs);

          setSessionSaved(true);
          setTimeout(() => {
            window.close();
          }, 1200);
        });
      } else {
        // Dev fallback
        const mockTabs = [
          { title: 'Google', url: 'https://google.com', favicon: '' },
          { title: 'GitHub', url: 'https://github.com', favicon: '' }
        ];
        const { SessionsService } = await import('../../services/sessions');
        await SessionsService.saveSession(user.$id, sessionName.trim(), mockTabs);
        setSessionSaved(true);
        setTimeout(() => {
          window.close();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to save session');
      setIsSavingSession(false);
    }
  };

  const handleLogin = async () => {
    try {
      const { AuthService } = await import('../../services/auth');
      await AuthService.loginWithGoogle();
      window.close();
    } catch (_) {}
  };

  const selectedSection = state.sections.find(s => s.id === sectionId) || state.sections[0];
  const SelectedIcon = selectedSection ? (Icons[selectedSection.icon] || Icons.Folder) : Icons.Folder;

  if (!isLoaded) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] text-white min-h-[300px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] text-white min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 animate-bounce">
          <Check size={32} />
        </div>
        <h2 className="text-xl font-bold">Bookmark Added!</h2>
        <p className="text-gray-400 text-sm">
          Saved to {isCreatingSection ? newSectionName : (selectedSection?.name || 'Bookmarks')}
        </p>
      </div>
    );
  }

  if (sessionSaved) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] text-white min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 animate-bounce">
          <Check size={32} />
        </div>
        <h2 className="text-xl font-bold">Session Saved!</h2>
        <p className="text-gray-400 text-sm">
          Saved session "{sessionName}"
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] text-white min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
          <Bookmark size={32} />
        </div>
        <h2 className="text-xl font-bold">Oops!</h2>
        <p className="text-gray-400 text-sm text-center">{error}</p>
        <Button variant="ghost" onClick={() => window.close()} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#0a0a0a] text-white min-h-[330px] w-[320px] flex flex-col">
      {/* Header Tab Bar */}
      <div className="flex border-b border-white/10 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('bookmark')}
          className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'bookmark'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Bookmark size={14} />
          Add Bookmark
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('session')}
          className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'session'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <History size={14} />
          Save Session
        </button>
      </div>

      {activeTab === 'bookmark' ? (
        /* BOOKMARK TAB CONTENT */
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input w-full py-2 px-3 text-sm"
                placeholder="Bookmark Title"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">URL</label>
              <div className="relative">
                <input
                  type="text"
                  value={url}
                  readOnly
                  className="glass-input w-full py-2 pl-3 pr-8 text-sm opacity-60 cursor-not-allowed"
                  placeholder="https://..."
                />
                <ExternalLink size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="space-y-1.5" ref={dropdownRef}>
              <label className="text-xs font-medium text-gray-400 ml-1">Save to Section</label>
              
              {isCreatingSection ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Enter new section name"
                    className="glass-input flex-1 py-2 px-3 text-sm"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      setIsCreatingSection(false);
                      setNewSectionName('');
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Cancel creating section"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="glass-input w-full py-2 px-3 text-sm bg-[#1a1a1a] text-white flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      {SelectedIcon && <SelectedIcon size={16} className="text-brand-400" />}
                      <span>{selectedSection?.name || 'Select Section'}</span>
                    </div>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-50 bottom-full mb-2 left-0 right-0 glass border border-white/10 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar animate-fade-in">
                      {state.sections.map((section) => {
                        const SectionIcon = Icons[section.icon] || Icons.Folder;
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => {
                              setSectionId(section.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5 ${
                              sectionId === section.id ? 'bg-brand-600/10 text-brand-400' : 'text-gray-300'
                            }`}
                          >
                            <SectionIcon size={16} />
                            <span className="truncate">{section.name}</span>
                            {sectionId === section.id && <Check size={14} className="ml-auto" />}
                          </button>
                        );
                      })}
                      
                      <div className="h-px bg-white/10 my-1 mx-2"></div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingSection(true);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-brand-600/20 text-brand-400"
                      >
                        <FolderPlus size={16} />
                        <span>Create New Section</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-2">
            <Button variant="ghost" onClick={() => window.close()} className="flex-1 text-xs py-2">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave} 
              className="flex-1 text-xs py-2" 
              icon={Plus}
              disabled={isCreatingSection && !newSectionName.trim()}
            >
              Add Bookmark
            </Button>
          </div>
        </div>
      ) : (
        /* SESSION TAB CONTENT */
        <div className="flex-1 flex flex-col justify-between">
          {!user ? (
            /* Logged out state */
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-6">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                <Laptop size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Sign in Required</h3>
                <p className="text-xs text-gray-400 max-w-[220px]">
                  Sign in to your Folio account to sync and save window sessions.
                </p>
              </div>
              <Button 
                variant="primary" 
                onClick={handleLogin} 
                className="w-full text-xs py-2 mt-2 bg-brand-600 hover:bg-brand-500"
                icon={LogIn}
              >
                Log In with Google
              </Button>
            </div>
          ) : (
            /* Logged in state */
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4 flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 ml-1">Session Name</label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="glass-input w-full py-2 px-3 text-sm"
                    placeholder="Enter session name"
                  />
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider">Session Scope</div>
                  <p className="text-xs text-gray-300">
                    This will save all <strong className="text-white font-bold">{tabCount}</strong> open tabs in this window. You can restore them anytime in a new window from your dashboard.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex gap-2">
                <Button variant="ghost" onClick={() => window.close()} className="flex-1 text-xs py-2">
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSaveSession} 
                  className="flex-1 text-xs py-2" 
                  icon={isSavingSession ? null : Plus}
                  disabled={isSavingSession || !sessionName.trim()}
                >
                  {isSavingSession ? 'Saving...' : 'Save Session'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
