import React, { useState } from 'react';
import {
  Image,
  Download,
  RefreshCw,
  RotateCcw,
  Clock,
  Search,
  Eye,
  StickyNote,
  User,
  Info,
} from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import WallpaperPicker from '../Wallpaper/WallpaperPicker';
import { useApp } from '../../context/AppContext';
import { importBrowserBookmarks, isBookmarksApiAvailable } from '../../utils/bookmarkImporter';
import { SEARCH_ENGINES } from '../../utils/constants';

export default function SettingsModal({ isOpen, onClose }) {
  const { state, updateSettings, importBookmarks, resetAll } = useApp();
  const [importStatus, setImportStatus] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const bookmarksAvailable = isBookmarksApiAvailable();

  const handleImportBookmarks = async () => {
    setImportStatus('loading');
    try {
      const data = await importBrowserBookmarks();
      importBookmarks(data);
      setImportStatus(`✓ Synced ${data.bookmarks.length} bookmarks in ${data.sections.length} sections`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err) {
      setImportStatus('Error: ' + err.message);
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  const handleReset = () => {
    if (confirmReset) {
      resetAll();
      setConfirmReset(false);
      onClose();
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" maxWidth="max-w-2xl">
      <div className="space-y-8">
        {/* ───── Wallpaper ───── */}
        <section>
          <WallpaperPicker />
        </section>

        <hr className="border-white/5" />

        {/* ───── User Name ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-brand-400" />
            <h4 className="text-sm font-medium text-gray-300">Your Name</h4>
          </div>
          <input
            type="text"
            value={state.settings.userName || ''}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            placeholder="Enter your name for personalized greeting"
            className="glass-input w-full py-2.5 px-4 text-sm"
            id="settings-username"
          />
        </section>

        <hr className="border-white/5" />

        {/* ───── Clock Settings ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-brand-400" />
            <h4 className="text-sm font-medium text-gray-300">Clock</h4>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="clockFormat"
                value="12h"
                checked={state.settings.clockFormat === '12h'}
                onChange={() => updateSettings({ clockFormat: '12h' })}
                className="accent-brand-500"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                12-hour
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="clockFormat"
                value="24h"
                checked={state.settings.clockFormat === '24h'}
                onChange={() => updateSettings({ clockFormat: '24h' })}
                className="accent-brand-500"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                24-hour
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={state.settings.showSeconds}
                onChange={(e) => updateSettings({ showSeconds: e.target.checked })}
                className="accent-brand-500"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                Show seconds
              </span>
            </label>
          </div>
        </section>

        <hr className="border-white/5" />

        {/* ───── Search Engine ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-brand-400" />
            <h4 className="text-sm font-medium text-gray-300">Search Engine</h4>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(SEARCH_ENGINES).map(([key, engine]) => (
              <label
                key={key}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all text-sm
                  ${state.settings.searchEngine === key
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                    : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-gray-200'
                  }
                `}
              >
                <input
                  type="radio"
                  name="searchEngine"
                  value={key}
                  checked={state.settings.searchEngine === key}
                  onChange={() => updateSettings({ searchEngine: key })}
                  className="hidden"
                />
                {engine.name}
              </label>
            ))}
          </div>
        </section>

        <hr className="border-white/5" />

        {/* ───── Toggles ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-brand-400" />
            <h4 className="text-sm font-medium text-gray-300">Display</h4>
          </div>
          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer group py-1">
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                Show greeting
              </span>
              <input
                type="checkbox"
                checked={state.settings.showGreeting}
                onChange={(e) => updateSettings({ showGreeting: e.target.checked })}
                className="accent-brand-500 w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer group py-1">
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                Show quick notes
              </span>
              <input
                type="checkbox"
                checked={state.settings.showNotes}
                onChange={(e) => updateSettings({ showNotes: e.target.checked })}
                className="accent-brand-500 w-4 h-4"
              />
            </label>
          </div>
        </section>

        <hr className="border-white/5" />

        {/* ───── Import Bookmarks ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-brand-400" />
            <h4 className="text-sm font-medium text-gray-300">Import Browser Bookmarks</h4>
          </div>
          <p className="text-xs text-gray-500">
            Import your existing Chrome/Brave bookmarks. Folder names become sections.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="glass"
              onClick={handleImportBookmarks}
              loading={importStatus === 'loading'}
              icon={Download}
            >
              Import Bookmarks
            </Button>
            {importStatus && importStatus !== 'loading' && (
              <span className={`text-xs animate-fade-in ${importStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {importStatus}
              </span>
            )}
          </div>
        </section>

        <hr className="border-white/5" />

        {/* ───── Reset ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-red-400" />
            <h4 className="text-sm font-medium text-gray-300">Reset All Data</h4>
          </div>
          <p className="text-xs text-gray-500">
            This will delete all your bookmarks, notes, and settings. This cannot be undone.
          </p>
          <Button
            variant="danger"
            onClick={handleReset}
            icon={RotateCcw}
          >
            {confirmReset ? 'Click again to confirm' : 'Reset Everything'}
          </Button>
        </section>

        <hr className="border-white/5" />

        {/* ───── About ───── */}
        <section className="flex items-center gap-3 text-xs text-gray-600">
          <Info size={14} />
          <span>BookMarks Manager v1.0.0 — Your premium new tab dashboard</span>
        </section>
      </div>
    </Modal>
  );
}
