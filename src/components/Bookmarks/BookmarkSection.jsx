import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  // For dragging the section itself and handling bookmark drops
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: section.id,
    data: { type: 'Section', section }
  });

  const style = {
    // Use Translate (not Transform) to avoid scale distortion while dragging sections
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    // Prevent the ghost from collapsing to zero-height
    zIndex: isDragging ? 999 : undefined,
  };

  // Get the icon component dynamically
  const IconComponent = Icons[section.icon] || Icons.Folder;

  const bookmarkIds = bookmarks.map((b) => b.id);

  return (
    <div ref={setNodeRef} style={style} className="h-full">
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
      <div className="p-1.5 min-h-[20px] max-h-[320px] overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-0.5">
        {bookmarks.length > 0 ? (
          <SortableContext items={bookmarkIds} strategy={verticalListSortingStrategy}>
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEditBookmark}
                onDelete={onDeleteBookmark}
              />
            ))}
          </SortableContext>
        ) : (
            <p className="text-center text-gray-600 text-xs py-4 italic">
              {isFiltered ? 'No matches found' : 'No bookmarks yet. Click + to add one.'}
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
