import { useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Hook providing bookmark CRUD operations and search.
 * @returns Bookmark actions and filtered results
 */
export function useBookmarks() {
  const { state, addBookmark, editBookmark, deleteBookmark, reorderBookmarks } = useApp();

  const getBookmarksBySection = useCallback(
    (sectionId) => {
      return state.bookmarks.filter((b) => b.sectionId === sectionId);
    },
    [state.bookmarks]
  );

  const searchBookmarks = useCallback(
    (query) => {
      if (!query || !query.trim()) return state.bookmarks;
      const q = query.toLowerCase().trim();
      return state.bookmarks.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q)
      );
    },
    [state.bookmarks]
  );

  const moveBookmark = useCallback(
    (bookmarkId, newSectionId) => {
      const bookmark = state.bookmarks.find((b) => b.id === bookmarkId);
      if (bookmark) {
        editBookmark({ ...bookmark, sectionId: newSectionId });
      }
    },
    [state.bookmarks, editBookmark]
  );

  return {
    bookmarks: state.bookmarks,
    sections: state.sections,
    addBookmark,
    editBookmark,
    deleteBookmark,
    reorderBookmarks,
    getBookmarksBySection,
    searchBookmarks,
    moveBookmark,
  };
}
