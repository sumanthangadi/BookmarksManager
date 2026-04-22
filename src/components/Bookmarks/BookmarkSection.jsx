import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Trash2, ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import * as Icons from 'lucide-react';
import GlassCard from '../UI/GlassCard';
import BookmarkCard from './BookmarkCard';

export default function BookmarkSection({
  section,
  bookmarks,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onDeleteSection,
  isFiltered,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // For dropping bookmarks into the section
  const { setNodeRef: setDroppableRef } = useDroppable({ 
    id: section.id,
    data: { type: 'Section', section }
  });

  // For dragging the section itself
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: section.id,
    data: { type: 'Section', section }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get the icon component dynamically
  const IconComponent = Icons[section.icon] || Icons.Folder;

  const MAX_VISIBLE = 7;
  const visibleBookmarks = expanded ? bookmarks : bookmarks.slice(0, MAX_VISIBLE);
  const hasMore = bookmarks.length > MAX_VISIBLE;

  const bookmarkIds = bookmarks.map((b) => b.id);

  return (
    <div ref={setSortableRef} style={style} className="h-full">
      <GlassCard
        className={`h-full flex flex-col animate-fade-in ${isDragging ? 'shadow-xl shadow-brand-900/20 z-50 ring-2 ring-brand-500/50' : ''}`}
        padding="p-0"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 group">
          <div className="flex items-center gap-2">
            <div 
              {...attributes} 
              {...listeners} 
              className="p-1 -ml-2 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripHorizontal size={14} />
            </div>
          <div className="p-1.5 rounded-lg bg-brand-600/15 text-brand-400">
            <IconComponent size={16} />
          </div>
          <h3 className="text-sm font-semibold text-gray-200 tracking-wide">
            {section.name}
          </h3>
          <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-full font-medium">
            {bookmarks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddBookmark(section.id)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-brand-300 hover:bg-brand-900/20 transition-colors"
            aria-label={`Add bookmark to ${section.name}`}
          >
            <Plus size={15} />
          </button>

          <button
            onClick={() => hasMore ? setExpanded(!expanded) : setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            aria-label={hasMore ? (expanded ? 'Compress section' : 'Extend section') : (collapsed ? 'Expand section' : 'Collapse section')}
          >
            {(hasMore ? !expanded : collapsed) ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              aria-label={`Delete ${section.name} section`}
            >
              <Trash2 size={14} />
            </button>
          ) : (
            <div className="flex items-center gap-1 animate-fade-in">
              <button
                onClick={() => onDeleteSection(section.id)}
                className="text-[11px] px-2 py-1 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] px-2 py-1 rounded-md bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bookmark List */}
      {!collapsed && (
        <div ref={setDroppableRef} className="p-1.5 min-h-[20px] flex-1 flex flex-col gap-0.5">
          {bookmarks.length > 0 ? (
            <>
              <SortableContext items={bookmarkIds} strategy={verticalListSortingStrategy}>
                {visibleBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    onEdit={onEditBookmark}
                    onDelete={onDeleteBookmark}
                  />
                ))}
              </SortableContext>
              
              {hasMore && (
                <div className="mt-2 flex justify-center">
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded-md hover:bg-brand-900/20 transition-colors flex items-center gap-1"
                  >
                    {expanded ? 'Show Less' : `Show ${bookmarks.length - MAX_VISIBLE} More`}
                    {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-600 text-xs py-4 italic">
              {isFiltered ? 'No matches found' : 'No bookmarks yet. Click + to add one.'}
            </p>
          )}
        </div>
      )}
      </GlassCard>
    </div>
  );
}
