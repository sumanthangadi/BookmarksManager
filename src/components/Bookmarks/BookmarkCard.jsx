import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { getFaviconUrl } from '../../utils/constants';

export default function BookmarkCard({ bookmark, onEdit, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: bookmark.id,
    data: { type: 'Bookmark', bookmark }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleClick = (e) => {
    // Don't navigate if clicking action buttons
    if (e.target.closest('[data-action]')) return;
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const favicon = getFaviconUrl(bookmark.url);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
        transition-all duration-200
        hover:bg-white/[0.06] hover:shadow-sm
        ${isDragging ? 'shadow-lg shadow-brand-900/20 z-50' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`
          flex-shrink-0 p-0.5 rounded cursor-grab active:cursor-grabbing
          text-gray-600 hover:text-gray-400 transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
        data-action="drag"
      >
        <GripVertical size={14} />
      </div>

      {/* Favicon */}
      <div className="flex-shrink-0 w-5 h-5 rounded-[4px] bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="w-3 h-3"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span
          className="text-[10px] font-bold text-brand-300 uppercase"
          style={{ display: favicon ? 'none' : 'flex' }}
        >
          {bookmark.title.charAt(0)}
        </span>
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-200 truncate font-medium group-hover:text-white transition-colors">
          {bookmark.title}
        </p>
      </div>

      {/* Action buttons */}
      <div
        className={`
          flex items-center gap-0.5 flex-shrink-0 transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <button
          data-action="edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(bookmark);
          }}
          className="p-1 rounded-md text-gray-500 hover:text-brand-300 hover:bg-brand-900/30 transition-colors"
          aria-label="Edit bookmark"
        >
          <Pencil size={12} />
        </button>
        <button
          data-action="delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(bookmark.id);
          }}
          className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
          aria-label="Delete bookmark"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
