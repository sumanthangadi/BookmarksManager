import React, { useState } from 'react';
import {
  Image,
  Download,
  RefreshCw,
  RotateCcw,
  Clock,
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
import { useTheme } from '../../context/ThemeContext';
import { THEMES } from '../../styles/themes';

export default function SettingsModal({ isOpen, onClose }) {
  const { state, updateSettings, importBookmarks, resetAll } = useApp();
  const { themeId, setTheme } = useTheme();
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

  const sectionLabelStyle = { color: 'var(--text-primary)', fontWeight: '600' };
  const descriptionStyle = { color: 'var(--text-secondary)', fontSize: '0.875rem' };
  const dividerStyle = { borderColor: 'var(--glass-border)', opacity: 0.5 };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" maxWidth="max-w-2xl">
      <div className="space-y-8">
        {/* ───── Theme ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Image size={16} style={{ color: 'var(--accent-color)' }} />
            <h4 className="text-sm font-medium" style={sectionLabelStyle}>Theme</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(THEMES).map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all min-h-[48px]"
                style={
                  themeId === themeOption.id
                    ? { border: '2px solid var(--accent-color)', background: 'var(--bg-secondary)' }
                    : { border: '1px solid var(--glass-border)', background: 'var(--input-bg)' }
                }
              >
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{themeOption.name}</span>
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full border border-gray-600" style={{ backgroundColor: themeOption.colors['--bg-primary'] }} />
                  <div className="w-4 h-4 rounded-full border border-gray-600" style={{ backgroundColor: themeOption.colors['--glass-bg'] }} />
                  <div className="w-4 h-4 rounded-full border border-gray-600" style={{ backgroundColor: themeOption.colors['--accent-color'] }} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <hr style={dividerStyle} />

        {/* ───── Wallpaper ───── */}
        {THEMES[themeId]?.disableWallpaper ? (
          <section className="space-y-3 opacity-50 pointer-events-none">
            <h4 className="text-sm font-medium" style={sectionLabelStyle}>Wallpaper</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Wallpapers are disabled for the {THEMES[themeId]?.name} theme to maintain its signature clean look.</p>
          </section>
        ) : (
          <section>
            <WallpaperPicker themeId={themeId} />
          </section>
        )}

        <hr style={dividerStyle} />

        {/* ───── User Name ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <User size={16} style={{ color: 'var(--accent-color)' }} />
            <h4 className="text-sm font-medium" style={sectionLabelStyle}>Your Name</h4>
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

        <hr style={dividerStyle} />

        {/* ───── Clock Settings ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--accent-color)' }} />
            <h4 className="text-sm font-medium" style={sectionLabelStyle}>Clock</h4>
          </div>
          <div className="flex flex-wrap gap-4">
            {['12h', '24h'].map(format => (
              <label key={format} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="clockFormat"
                  value={format}
                  checked={state.settings.clockFormat === format}
                  onChange={() => updateSettings({ clockFormat: format })}
                  className="accent-brand-500"
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <span className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  {format === '12h' ? '12-hour' : '24-hour'}
                </span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={state.settings.showSeconds}
                onChange={(e) => updateSettings({ showSeconds: e.target.checked })}
                className="accent-brand-500"
                style={{ accentColor: 'var(--accent-color)' }}
              />
              <span className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Show seconds
              </span>
            </label>
          </div>
        </section>

        <hr style={dividerStyle} />



        {/* ───── Toggles ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye size={16} style={{ color: 'var(--accent-color)' }} />
            <h4 className="text-sm font-medium" style={sectionLabelStyle}>Display</h4>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Show greeting', key: 'showGreeting' },
              { label: 'Open links in new tab', key: 'openInNewTab' }
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer group py-1">
                <span className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  {item.label}
                </span>
                <input
                  type="checkbox"
                  checked={state.settings[item.key]}
                  onChange={(e) => updateSettings({ [item.key]: e.target.checked })}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--accent-color)' }}
                />
              </label>
            ))}
          </div>
        </section>

        <hr style={dividerStyle} />

        {/* ───── Import Bookmarks ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Download size={16} style={{ color: 'var(--accent-color)' }} />
            <h4 className="text-sm font-medium" style={sectionLabelStyle}>Import Browser Bookmarks</h4>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
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

        <hr style={dividerStyle} />

        {/* ───── Reset ───── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-red-400" />
            <h4 className="text-sm font-medium" style={sectionLabelStyle}>Reset All Data</h4>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
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

        <hr style={dividerStyle} />

        {/* ───── About ───── */}
        <section className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Info size={14} />
          <span>Folio v1.0.0 — Your premium new tab dashboard</span>
        </section>
      </div>
    </Modal>
  );
}
