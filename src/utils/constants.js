// Preset wallpapers — CSS gradients to keep extension lightweight
export const PRESET_WALLPAPERS = [
  {
    id: 'default',
    name: 'Midnight Red',
    type: 'gradient',
    value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 40%, #2d0a0a 70%, #0a0a0a 100%)',
    thumbnail: 'linear-gradient(135deg, #0a0a0a, #2d0a0a, #0a0a0a)',
  },
  {
    id: 'ember',
    name: 'Ember Glow',
    type: 'gradient',
    value: 'linear-gradient(160deg, #0f0f0f 0%, #1a0000 30%, #330d0d 60%, #1a0505 100%)',
    thumbnail: 'linear-gradient(160deg, #0f0f0f, #330d0d, #1a0505)',
  },
  {
    id: 'aurora',
    name: 'Dark Aurora',
    type: 'gradient',
    value: 'radial-gradient(ellipse at top left, #1a0a15 0%, #0a0a0a 40%, #0a0f1a 80%, #0a0a0a 100%)',
    thumbnail: 'radial-gradient(ellipse at top left, #1a0a15, #0a0a0a, #0a0f1a)',
  },
  {
    id: 'crimson',
    name: 'Crimson Depths',
    type: 'gradient',
    value: 'linear-gradient(180deg, #0d0000 0%, #1a0808 25%, #0d0d0d 50%, #1a0505 75%, #0a0a0a 100%)',
    thumbnail: 'linear-gradient(180deg, #0d0000, #1a0808, #0a0a0a)',
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    type: 'gradient',
    value: 'radial-gradient(ellipse at bottom right, #0f0a1a 0%, #0a0a0a 50%, #1a0a0a 100%)',
    thumbnail: 'radial-gradient(ellipse at bottom right, #0f0a1a, #0a0a0a, #1a0a0a)',
  },
  {
    id: 'volcanic',
    name: 'Volcanic',
    type: 'gradient',
    value: 'linear-gradient(145deg, #0a0a0a 0%, #1f0a00 35%, #2a0f05 55%, #0a0a0a 100%)',
    thumbnail: 'linear-gradient(145deg, #0a0a0a, #2a0f05, #0a0a0a)',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    type: 'gradient',
    value: 'linear-gradient(135deg, #0d0d0d 0%, #141414 50%, #0d0d0d 100%)',
    thumbnail: 'linear-gradient(135deg, #0d0d0d, #141414, #0d0d0d)',
  },
  {
    id: 'blood-moon',
    name: 'Blood Moon',
    type: 'gradient',
    value: 'radial-gradient(circle at 70% 30%, #2a0a0a 0%, #150505 30%, #0a0a0a 70%)',
    thumbnail: 'radial-gradient(circle at 70% 30%, #2a0a0a, #150505, #0a0a0a)',
  },
];

// Section icon mapping
export const SECTION_ICONS = {
  Work: 'Briefcase',
  Study: 'GraduationCap',
  'AI Tools': 'Brain',
  Social: 'Users',
  Entertainment: 'Gamepad2',
  News: 'Newspaper',
  Shopping: 'ShoppingCart',
  Dev: 'Code',
  Design: 'Palette',
  Finance: 'TrendingUp',
  Health: 'Heart',
  Music: 'Music',
  Custom: 'Folder',
};

// Favicon URL helper
export const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
};

// Search engines
export const SEARCH_ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};
