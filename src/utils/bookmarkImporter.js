import { generateId } from './constants';

/**
 * Maps common folder names to appropriate icons.
 */
const FOLDER_ICON_MAP = {
  work: 'Briefcase',
  job: 'Briefcase',
  office: 'Briefcase',
  business: 'Briefcase',
  study: 'GraduationCap',
  school: 'GraduationCap',
  education: 'GraduationCap',
  learning: 'GraduationCap',
  course: 'GraduationCap',
  courses: 'GraduationCap',
  university: 'GraduationCap',
  college: 'GraduationCap',
  ai: 'Brain',
  'ai tools': 'Brain',
  'artificial intelligence': 'Brain',
  'machine learning': 'Brain',
  social: 'Users',
  'social media': 'Users',
  entertainment: 'Gamepad2',
  gaming: 'Gamepad2',
  games: 'Gamepad2',
  fun: 'Gamepad2',
  news: 'Newspaper',
  shopping: 'ShoppingCart',
  shop: 'ShoppingCart',
  buy: 'ShoppingCart',
  dev: 'Code',
  development: 'Code',
  programming: 'Code',
  coding: 'Code',
  github: 'Code',
  code: 'Code',
  tools: 'Wrench',
  utilities: 'Wrench',
  design: 'Palette',
  art: 'Palette',
  creative: 'Palette',
  finance: 'TrendingUp',
  money: 'TrendingUp',
  banking: 'TrendingUp',
  investment: 'TrendingUp',
  health: 'Heart',
  fitness: 'Heart',
  medical: 'Heart',
  music: 'Music',
  audio: 'Music',
  video: 'Video',
  videos: 'Video',
  youtube: 'Video',
  movies: 'Film',
  travel: 'Plane',
  trips: 'Plane',
  food: 'UtensilsCrossed',
  recipes: 'UtensilsCrossed',
  cooking: 'UtensilsCrossed',
  reading: 'BookOpen',
  books: 'BookOpen',
  blog: 'FileText',
  blogs: 'FileText',
  articles: 'FileText',
  research: 'Search',
  reference: 'Library',
  favorites: 'Star',
  important: 'Star',
  personal: 'User',
  email: 'Mail',
  mail: 'Mail',
  photos: 'Image',
  images: 'Image',
  'bookmarks bar': 'Bookmark',
  'other bookmarks': 'FolderOpen',
  'mobile bookmarks': 'Smartphone',
};

/**
 * Get the best icon for a folder name.
 */
function getIconForFolder(folderName) {
  const lower = folderName.toLowerCase().trim();
  
  // Exact match first
  if (FOLDER_ICON_MAP[lower]) return FOLDER_ICON_MAP[lower];
  
  // Partial match
  for (const [key, icon] of Object.entries(FOLDER_ICON_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return icon;
  }
  
  return 'Folder';
}

/**
 * Import bookmarks from Chrome's native bookmarks API.
 * Recursively processes the bookmark tree, mapping folders to sections.
 * Only creates sections for folders that actually contain bookmarks (directly or in children).
 *
 * @returns {Promise<{ sections: Array, bookmarks: Array }>}
 */
export const importBrowserBookmarks = () => {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      reject(new Error('Chrome bookmarks API is not available. This feature only works when loaded as a Chrome extension.'));
      return;
    }

    chrome.bookmarks.getTree((tree) => {
      const sections = [];
      const bookmarks = [];
      let sectionOrder = 0;

      /**
       * Process a bookmark tree node.
       * For folders: creates a section and processes children.
       * For bookmarks: adds to the parent section.
       * Handles nested folders by flattening — each folder with bookmarks becomes a section.
       */
      const processNode = (node, parentSectionId = null, depth = 0) => {
        // Skip the very top-level root node (it has no title)
        const isRootNode = !node.title && depth === 0;

        // If this is a folder with children
        if (!node.url && node.children) {
          let currentSectionId = parentSectionId;

          // Create a section for this folder (unless it's the unnamed root)
          if (node.title) {
            currentSectionId = `sec_browser_${generateId()}`;
            sections.push({
              id: currentSectionId,
              name: node.title,
              icon: getIconForFolder(node.title),
              order: sectionOrder++,
            });
          }

          // Process all children
          node.children.forEach((child) => {
            processNode(child, currentSectionId, depth + 1);
          });

          // If this section ended up with no bookmarks (directly or in children),
          // and no sub-sections, remove it to keep things clean
          const hasBookmarks = bookmarks.some((b) => b.sectionId === currentSectionId);
          if (node.title && !hasBookmarks) {
            // Check if any child sections exist (nested folders)
            const hasChildSections = sections.some(
              (s) => s.id !== currentSectionId && bookmarks.some((b) => b.sectionId === s.id)
            );
            if (!hasChildSections) {
              // Remove the empty section
              const idx = sections.findIndex((s) => s.id === currentSectionId);
              if (idx !== -1) sections.splice(idx, 1);
            }
          }
        }

        // If this is a bookmark (has URL)
        if (node.url && parentSectionId) {
          // Skip chrome:// internal URLs and javascript: bookmarklets
          if (node.url.startsWith('chrome://') || 
              node.url.startsWith('chrome-extension://') ||
              node.url.startsWith('javascript:')) {
            return;
          }

          bookmarks.push({
            id: generateId(),
            title: node.title || 'Untitled',
            url: node.url,
            sectionId: parentSectionId,
          });
        }
      };

      // The tree root is an array with a single node whose children are:
      // "Bookmarks Bar", "Other Bookmarks", "Mobile Bookmarks" etc.
      if (tree && tree.length > 0) {
        tree.forEach((rootNode) => {
          processNode(rootNode, null, 0);
        });
      }

      // Remove any empty sections (folders that had only sub-folders, no direct bookmarks)
      const nonEmptySections = sections.filter((section) =>
        bookmarks.some((b) => b.sectionId === section.id)
      );

      resolve({ sections: nonEmptySections, bookmarks });
    });
  });
};

/**
 * Check if Chrome bookmarks API is available.
 */
export const isBookmarksApiAvailable = () => {
  return typeof chrome !== 'undefined' && !!chrome.bookmarks;
};
