import React, { useState, useEffect, useCallback } from 'react';
import { Save, ExternalLink, Trash2, Monitor, Clock, Layers } from 'lucide-react';
import { SessionsService } from '../../services/sessions';
import SaveSessionModal from './SaveSessionModal';
import Button from '../UI/Button';

export default function SessionSaver({ userId }) {
  const [sessions, setSessions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [toast, setToast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch sessions on mount ──
  const loadSessions = useCallback(async () => {
    if (!userId) return;
    setLoadingSessions(true);
    try {
      const docs = await SessionsService.fetchSessions(userId);
      setSessions(docs);
    } catch (e) {
      console.error('[SessionSaver] Failed to load sessions:', e);
    } finally {
      setLoadingSessions(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── Show toast ──
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Save session ──
  const handleSaveSession = async (sessionName) => {
    setSaving(true);
    try {
      // Get all tabs in the current window
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const tabData = tabs
        .filter(tab => tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://') && !tab.url.startsWith('brave://'))
        .map(tab => ({
          title: tab.title || 'Untitled',
          url: tab.url,
          favicon: tab.favIconUrl || ''
        }));

      if (tabData.length === 0) {
        showToast('No saveable tabs found in this window', 'error');
        setSaving(false);
        return;
      }

      const doc = await SessionsService.saveSession(userId, sessionName, tabData);
      if (doc) {
        setSessions(prev => [doc, ...prev]);
        showToast(`Saved "${sessionName}" with ${tabData.length} tabs`);
      }
      setModalOpen(false);
    } catch (e) {
      console.error('[SessionSaver] Save failed:', e);
      showToast('Failed to save session', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Open session (restore tabs) ──
  const handleOpenSession = async (session) => {
    try {
      const tabs = JSON.parse(session.tabs);
      const urls = tabs.map(t => t.url).filter(Boolean);

      if (urls.length === 0) {
        showToast('No valid URLs in this session', 'error');
        return;
      }

      if (urls.length <= 20) {
        // Open all at once in a new window
        chrome.windows.create({ url: urls });
      } else {
        // Batch open: first 20 in new window, rest in batches of 10
        const firstBatch = urls.slice(0, 20);
        const remaining = urls.slice(20);

        chrome.windows.create({ url: firstBatch }, (newWindow) => {
          let i = 0;
          const openBatch = () => {
            const batch = remaining.slice(i, i + 10);
            if (batch.length === 0) return;
            batch.forEach(url => {
              chrome.tabs.create({ windowId: newWindow.id, url, active: false });
            });
            i += 10;
            if (i < remaining.length) {
              setTimeout(openBatch, 500);
            }
          };
          setTimeout(openBatch, 500);
        });
      }

      showToast(`Opening ${urls.length} tabs in a new window`);
    } catch (e) {
      console.error('[SessionSaver] Open failed:', e);
      showToast('Failed to open session', 'error');
    }
  };

  // ── Delete session ──
  const handleDeleteSession = async (session) => {
    if (!window.confirm(`Delete "${session.sessionName}"? This cannot be undone.`)) return;

    setDeletingId(session.$id);
    try {
      await SessionsService.deleteSession(session.$id);
      setSessions(prev => prev.filter(s => s.$id !== session.$id));
      showToast(`Deleted "${session.sessionName}"`);
    } catch (e) {
      console.error('[SessionSaver] Delete failed:', e);
      showToast('Failed to delete session', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Helpers ──
  const getTabCount = (session) => {
    try {
      return JSON.parse(session.tabs).length;
    } catch {
      return 0;
    }
  };

  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative z-10 px-4 md:px-8 pb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-color)', opacity: 0.9 }}
          >
            <Monitor size={16} className="text-white" />
          </div>
          <h2
            className="text-sm font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}
          >
            Sessions
          </h2>
          {sessions.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--input-bg)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}
            >
              {sessions.length}
            </span>
          )}
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: 'var(--accent-color)',
            color: 'white',
            boxShadow: '0 2px 12px rgba(220, 38, 38, 0.25)'
          }}
          id="save-session-button"
        >
          <Save size={15} />
          Save Session
        </button>
      </div>

      {/* Sessions Grid */}
      {loadingSessions ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }} />
        </div>
      ) : sessions.length === 0 ? (
        <div
          className="text-center py-8 rounded-2xl border border-dashed"
          style={{ borderColor: 'var(--text-muted)', background: 'var(--input-bg)' }}
        >
          <Monitor size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No saved sessions yet. Save your open tabs to restore them later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sessions.map(session => (
            <div
              key={session.$id}
              className="glass p-4 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.01] group"
              style={{ borderRadius: '20px' }}
            >
              {/* Session Name */}
              <h3
                className="text-sm font-semibold truncate"
                style={{ color: 'var(--text-primary)' }}
                title={session.sessionName}
              >
                {session.sessionName}
              </h3>

              {/* Meta Row */}
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-flex items-center gap-1">
                  <Layers size={12} />
                  {getTabCount(session)} tabs
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  {getRelativeTime(session.createdAt)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-auto pt-1">
                <button
                  onClick={() => handleOpenSession(session)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:brightness-110"
                  style={{
                    background: 'var(--accent-color)',
                    color: 'white'
                  }}
                  id={`open-session-${session.$id}`}
                >
                  <ExternalLink size={13} />
                  Open
                </button>
                <button
                  onClick={() => handleDeleteSession(session)}
                  disabled={deletingId === session.$id}
                  className="p-1.5 rounded-lg transition-all duration-200 opacity-50 group-hover:opacity-100 hover:bg-red-500/20"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Delete session"
                  id={`delete-session-${session.$id}`}
                >
                  {deletingId === session.$id ? (
                    <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Session Modal */}
      <SaveSessionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveSession}
        loading={saving}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium shadow-xl animate-fade-in"
          style={{
            background: toast.type === 'error' ? '#991b1b' : 'var(--accent-color)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
