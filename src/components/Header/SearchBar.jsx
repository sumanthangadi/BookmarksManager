import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SEARCH_ENGINES } from '../../utils/constants';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  const { state } = useApp();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // Global keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const engine = SEARCH_ENGINES.google;
    window.open(engine.url + encodeURIComponent(searchQuery.trim()), '_self');
  };

  const clearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div
        className={`
          relative flex items-center rounded-full transition-all duration-300
          ${focused
            ? 'glass border-brand-600/30 shadow-lg shadow-brand-900/20'
            : 'glass-subtle'
          }
        `}
      >
        <Search
          size={18}
          className="absolute left-4 transition-colors duration-200"
          style={{ color: focused ? 'var(--accent-color)' : 'var(--text-muted)' }}
        />

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search bookmarks or the web... (Ctrl+K)"
          className="w-full bg-transparent placeholder-gray-500 text-sm py-3.5 pl-11 pr-20 outline-none"
          style={{ color: 'var(--text-primary)' }}
          id="search-bar"
          autoComplete="off"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 rounded-md transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--input-bg)' }}
            >
              <X size={14} />
            </button>
          )}
          {!searchQuery && (
            <kbd 
              className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border text-[10px] font-mono"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}
            >
              ⌘K
            </kbd>
          )}
        </div>
      </div>
    </form>
  );
}
