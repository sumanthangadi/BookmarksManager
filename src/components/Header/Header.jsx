import React from 'react';
import { Settings } from 'lucide-react';
import Clock from './Clock';
import SearchBar from './SearchBar';

export default function Header({ searchQuery, setSearchQuery, onOpenSettings }) {
  return (
    <header className="relative z-10 px-4 md:px-8 pt-6 pb-4 animate-slide-down">
      <div className="max-w-7xl mx-auto">
        {/* Top row: Clock + Settings */}
        <div className="flex items-start justify-between mb-8">
          <Clock />

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 mt-1"
            aria-label="Open settings"
            data-tooltip="Settings"
            id="settings-button"
          >
            <Settings size={22} className="hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        {/* Search bar */}
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>
    </header>
  );
}
