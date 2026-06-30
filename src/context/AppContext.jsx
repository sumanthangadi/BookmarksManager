import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { getStorageData, setStorageData } from '../utils/storage';
import { getDefaultState, DEFAULT_SECTIONS, DEFAULT_BOOKMARKS } from '../utils/defaults';
import { generateId } from '../utils/constants';
import { getIconForFolder, isBookmarksApiAvailable } from '../utils/bookmarkImporter';
import { SyncService } from '../services/sync';

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
        id: action.payload.id || `sec_${generateId()}`,
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

function mergeLocalAndCloud(localSections, localBookmarks, localIcons, cloudSections, cloudBookmarks, cloudIcons) {
  const mergedSections = [...cloudSections];
  const mergedBookmarks = [...cloudBookmarks];
  const mergedIcons = { ...cloudIcons };

  const localToCloudSectionIdMap = {};
  const cloudSectionsByName = new Map(
    cloudSections.map(s => [s.name.toLowerCase().trim(), s])
  );

  // 1. Merge sections
  for (const localSec of localSections) {
    const normName = localSec.name.toLowerCase().trim();
    const matchedCloudSec = cloudSectionsByName.get(normName);

    if (matchedCloudSec) {
      // Map local section ID to matching cloud section ID
      localToCloudSectionIdMap[localSec.id] = matchedCloudSec.id;
      // Merge icon if local has one but cloud doesn't
      if (localIcons[localSec.id] && (!cloudIcons[matchedCloudSec.id] || cloudIcons[matchedCloudSec.id] === 'Folder')) {
        mergedIcons[matchedCloudSec.id] = localIcons[localSec.id];
      }
    } else {
      // Create new section in cloud space
      // Generate a temporary ID that will be remapped when restoring to Chrome
      const newSecId = `sec_${Math.random().toString(36).substr(2, 9)}`;
      localToCloudSectionIdMap[localSec.id] = newSecId;
      mergedSections.push({
        id: newSecId,
        name: localSec.name,
        icon: localSec.icon || 'Folder',
        order: mergedSections.length
      });
      if (localIcons[localSec.id]) {
        mergedIcons[newSecId] = localIcons[localSec.id];
      }
    }
  }

  // 2. Merge bookmarks
  const cloudUrls = new Set(
    cloudBookmarks.map(b => b.url.toLowerCase().trim())
  );

  for (const localBm of localBookmarks) {
    const targetSectionId = localToCloudSectionIdMap[localBm.sectionId];
    if (targetSectionId) {
      const normUrl = localBm.url.toLowerCase().trim();
      if (!cloudUrls.has(normUrl)) {
        mergedBookmarks.push({
          id: localBm.id, // Will be remapped on restore
          title: localBm.title,
          url: localBm.url,
          sectionId: targetSectionId
        });
        cloudUrls.add(normUrl);
      }
    }
  }

  return {
    sections: mergedSections,
    bookmarks: mergedBookmarks,
    sectionIcons: mergedIcons
  };
}

