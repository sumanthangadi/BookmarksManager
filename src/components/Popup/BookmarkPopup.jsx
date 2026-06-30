import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, Bookmark, Plus, ExternalLink, ChevronDown, FolderPlus, X, Laptop } from 'lucide-react';
import * as Icons from 'lucide-react';
import Button from '../UI/Button';
import { isBookmarksApiAvailable } from '../../utils/bookmarkImporter';
import { SessionsService } from '../../services/sessions';
import { AuthService } from '../../services/auth';

export default function BookmarkPopup() {
  const { state, addBookmark, addSection, saveStateNow, isLoaded } = useApp();
  const [activeTab, setActiveTab] = useState('bookmark'); // 'bookmark' or 'session'
  
  // Bookmark tab states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const dropdownRef = useRef(null);

  // Session tab states
  const [user, setUser] = useState(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [openTabs, setOpenTabs] = useState([]);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    // 1. Get current tab information for single bookmark tab
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

      // Get all tabs in current window for session saving
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const validTabs = tabs
          .filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('about:'))
          .map(t => ({
            title: t.title || 'Untitled',
            url: t.url,
            favicon: t.favIconUrl || ''
          }));
        setOpenTabs(validTabs);
      });
    } else {
      // Fallback for development/preview
      setTitle('Example Page');
      setUrl('https://example.com');
      setOpenTabs([
        { title: 'Example Page', url: 'https://example.com', favicon: '' },
        { title: 'Google', url: 'https://google.com', favicon: '' },
        { title: 'Appwrite', url: 'https://appwrite.io', favicon: '' }
      ]);
    }

    // 2. Initialize default session name
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setSessionName(`Session - ${dateStr}, ${timeStr}`);

    // 3. Load user & authenticate Appwrite client in popup context
    async function initPopupAuth() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const stored = await chrome.storage.local.get(['appwrite_jwt', 'folio_auth', 'appwrite_session']);
          
          const { refreshAppwriteSession, setClientJWT, client } = await import('../../lib/appwrite');

          let currentUser = null;
          const hasSession = await refreshAppwriteSession();
          
          if (hasSession) {
            currentUser = await AuthService.getCurrentUser();
            if (!currentUser) {
              // Session expired/invalid! Clear it.
              delete client.headers['X-Appwrite-Session'];
              delete client.headers['X-Fallback-Cookies'];
              await chrome.storage.local.remove('appwrite_session');
            }
          }

          // Fallback to JWT if session failed
          if (!currentUser && stored.appwrite_jwt) {
            setClientJWT(stored.appwrite_jwt);
            currentUser = await AuthService.getCurrentUser();
            if (!currentUser) {
              // JWT expired/invalid! Clear it.
              await chrome.storage.local.remove('appwrite_jwt');
            }
          }

          if (currentUser) {
            setUser(currentUser);
          } else if (stored.folio_auth && stored.folio_auth.user) {
            // Offline fallback (read-only for UI representation)
            setUser(stored.folio_auth.user);
          }
        }
      } catch (e) {
        console.error('[Popup] Auth init failed:', e);
      } finally {
        setIsAuthLoaded(true);
      }
    }
    initPopupAuth();
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
    if (!user) {
      setSessionError('Please sign in to Folio to save sessions.');
      return;
    }
    if (!sessionName.trim()) {
      setSessionError('Please provide a session name.');
      return;
    }
    if (openTabs.length === 0) {
      setSessionError('No open tabs found to save.');
      return;
    }

    setIsSavingSession(true);
    setSessionError('');

    try {
      await SessionsService.saveSession(user.$id, sessionName.trim(), openTabs);
      setSessionSaved(true);
      setTimeout(() => {
        window.close();
      }, 1200);
    } catch (err) {
      setSessionError(err?.message || 'Failed to save session.');
      setIsSavingSession(false);
    }
  };

  const selectedSection = state.sections.find(s => s.id === sectionId) || state.sections[0];
  const SelectedIcon = selectedSection ? (Icons[selectedSection.icon] || Icons.Folder) : Icons.Folder;

  if (!isLoaded) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] text-white min-h-[250px]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] text-white min-h-[250px]">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 animate-bounce">
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
      <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] text-white min-h-[250px]">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 animate-bounce">
          <Check size={32} />
        </div>
        <h2 className="text-xl font-bold">Session Saved!</h2>
        <p className="text-gray-400 text-sm text-center">
          Saved {openTabs.length} tabs as "{sessionName}"
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] text-white min-h-[250px]">
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
    <div className="p-4 bg-[#0a0a0a] text-white min-h-[340px] flex flex-col">
      {/* Tab Selector Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-lg w-full">
          <button
            onClick={() => setActiveTab('bookmark')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex-1 ${
              activeTab === 'bookmark'
                ? 'bg-brand-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bookmark size={14} />
            Bookmark Page
          </button>
          <button
            onClick={() => setActiveTab('session')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex-1 ${
              activeTab === 'session'
                ? 'bg-brand-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Laptop size={14} />
            Save Session
          </button>
        </div>
      </div>

      {activeTab === 'bookmark' ? (
        /* Add Bookmark Form */
        <div className="flex flex-col flex-1">
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
                    <div className="absolute bottom-full mb-2 left-0 right-0 glass border border-white/10 shadow-2xl max-h-40 overflow-y-auto custom-scrollbar animate-fade-in z-50">
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
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-white/5 ${
                              sectionId === section.id ? 'bg-brand-600/10 text-brand-400' : 'text-gray-300'
                            }`}
                          >
                            <SectionIcon size={14} />
                            <span className="truncate">{section.name}</span>
                            {sectionId === section.id && <Check size={12} className="ml-auto" />}
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
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-brand-600/20 text-brand-400"
                      >
                        <FolderPlus size={14} />
                        <span>Create New Section</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="ghost" onClick={() => window.close()} className="flex-1">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave} 
              className="flex-1" 
              icon={Plus}
              disabled={isCreatingSection && !newSectionName.trim()}
            >
              Add Bookmark
            </Button>
          </div>
        </div>
      ) : (
        /* Save Session Form */
        <div className="flex flex-col flex-1">
          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">Session Name</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="glass-input w-full py-2 px-3 text-sm"
                placeholder="Session Name"
              />
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Tabs to save</span>
                <span className="font-semibold text-white">{openTabs.length} tabs</span>
              </div>
              
              {openTabs.length > 0 && (
                <div className="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {openTabs.slice(0, 5).map((tab, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-gray-400 truncate">
                      {tab.favicon ? (
                        <img 
                          src={tab.favicon} 
                          alt="" 
                          className="w-3.5 h-3.5 object-contain" 
                          onError={(e) => e.target.style.display = 'none'} 
                        />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded bg-white/10 flex items-center justify-center text-[8px] flex-shrink-0">
                          {idx + 1}
                        </div>
                      )}
                      <span className="truncate flex-1">{tab.title}</span>
                    </div>
                  ))}
                  {openTabs.length > 5 && (
                    <div className="text-[10px] text-gray-500 text-center pt-0.5">
                      and {openTabs.length - 5} more tabs...
                    </div>
                  )}
                </div>
              )}
            </div>

            {sessionError && (
              <div className="p-2.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-400 text-center">
                {sessionError}
              </div>
            )}

            {!user && isAuthLoaded && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 text-center">
                Please login on the dashboard to enable saving sessions.
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="ghost" onClick={() => window.close()} className="flex-1">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveSession} 
              className="flex-1" 
              icon={Check}
              disabled={isSavingSession || !user || openTabs.length === 0}
            >
              {isSavingSession ? 'Saving...' : 'Save Session'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
