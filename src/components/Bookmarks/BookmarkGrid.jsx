import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import BookmarkSection from './BookmarkSection';
import BookmarkForm from './BookmarkForm';
import Button from '../UI/Button';

export default function BookmarkGrid({ searchQuery }) {
  const {
    state,
    addBookmark,
    editBookmark,
    deleteBookmark,
    reorderBookmarks,
    reorderSections,
    addSection,
    deleteSection,
  } = useApp();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [defaultSectionId, setDefaultSectionId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter bookmarks by search query
  const getFilteredBookmarks = useCallback(
    (sectionId) => {
      let sectionBookmarks = state.bookmarks.filter((b) => b.sectionId === sectionId);
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        sectionBookmarks = sectionBookmarks.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.url.toLowerCase().includes(q)
        );
      }
      return sectionBookmarks;
    },
    [state.bookmarks, searchQuery]
  );

  // Check if any bookmarks match the search in this section
  const hasResults = useCallback(
    (sectionId) => {
      if (!searchQuery || !searchQuery.trim()) return true;
      return getFilteredBookmarks(sectionId).length > 0;
    },
    [getFilteredBookmarks, searchQuery]
  );

  // Open add bookmark form
  const handleAddBookmark = (sectionId) => {
    setEditingBookmark(null);
    setDefaultSectionId(sectionId);
    setFormOpen(true);
  };

  // Open edit bookmark form
  const handleEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark);
    setDefaultSectionId(bookmark.sectionId);
    setFormOpen(true);
  };

  // Save bookmark (add or edit)
  const handleSaveBookmark = (bookmarkData) => {
    if (editingBookmark) {
      editBookmark({ ...editingBookmark, ...bookmarkData });
    } else {
      addBookmark(bookmarkData);
    }
    setFormOpen(false);
    setEditingBookmark(null);
  };

  // Delete bookmark
  const handleDeleteBookmark = (id) => {
    deleteBookmark(id);
  };

  // Delete section
  const handleDeleteSection = (id) => {
    deleteSection(id);
  };

  // Add new section
  const handleAddSection = () => {
    const name = prompt('Section name:');
    if (name && name.trim()) {
      addSection({ name: name.trim() });
    }
  };

  // DnD handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    
    // Sort sections by order
    const sortedSections = [...state.sections].sort((a, b) => a.order - b.order);

    if (activeType === 'Section') {
      const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
      const newIndex = sortedSections.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sortedSections, oldIndex, newIndex);
        reorderSections(reordered);
      }
      return;
    }

    // Bookmark dragging logic
    const activeBookmark = state.bookmarks.find((b) => b.id === active.id);
    if (!activeBookmark) return;

    // Check if dropping onto a section header/empty space (droppable)
    const overSection = state.sections.find((s) => s.id === over.id);
    
    if (overSection) {
      // Move to the end of the new section
      const otherBookmarks = state.bookmarks.filter((b) => b.id !== active.id);
      const updatedBookmark = { ...activeBookmark, sectionId: overSection.id };
      reorderBookmarks([...otherBookmarks, updatedBookmark]);
      return;
    }

    const overBookmark = state.bookmarks.find((b) => b.id === over.id);
    if (!overBookmark) return;

    // Move within same section or to a specific position in a different section
    const oldIndex = state.bookmarks.findIndex((b) => b.id === active.id);
    const newIndex = state.bookmarks.findIndex((b) => b.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      let updatedBookmarks = [...state.bookmarks];
      
      // If moving cross-section, update the sectionId first
      if (activeBookmark.sectionId !== overBookmark.sectionId) {
        updatedBookmarks[oldIndex] = { ...activeBookmark, sectionId: overBookmark.sectionId };
      }
      
      const reordered = arrayMove(updatedBookmarks, oldIndex, newIndex);
      reorderBookmarks(reordered);
    }
  };

  // Find the active item for the overlay
  const activeSection = state.sections.find(s => s.id === activeId);
  const activeBookmark = state.bookmarks.find(b => b.id === activeId);

  // Sort sections by order (already defined above but needed here too)
  const sortedSectionsList = [...state.sections].sort((a, b) => a.order - b.order);

  // If searching, only show sections with results
  const visibleSections = searchQuery
    ? sortedSectionsList.filter((s) => hasResults(s.id))
    : sortedSectionsList;

  return (
    <div className="relative z-10 px-4 md:px-8 py-4">
      <div className="w-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Bookmark Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <SortableContext items={visibleSections.map(s => s.id)} strategy={rectSortingStrategy}>
              {visibleSections.map((section, idx) => (
                <BookmarkSection
                  key={section.id}
                  section={section}
                  bookmarks={getFilteredBookmarks(section.id)}
                  onAddBookmark={handleAddBookmark}
                  onEditBookmark={handleEditBookmark}
                  onDeleteBookmark={handleDeleteBookmark}
                  onDeleteSection={handleDeleteSection}
                  isFiltered={!!searchQuery}
                />
              ))}
            </SortableContext>

            {/* Add Section Card */}
            {!searchQuery && (
              <button
                onClick={handleAddSection}
                className="stagger-item min-h-[120px] rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-600/30 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-brand-400 transition-all duration-300 hover:bg-white/[0.02] group"
              >
                <Plus size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Add Section</span>
              </button>
            )}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeId ? (
              activeSection ? (
                <div className="w-[300px] opacity-80 rotate-3 scale-105 pointer-events-none">
                  <BookmarkSection
                    section={activeSection}
                    bookmarks={getFilteredBookmarks(activeSection.id)}
                    onAddBookmark={() => {}}
                    onEditBookmark={() => {}}
                    onDeleteBookmark={() => {}}
                    onDeleteSection={() => {}}
                  />
                </div>
              ) : activeBookmark ? (
                <div className="w-[250px] opacity-80 rotate-2 scale-105 pointer-events-none">
                  <BookmarkCard
                    bookmark={activeBookmark}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* No search results message */}
        {searchQuery && visibleSections.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-gray-500 text-lg">No bookmarks match &quot;{searchQuery}&quot;</p>
            <p className="text-gray-600 text-sm mt-2">Try a different search term or press Enter to search the web</p>
          </div>
        )}
      </div>

      {/* Bookmark Form Modal */}
      <BookmarkForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingBookmark(null);
        }}
        onSave={handleSaveBookmark}
        bookmark={editingBookmark}
        sections={state.sections}
        defaultSectionId={defaultSectionId}
      />
    </div>
  );
}
