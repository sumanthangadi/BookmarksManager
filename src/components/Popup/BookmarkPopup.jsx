import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, Bookmark, Plus, ExternalLink, ChevronDown, FolderPlus, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import Button from '../UI/Button';

export default function BookmarkPopup() {
  const { state, addBookmark, addSection, saveStateNow, isLoaded } = useApp();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Get current tab information
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
    } else {
      // Fallback for development/preview
      setTitle('Example Page');
      setUrl('https://example.com');
    }
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
      targetSectionId = `sec_${Date.now()}`;
      const newSec = {
        id: targetSectionId,
        name: newSectionName.trim(),
        icon: 'Folder'
      };
      
      addSection(newSec);
      
      // We manually construct the updated sections array for saveStateNow
      const fullNewSec = { ...newSec, order: state.sections.length };
      updatedSections = [...state.sections, fullNewSec];
    } else if (!targetSectionId) {
      return; // No section selected
    }

    const newBookmark = {
      id: `bm_${Date.now()}`,
      title,
      url,
      sectionId: targetSectionId,
    };

    addBookmark(newBookmark);

    const updatedBookmarks = [...state.bookmarks, newBookmark];
    await saveStateNow({
      ...state,
      sections: updatedSections,
      bookmarks: updatedBookmarks
    });

    setIsSaved(true);
    setTimeout(() => {
      window.close();
    }, 1200);
  };

  const selectedSection = state.sections.find(s => s.id === sectionId) || state.sections[0];
  const SelectedIcon = selectedSection ? (Icons[selectedSection.icon] || Icons.Folder) : Icons.Folder;

  if (!isLoaded) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] text-white min-h-[250px]">
        <div className="w-8 h-8 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin"></div>
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
    <div className="p-4 bg-[#0a0a0a] text-white min-h-[300px] flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-brand-600/20 text-brand-400">
          <Bookmark size={20} />
        </div>
        <h1 className="text-lg font-bold">Add Bookmark</h1>
      </div>

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
  );
}
