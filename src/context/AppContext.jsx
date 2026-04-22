import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { getStorageData, setStorageData } from '../utils/storage';
import { getDefaultState } from '../utils/defaults';
import { generateId } from '../utils/constants';
import { importBrowserBookmarks, isBookmarksApiAvailable } from '../utils/bookmarkImporter';

const AppContext = createContext(null);

// Action types
const ACTIONS = {
  SET_STATE: 'SET_STATE',
  ADD_BOOKMARK: 'ADD_BOOKMARK',
  EDIT_BOOKMARK: 'EDIT_BOOKMARK',
  DELETE_BOOKMARK: 'DELETE_BOOKMARK',
  REORDER_BOOKMARKS: 'REORDER_BOOKMARKS',
  ADD_SECTION: 'ADD_SECTION',
  EDIT_SECTION: 'EDIT_SECTION',
  DELETE_SECTION: 'DELETE_SECTION',
  SET_NOTES: 'SET_NOTES',
  SET_WALLPAPER: 'SET_WALLPAPER',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  IMPORT_BOOKMARKS: 'IMPORT_BOOKMARKS',
  RESET_ALL: 'RESET_ALL',
  REORDER_SECTIONS: 'REORDER_SECTIONS',
};

function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_STATE:
      return { ...state, ...action.payload };

    case ACTIONS.ADD_BOOKMARK:
      return {
        ...state,
        bookmarks: [...state.bookmarks, { ...action.payload, id: generateId() }],
      };

    case ACTIONS.EDIT_BOOKMARK:
      return {
        ...state,
        bookmarks: state.bookmarks.map((b) =>
          b.id === action.payload.id ? { ...b, ...action.payload } : b
        ),
      };

    case ACTIONS.DELETE_BOOKMARK:
      return {
        ...state,
        bookmarks: state.bookmarks.filter((b) => b.id !== action.payload),
      };

    case ACTIONS.REORDER_BOOKMARKS:
      return {
        ...state,
        bookmarks: action.payload,
      };

    case ACTIONS.REORDER_SECTIONS:
      return {
        ...state,
        sections: action.payload.map((s, index) => ({ ...s, order: index })),
      };

    case ACTIONS.ADD_SECTION: {
      const newSection = {
        id: `sec_${generateId()}`,
        name: action.payload.name || 'New Section',
        icon: action.payload.icon || 'Folder',
        order: state.sections.length,
      };
      return {
        ...state,
        sections: [...state.sections, newSection],
      };
    }

    case ACTIONS.EDIT_SECTION:
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };

    case ACTIONS.DELETE_SECTION:
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.payload),
        bookmarks: state.bookmarks.filter((b) => b.sectionId !== action.payload),
      };

    case ACTIONS.SET_NOTES:
      return { ...state, notes: action.payload };

    case ACTIONS.SET_WALLPAPER:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case ACTIONS.IMPORT_BOOKMARKS:
      return {
        ...state,
        sections: [...state.sections, ...action.payload.sections],
        bookmarks: [...state.bookmarks, ...action.payload.bookmarks],
      };

    case ACTIONS.RESET_ALL: {
      // Clear the _initialized flag so bookmarks are re-imported on next load
      setStorageData({ _initialized: false }).catch(() => {});
      return getDefaultState();
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, getDefaultState());
  const initialized = useRef(false);
  const saveTimeout = useRef(null);

  // Load state from storage on mount, auto-import Chrome bookmarks on first run
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await getStorageData(['sections', 'bookmarks', 'notes', 'settings', '_initialized']);

        // If user has previously saved data, restore it
        if (stored._initialized) {
          const payload = {};
          if (stored.sections) payload.sections = stored.sections;
          if (stored.bookmarks) payload.bookmarks = stored.bookmarks;
          if (stored.notes !== undefined) payload.notes = stored.notes;
          if (stored.settings) payload.settings = { ...getDefaultState().settings, ...stored.settings };

          if (Object.keys(payload).length > 0) {
            dispatch({ type: ACTIONS.SET_STATE, payload });
          }
        } else {
          // First run — try to auto-import Chrome bookmarks
          if (isBookmarksApiAvailable()) {
            try {
              console.log('[BookMarks Manager] First run — importing your browser bookmarks...');
              const imported = await importBrowserBookmarks();

              if (imported.bookmarks.length > 0) {
                // Replace defaults with real bookmarks
                dispatch({
                  type: ACTIONS.SET_STATE,
                  payload: {
                    sections: imported.sections,
                    bookmarks: imported.bookmarks,
                  },
                });
                console.log(
                  `[BookMarks Manager] Imported ${imported.bookmarks.length} bookmarks in ${imported.sections.length} sections`
                );
              }
              // If no bookmarks found, keep the defaults
            } catch (importErr) {
              console.warn('[BookMarks Manager] Could not auto-import bookmarks:', importErr.message);
              // Keep the defaults
            }
          }
          // Mark as initialized so we don't re-import on next load
          await setStorageData({ _initialized: true });
        }
      } catch (err) {
        console.error('Failed to load state from storage:', err);
      }
      initialized.current = true;
    };

    loadState();
  }, []);

  // Debounced auto-save to storage on state changes
  useEffect(() => {
    if (!initialized.current) return;

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      setStorageData({
        sections: state.sections,
        bookmarks: state.bookmarks,
        notes: state.notes,
        settings: state.settings,
      }).catch((err) => console.error('Failed to save state:', err));
    }, 500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [state]);

  // Memoized action creators
  const actions = {
    addBookmark: useCallback((bookmark) => dispatch({ type: ACTIONS.ADD_BOOKMARK, payload: bookmark }), []),
    editBookmark: useCallback((bookmark) => dispatch({ type: ACTIONS.EDIT_BOOKMARK, payload: bookmark }), []),
    deleteBookmark: useCallback((id) => dispatch({ type: ACTIONS.DELETE_BOOKMARK, payload: id }), []),
    reorderBookmarks: useCallback((bookmarks) => dispatch({ type: ACTIONS.REORDER_BOOKMARKS, payload: bookmarks }), []),
    reorderSections: useCallback((sections) => dispatch({ type: ACTIONS.REORDER_SECTIONS, payload: sections }), []),
    addSection: useCallback((section) => dispatch({ type: ACTIONS.ADD_SECTION, payload: section }), []),
    editSection: useCallback((section) => dispatch({ type: ACTIONS.EDIT_SECTION, payload: section }), []),
    deleteSection: useCallback((id) => dispatch({ type: ACTIONS.DELETE_SECTION, payload: id }), []),
    setNotes: useCallback((notes) => dispatch({ type: ACTIONS.SET_NOTES, payload: notes }), []),
    setWallpaper: useCallback((wallpaper) => dispatch({ type: ACTIONS.SET_WALLPAPER, payload: wallpaper }), []),
    updateSettings: useCallback((settings) => dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: settings }), []),
    importBookmarks: useCallback((data) => dispatch({ type: ACTIONS.IMPORT_BOOKMARKS, payload: data }), []),
    resetAll: useCallback(() => dispatch({ type: ACTIONS.RESET_ALL }), []),
  };

  return (
    <AppContext.Provider value={{ state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { ACTIONS };
