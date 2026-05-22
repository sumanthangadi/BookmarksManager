import React from 'react';
import { Settings, LogOut } from 'lucide-react';
import Clock from './Clock';
import SearchBar from './SearchBar';

export default function Header({ searchQuery, setSearchQuery, onOpenSettings, onLogout, trialStatus }) {
  const showTrialBanner = trialStatus && !trialStatus.paid && trialStatus.trialActive && trialStatus.daysRemaining <= 7;

  return (
    <header className="relative z-10 px-4 md:px-8 pt-6 pb-4 animate-slide-down">
      <div className="max-w-7xl mx-auto">
        {/* Top row: Clock + Settings */}
        <div className="flex items-start justify-between mb-8">
          <Clock />

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl transition-all duration-200"
              style={{ color: 'var(--text-secondary)', background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}
              aria-label="Open settings"
              data-tooltip="Settings"
              id="settings-button"
            >
              <Settings size={20} className="hover:rotate-90 transition-transform duration-500" />
            </button>

            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl transition-all duration-200"
              style={{ color: 'var(--text-secondary)', background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}
              aria-label="Logout"
              data-tooltip="Logout"
              id="logout-button"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* Trial Banner */}
        {showTrialBanner && (
          <div className="mt-4 text-center animate-fade-in">
            <p className="text-xs font-medium" style={{ color: 'var(--accent-color)' }}>
              {trialStatus.daysRemaining} {trialStatus.daysRemaining === 1 ? 'day' : 'days'} left in your free trial
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