export function AppProvider({ children, user }) {
  const [state, dispatch] = useReducer(appReducer, getDefaultState());
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = React.useState(false);
  const initialized = useRef(false);
  const saveTimeout = useRef(null);
  const cloudSaveTimeout = useRef(null);
  const isRestoringRef = useRef(false);
  const skipCloudSaveRef = useRef(false);
  const latestStateRef = useRef(state);

  // Keep latestStateRef updated on every render
  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);
 
  // Load state from storage on mount, auto-import Chrome bookmarks on first run
  const syncFromChromeTree = useCallback(async () => {
    if (!isBookmarksApiAvailable()) return;
    try {
      const tree = await new Promise((resolve) => chrome.bookmarks.getTree(resolve));
      const stored = await getStorageData(['sectionIcons']);
      const sectionIcons = stored.sectionIcons || {};
      
      const sections = [];
      const bookmarks = [];
      let sectionOrder = 0;

      const traverse = (node, parentSectionId = null, depth = 0) => {
        if (!node.url && node.children) {
          let currentSectionId = parentSectionId;
          const hasDirectBookmarks = node.children.some(child => child.url);
          
          if (node.title) {
            const hasSubfolders = node.children.some(child => !child.url);
            const isUserCategory = node.parentId === "1" || node.parentId === "2";
            
            if (hasDirectBookmarks || isUserCategory || !hasSubfolders) {
              currentSectionId = node.id;
              sections.push({
                id: currentSectionId,
                name: node.title,
                icon: sectionIcons[node.id] || getIconForFolder(node.title),
                order: sectionOrder++,
              });
            }
          }
          node.children.forEach(child => traverse(child, currentSectionId, depth + 1));
        } else if (node.url && parentSectionId) {
          if (node.url.startsWith('chrome://') || 
              node.url.startsWith('chrome-extension://') ||
              node.url.startsWith('javascript:')) {
            return;
          }
          bookmarks.push({
            id: node.id,
            title: node.title || 'Untitled',
            url: node.url,
            sectionId: parentSectionId,
          });
        }
      };

      if (tree && tree.length > 0) {
        tree.forEach(rootNode => traverse(rootNode, null, 0));
      }

      dispatch({
        type: ACTIONS.SET_STATE,
        payload: { sections, bookmarks }
      });
    } catch (err) {
      console.error('Error syncing from Chrome bookmark tree:', err);
    }
  }, []);

  // Load state from storage on mount, auto-import Chrome bookmarks on first run
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await getStorageData(['sections', 'bookmarks', 'notes', 'settings', '_initialized', 'sectionIcons']);
        
        let sections = stored.sections || [];
        let bookmarks = stored.bookmarks || [];
        let notes = stored.notes !== undefined ? stored.notes : getDefaultState().notes;
        let settings = stored.settings ? { ...getDefaultState().settings, ...stored.settings } : getDefaultState().settings;

        if (isBookmarksApiAvailable()) {
          // Fetch browser bookmark tree
          const tree = await new Promise((resolve) => chrome.bookmarks.getTree(resolve));
          
          const tempSections = [];
          const tempBookmarks = [];
          let sectionOrder = 0;
          const sectionIcons = stored.sectionIcons || {};

          const traverse = (node, parentSectionId = null, depth = 0) => {
            if (!node.url && node.children) {
              let currentSectionId = parentSectionId;
              const hasDirectBookmarks = node.children.some(child => child.url);
              
              if (node.title) {
                const hasSubfolders = node.children.some(child => !child.url);
                const isUserCategory = node.parentId === "1" || node.parentId === "2";
                
                if (hasDirectBookmarks || isUserCategory || !hasSubfolders) {
                  currentSectionId = node.id;
                  tempSections.push({
                    id: currentSectionId,
                    name: node.title,
                    icon: sectionIcons[node.id] || getIconForFolder(node.title),
                    order: sectionOrder++,
                  });
                }
              }
              node.children.forEach(child => traverse(child, currentSectionId, depth + 1));
            } else if (node.url && parentSectionId) {
              if (node.url.startsWith('chrome://') || 
                  node.url.startsWith('chrome-extension://') ||
                  node.url.startsWith('javascript:')) {
                return;
              }
              tempBookmarks.push({
                id: node.id,
                title: node.title || 'Untitled',
                url: node.url,
                sectionId: parentSectionId,
              });
            }
          };

          if (tree && tree.length > 0) {
            tree.forEach(rootNode => traverse(rootNode, null, 0));
          }

          // If the tree is completely empty (no sections), populate defaults into Chrome bookmarks on first run
          if (tempSections.length === 0 && !stored._initialized) {
            console.log('[Folio] First run: Populating default categories and bookmarks into Chrome...');
            for (const sec of DEFAULT_SECTIONS) {
              const folder = await new Promise((resolve) => {
                chrome.bookmarks.create({ parentId: "1", title: sec.name }, resolve);
              });
              
              sectionIcons[folder.id] = sec.icon;
              
              const defaultBms = DEFAULT_BOOKMARKS.filter(b => b.sectionId === sec.id);
              for (const bm of defaultBms) {
                await new Promise((resolve) => {
                  chrome.bookmarks.create({ parentId: folder.id, title: bm.title, url: bm.url }, resolve);
                });
              }
            }
            await setStorageData({ sectionIcons, _initialized: true });
            
            // Re-read tree after populating defaults
            const freshTree = await new Promise((resolve) => chrome.bookmarks.getTree(resolve));
            tempSections.length = 0;
            tempBookmarks.length = 0;
            sectionOrder = 0;
            if (freshTree && freshTree.length > 0) {
              freshTree.forEach(rootNode => traverse(rootNode, null, 0));
            }
          }

          sections = tempSections;
          bookmarks = tempBookmarks;
        } else {
          // If we are in local development (Vite dev server), use the old behavior
          if (!stored._initialized) {
            sections = getDefaultState().sections;
            bookmarks = getDefaultState().bookmarks;
            await setStorageData({ _initialized: true });
          }
        }

        const payload = { sections, bookmarks, notes, settings };
        dispatch({ type: ACTIONS.SET_STATE, payload });
      } catch (err) {
        console.error('Failed to load state from storage:', err);
      } finally {
        initialized.current = true;
        setIsLoaded(true);
      }
    };

    loadState();
  }, []);

  // Listen for native bookmark changes to keep the UI in sync
  useEffect(() => {
    if (isBookmarksApiAvailable()) {
      const handleBookmarkChange = () => {
        if (isRestoringRef.current) return;
        console.log('[Folio] Chrome bookmark event detected, syncing...');
        syncFromChromeTree();
      };

      chrome.bookmarks.onCreated.addListener(handleBookmarkChange);
      chrome.bookmarks.onRemoved.addListener(handleBookmarkChange);
      chrome.bookmarks.onChanged.addListener(handleBookmarkChange);
      chrome.bookmarks.onMoved.addListener(handleBookmarkChange);

      return () => {
        chrome.bookmarks.onCreated.removeListener(handleBookmarkChange);
        chrome.bookmarks.onRemoved.removeListener(handleBookmarkChange);
        chrome.bookmarks.onChanged.removeListener(handleBookmarkChange);
        chrome.bookmarks.onMoved.removeListener(handleBookmarkChange);
      };
    }
  }, [syncFromChromeTree]);
 
  // Listen for external storage changes (e.g. from popup) to keep state in sync
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      const handleStorageChange = (changes, area) => {
        if (area === 'local') {
          const payload = {};
          if (changes.sections) payload.sections = changes.sections.newValue;
          if (changes.bookmarks) payload.bookmarks = changes.bookmarks.newValue;
          if (changes.notes) payload.notes = changes.notes.newValue;
          if (changes.settings) payload.settings = changes.settings.newValue;
 
          if (Object.keys(payload).length > 0) {
            dispatch({ type: ACTIONS.SET_STATE, payload });
          }
        }
      };
 
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }
  }, []);
 
  // Debounced auto-save to storage on state changes
  useEffect(() => {
    if (!initialized.current) return;
 
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
 
    saveTimeout.current = setTimeout(() => {
      const dataToSave = {
        notes: state.notes,
        settings: state.settings,
      };
      if (!isBookmarksApiAvailable()) {
        dataToSave.sections = state.sections;
        dataToSave.bookmarks = state.bookmarks;
      }
      setStorageData(dataToSave).catch((err) => console.error('Failed to save state:', err));
    }, 500);
 
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [state]);

  // Helper to recreate Chrome bookmarks bar tree from cloud data
  const restoreBookmarksFromCloud = useCallback(async (cloudSections, cloudBookmarks, cloudIcons) => {
    if (!isBookmarksApiAvailable()) return;
    
    isRestoringRef.current = true;
    try {
      // 1. Remove all existing bookmarks & folders in Bookmarks Bar ("1") and Other Bookmarks ("2")
      const removeChildren = async (parentId) => {
        const children = await new Promise(resolve => chrome.bookmarks.getChildren(parentId, resolve));
        if (children) {
          for (const child of children) {
            if (child.url) {
              await new Promise(resolve => chrome.bookmarks.remove(child.id, resolve));
            } else {
              await new Promise(resolve => chrome.bookmarks.removeTree(child.id, resolve));
            }
          }
        }
      };
      await removeChildren("1");
      await removeChildren("2");

      // 2. Recreate folders and map old IDs to new Chrome IDs
      const idMap = {};
      const newSections = [];
      const newBookmarks = [];
      
      const sortedSections = [...cloudSections].sort((a, b) => a.order - b.order);
      
      for (const sec of sortedSections) {
        const folder = await new Promise(resolve => {
          chrome.bookmarks.create({ parentId: "1", title: sec.name }, resolve);
        });
        idMap[sec.id] = folder.id;
        newSections.push({
          ...sec,
          id: folder.id
        });
      }

      // 3. Recreate bookmarks
      for (const bm of cloudBookmarks) {
        const newParentId = idMap[bm.sectionId];
        if (newParentId) {
          const createdBm = await new Promise(resolve => {
            chrome.bookmarks.create({ parentId: newParentId, title: bm.title, url: bm.url }, resolve);
          });
          newBookmarks.push({
            ...bm,
            id: createdBm.id,
            sectionId: newParentId
          });
        }
      }

      // 4. Update sectionIcons in Chrome local storage
      const newIcons = {};
      for (const sec of cloudSections) {
        const newId = idMap[sec.id];
        if (newId && cloudIcons && cloudIcons[sec.id]) {
          newIcons[newId] = cloudIcons[sec.id];
        }
      }
      await setStorageData({ sectionIcons: newIcons });

      // 5. Update React State
      dispatch({
        type: ACTIONS.SET_STATE,
        payload: { sections: newSections, bookmarks: newBookmarks }
      });
    } catch (err) {
      console.error('[Sync] Error restoring bookmarks from cloud:', err);
    } finally {
      isRestoringRef.current = false;
    }
  }, []);

  // Effect: Run two-way sync on startup or user change
  useEffect(() => {
    if (!user || !isLoaded) return;

    const performSync = async () => {
      setIsCloudSyncing(true);
      try {
        const cloudDoc = await SyncService.fetchCloudDashboard(user.$id);
        
        const stored = await getStorageData(['lastSyncTime', 'needsCloudSync', 'sectionIcons']);
        const lastSyncTime = stored.lastSyncTime || null;
        const needsCloudSync = stored.needsCloudSync || false;
        const localIcons = stored.sectionIcons || {};

        const currentSections = latestStateRef.current.sections || [];
        const currentBookmarks = latestStateRef.current.bookmarks || [];

        if (cloudDoc) {
          const cloudData = JSON.parse(cloudDoc.data);
          const cloudUpdatedAt = cloudDoc.updatedAt;

          if (!lastSyncTime) {
            // First time logging in on this device/browser, but cloud data exists!
            // We should SMART MERGE local bookmarks and cloud bookmarks, rather than overwriting.
            console.log('[Sync] First sync on this device. Merging local and cloud states...');
            const merged = mergeLocalAndCloud(
              currentSections,
              currentBookmarks,
              localIcons,
              cloudData.sections || [],
              cloudData.bookmarks || [],
              cloudData.sectionIcons || {}
            );

            // Recreate the merged state locally
            skipCloudSaveRef.current = true;
            await restoreBookmarksFromCloud(
              merged.sections,
              merged.bookmarks,
              merged.sectionIcons
            );

            // Upload the merged state back to the cloud
            console.log('[Sync] Uploading merged bookmarks to cloud...');
            await SyncService.saveCloudDashboard(user.$id, {
              sections: merged.sections,
              bookmarks: merged.bookmarks,
              sectionIcons: merged.sectionIcons
            });

            const freshDoc = await SyncService.fetchCloudDashboard(user.$id);
            if (freshDoc) {
              await setStorageData({
                lastSyncTime: freshDoc.updatedAt,
                needsCloudSync: false
              });
            }
          } else if (new Date(cloudUpdatedAt) > new Date(lastSyncTime)) {
            console.log('[Sync] Cloud is newer. Restoring cloud state to local browser...');
            skipCloudSaveRef.current = true;
            await restoreBookmarksFromCloud(
              cloudData.sections || [],
              cloudData.bookmarks || [],
              cloudData.sectionIcons || {}
            );
            await setStorageData({
              lastSyncTime: cloudUpdatedAt,
              needsCloudSync: false
            });
          } else if (needsCloudSync || new Date(cloudUpdatedAt) < new Date(lastSyncTime)) {
            console.log('[Sync] Local changes detected. Uploading to cloud...');
            await SyncService.saveCloudDashboard(user.$id, {
              sections: currentSections,
              bookmarks: currentBookmarks,
              sectionIcons: localIcons
            });
            const freshDoc = await SyncService.fetchCloudDashboard(user.$id);
            if (freshDoc) {
              await setStorageData({
                lastSyncTime: freshDoc.updatedAt,
                needsCloudSync: false
              });
            }
          } else {
            console.log('[Sync] Cloud and local are in sync.');
          }
        } else {
          console.log('[Sync] No cloud backup found. Creating first backup...');
          await SyncService.saveCloudDashboard(user.$id, {
            sections: currentSections,
            bookmarks: currentBookmarks,
            sectionIcons: localIcons
          });
          const freshDoc = await SyncService.fetchCloudDashboard(user.$id);
          if (freshDoc) {
            await setStorageData({
              lastSyncTime: freshDoc.updatedAt,
              needsCloudSync: false
            });
          }
        }
      } catch (err) {
        console.error('[Sync] Error during cloud sync:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    };

    performSync();

    const handleOnline = () => {
      console.log('[Sync] Connection restored. Re-syncing with cloud...');
      performSync();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user, isLoaded, restoreBookmarksFromCloud]);

  // Effect: Debounced cloud save when state changes
  useEffect(() => {
    if (!initialized.current || !user) return;
    if (isRestoringRef.current) return;

    if (skipCloudSaveRef.current) {
      console.log('[Sync] Skipping cloud save because state was just restored from cloud');
      skipCloudSaveRef.current = false;
      return;
    }

    if (cloudSaveTimeout.current) {
      clearTimeout(cloudSaveTimeout.current);
    }

    cloudSaveTimeout.current = setTimeout(async () => {
      try {
        const stored = await getStorageData(['sectionIcons']);
        const localIcons = stored.sectionIcons || {};

        console.log('[Sync] Uploading changes to cloud...');
        await SyncService.saveCloudDashboard(user.$id, {
          sections: state.sections,
          bookmarks: state.bookmarks,
          sectionIcons: localIcons
        });

        const freshDoc = await SyncService.fetchCloudDashboard(user.$id);
        if (freshDoc) {
          await setStorageData({
            lastSyncTime: freshDoc.updatedAt,
            needsCloudSync: false
          });
        }
      } catch (err) {
        console.warn('[Sync] Offline or failed to save to cloud. Flagging for future sync.');
        await setStorageData({ needsCloudSync: true });
      }
    }, 2000);

    return () => {
      if (cloudSaveTimeout.current) clearTimeout(cloudSaveTimeout.current);
    };
  }, [state.sections, state.bookmarks, user]);
 
  // Memoized action creators
  const saveStateNow = useCallback(async (stateToSave) => {
    if (!initialized.current) return;
    try {
      const dataToSave = {
        notes: stateToSave.notes,
        settings: stateToSave.settings,
      };
      if (!isBookmarksApiAvailable()) {
        dataToSave.sections = stateToSave.sections;
        dataToSave.bookmarks = stateToSave.bookmarks;
      }
      await setStorageData(dataToSave);
    } catch (err) {
      console.error('Failed to save state immediately:', err);
    }
  }, []);
 
  const actions = {
    addBookmark: useCallback((bookmark) => {
      return new Promise((resolve) => {
        if (isBookmarksApiAvailable()) {
          chrome.bookmarks.create({
            parentId: bookmark.sectionId,
            title: bookmark.title,
            url: bookmark.url
          }, (newBookmark) => {
            syncFromChromeTree().then(() => {
              resolve({
                id: newBookmark.id,
                title: newBookmark.title,
                url: newBookmark.url,
                sectionId: bookmark.sectionId
              });
            });
          });
        } else {
          const id = bookmark.id || `bm_${generateId()}`;
          dispatch({ type: ACTIONS.ADD_BOOKMARK, payload: { ...bookmark, id } });
          resolve({ ...bookmark, id });
        }
      });
    }, [syncFromChromeTree]),

    editBookmark: useCallback((bookmark) => {
      return new Promise((resolve) => {
        if (isBookmarksApiAvailable()) {
          chrome.bookmarks.update(bookmark.id, { title: bookmark.title, url: bookmark.url }, () => {
            chrome.bookmarks.get(bookmark.id, (results) => {
              if (results && results[0] && results[0].parentId !== bookmark.sectionId) {
                chrome.bookmarks.move(bookmark.id, { parentId: bookmark.sectionId }, () => {
                  syncFromChromeTree().then(resolve);
                });
              } else {
                syncFromChromeTree().then(resolve);
              }
            });
          });
        } else {
          dispatch({ type: ACTIONS.EDIT_BOOKMARK, payload: bookmark });
          resolve();
        }
      });
    }, [syncFromChromeTree]),

    deleteBookmark: useCallback((id) => {
      return new Promise((resolve) => {
        if (isBookmarksApiAvailable()) {
          chrome.bookmarks.remove(id, () => {
            syncFromChromeTree().then(resolve);
          });
        } else {
          dispatch({ type: ACTIONS.DELETE_BOOKMARK, payload: id });
          resolve();
        }
      });
    }, [syncFromChromeTree]),

    reorderBookmarks: useCallback((bookmarks) => dispatch({ type: ACTIONS.REORDER_BOOKMARKS, payload: bookmarks }), []),
    reorderSections: useCallback((sections) => dispatch({ type: ACTIONS.REORDER_SECTIONS, payload: sections }), []),

    commitBookmarkMove: useCallback((bookmarkId, sectionId, targetIndex) => {
      return new Promise((resolve) => {
        if (isBookmarksApiAvailable()) {
          chrome.bookmarks.move(bookmarkId, { parentId: sectionId, index: targetIndex }, () => {
            syncFromChromeTree().then(resolve);
          });
        } else {
          resolve();
        }
      });
    }, [syncFromChromeTree]),

    commitSectionMove: useCallback((sectionId, targetIndex) => {
      return new Promise((resolve) => {
        if (isBookmarksApiAvailable()) {
          chrome.bookmarks.move(sectionId, { index: targetIndex }, () => {
            syncFromChromeTree().then(resolve);
          });
        } else {
          resolve();
        }
      });
    }, [syncFromChromeTree]),

    addSection: useCallback((section) => {
      return new Promise((resolve) => {
        if (isBookmarksApiAvailable()) {
          chrome.bookmarks.create({ parentId: "1", title: section.name }, (newFolder) => {
            chrome.storage.local.get(['sectionIcons'], (stored) => {
              const sectionIcons = stored.sectionIcons || {};
              sectionIcons[newFolder.id] = section.icon || 'Folder';
              chrome.storage.local.set({ sectionIcons }, () => {
                syncFromChromeTree().then(() => {
                  resolve({
                    id: newFolder.id,
                    name: newFolder.title,
                    icon: section.icon || 'Folder'
                  });
                });
              });
            });
          });
        } else {
          const id = section.id || `sec_${generateId()}`;
          dispatch({ type: ACTIONS.ADD_SECTION, payload: { ...section, id } });
          resolve({ ...section, id });
        }
      });
    }, [syncFromChromeTree]),

    editSection: useCallback((section) => {
      return new Promise((resolve) => {
        if (isBookmarksApiAvailable()) {
          chrome.bookmarks.update(section.id, { title: section.name }, () => {
            chrome.storage.local.get(['sectionIcons'], (stored) => {
              const sectionIcons = stored.sectionIcons || {};
              sectionIcons[section.id] = section.icon || 'Folder';
              chrome.storage.local.set({ sectionIcons }, () => {
                syncFromChromeTree().then(resolve);
              });
            });
          });
        } else {
          dispatch({ type: ACTIONS.EDIT_SECTION, payload: section });
          resolve();
        }
      });
    }, [syncFromChromeTree]),

    deleteSection: useCallback((id) => {
      return new Promise((resolve) => {
        if (isBookmarksApiAvailable()) {
          chrome.bookmarks.removeTree(id, () => {
            chrome.storage.local.get(['sectionIcons'], (stored) => {
              const sectionIcons = stored.sectionIcons || {};
              delete sectionIcons[id];
              chrome.storage.local.set({ sectionIcons }, () => {
                syncFromChromeTree().then(resolve);
              });
            });
          });
        } else {
          dispatch({ type: ACTIONS.DELETE_SECTION, payload: id });
          resolve();
        }
      });
    }, [syncFromChromeTree]),

    setNotes: useCallback((notes) => dispatch({ type: ACTIONS.SET_NOTES, payload: notes }), []),
    setWallpaper: useCallback((wallpaper) => dispatch({ type: ACTIONS.SET_WALLPAPER, payload: wallpaper }), []),
    updateSettings: useCallback((settings) => dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: settings }), []),
    importBookmarks: useCallback((data) => dispatch({ type: ACTIONS.IMPORT_BOOKMARKS, payload: data }), []),
    resetAll: useCallback(() => dispatch({ type: ACTIONS.RESET_ALL }), []),
    saveStateNow,
  };
 
  return (
    <AppContext.Provider value={{ state, isLoaded, isCloudSyncing, ...actions }}>
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
