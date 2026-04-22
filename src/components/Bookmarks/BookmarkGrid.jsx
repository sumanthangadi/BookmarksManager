import React, { useState, useCallback } from 'react';
import {
  DndContext,
  rectIntersection,
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

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeBookmark = state.bookmarks.find((b) => b.id === activeId);
    if (!activeBookmark) return;

    const overBookmark = state.bookmarks.find((b) => b.id === overId);
    const overSection = state.sections.find((s) => s.id === overId);

    // Case 1: Over another bookmark
    if (overBookmark) {
      if (activeBookmark.sectionId !== overBookmark.sectionId) {
        // Cross-section move
        const oldIndex = state.bookmarks.findIndex((b) => b.id === activeId);
        const newIndex = state.bookmarks.findIndex((b) => b.id === overId);
        
        let updatedBookmarks = [...state.bookmarks];
        updatedBookmarks[oldIndex] = { ...activeBookmark, sectionId: overBookmark.sectionId };
        
        reorderBookmarks(arrayMove(updatedBookmarks, oldIndex, newIndex));
      } else {
        // Same section reorder
        const oldIndex = state.bookmarks.findIndex((b) => b.id === activeId);
        const newIndex = state.bookmarks.findIndex((b) => b.id === overId);
        reorderBookmarks(arrayMove(state.bookmarks, oldIndex, newIndex));
      }
      return;
    }

    // Case 2: Over a section droppable (empty area or header)
    if (overSection && activeBookmark.sectionId !== overSection.id) {
      const oldIndex = state.bookmarks.findIndex((b) => b.id === activeId);
      let updatedBookmarks = [...state.bookmarks];
      updatedBookmarks[oldIndex] = { ...activeBookmark, sectionId: overSection.id };
      
      // Move to the end of the global list for this section
      reorderBookmarks(updatedBookmarks);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeType = active.data.current?.type;
    
    if (activeType === 'Section') {
      const sortedSections = [...state.sections].sort((a, b) => a.order - b.order);
      const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
      const newIndex = sortedSections.findIndex((s) => s.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderSections(arrayMove(sortedSections, oldIndex, newIndex));
      }
    }
  };

  // Find the active item for the overlay
  const activeSection = state.sections.find(s => s.id === activeId);
  const activeBookmark = state.bookmarks.find(b => b.id === activeId);

  // Sort sections by order
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
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
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

          <DragOverlay>
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
