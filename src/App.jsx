import React, { useState, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header/Header';
import BookmarkGrid from './components/Bookmarks/BookmarkGrid';
import QuickNotes from './components/Notes/QuickNotes';
import SettingsModal from './components/Settings/SettingsModal';
import HabitTrackerWidget from './components/Habits/HabitTrackerWidget';
import { PRESET_WALLPAPERS } from './utils/constants';

function Dashboard() {
  const { state } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Compute wallpaper background style
  const wallpaperStyle = useMemo(() => {
    if (state.settings.customWallpaper) {
      return { backgroundImage: `url(${state.settings.customWallpaper})` };
    }

    const preset = PRESET_WALLPAPERS.find((w) => w.id === state.settings.wallpaperId);
    if (preset) {
      return { background: preset.value };
    }

    return { background: PRESET_WALLPAPERS[0].value };
  }, [state.settings.wallpaperId, state.settings.customWallpaper]);

  return (
    <div className="relative min-h-screen">
      {/* Wallpaper Background */}
      <div
        className={`wallpaper-bg ${state.settings.customWallpaper ? '' : ''}`}
        style={wallpaperStyle}
      />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <main className="flex-1 flex flex-col">
          <BookmarkGrid searchQuery={searchQuery} />
          {!searchQuery && <HabitTrackerWidget />}
        </main>

        {/* Footer */}
        <footer className="relative z-10 px-4 py-4 text-center">
          <p className="text-[11px] text-gray-700">
            BookMarks Manager — Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-500 font-mono text-[10px]">
              Ctrl+K
            </kbd>{' '}
            to search
          </p>
        </footer>
      </div>

      {/* Quick Notes Widget */}
      <QuickNotes />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
