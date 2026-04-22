import React, { useState, useRef, useEffect } from 'react';
import { StickyNote, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import GlassCard from '../UI/GlassCard';

export default function QuickNotes() {
  const { state, setNotes } = useApp();
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef(null);
  const debounceRef = useRef(null);

  // Don't render if notes disabled
  if (!state.settings.showNotes) return null;

  const handleChange = (e) => {
    const value = e.target.value;
    // Debounced save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setNotes(value);
    }, 300);

    // Immediate UI update
    if (textareaRef.current) {
      textareaRef.current.value = value;
    }
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-30 transition-all duration-300
        ${expanded ? 'w-80' : 'w-auto'}
      `}
    >
      {expanded ? (
        <GlassCard className="animate-scale-in" padding="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <StickyNote size={16} className="text-brand-400" />
              <span className="text-sm font-semibold text-gray-200">Quick Notes</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 mr-1">
                {(state.notes || '').length} chars
              </span>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Collapse notes"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="p-3">
            <textarea
              ref={textareaRef}
              defaultValue={state.notes || ''}
              onChange={handleChange}
              placeholder="Write your quick notes here..."
              className="w-full h-48 bg-transparent text-sm text-gray-300 placeholder-gray-600 resize-none outline-none leading-relaxed"
              id="quick-notes-textarea"
            />
          </div>
        </GlassCard>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="glass glass-hover p-3 rounded-2xl text-brand-400 hover:text-brand-300 transition-all group"
          aria-label="Open quick notes"
          data-tooltip="Quick Notes"
          id="quick-notes-toggle"
        >
          <StickyNote size={20} className="group-hover:scale-110 transition-transform" />
          {state.notes && state.notes.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full" />
          )}
        </button>
      )}
    </div>
  );
}
