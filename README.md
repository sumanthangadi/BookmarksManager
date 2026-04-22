# 📚 BookMarks Manager — Chrome New Tab Dashboard

A premium Chrome/Brave extension that replaces your new tab page with a beautiful, customizable bookmark dashboard featuring glassmorphism UI, drag-and-drop organization, quick notes, and wallpaper customization.

![Dashboard Preview](./public/icons/icon128.png)

---

## ✨ Features

- 🎨 **Premium Glassmorphism UI** — Dark red/black theme with frosted glass effects
- 📑 **Organized Bookmark Sections** — Work, Study, AI Tools, Social, Entertainment, News (customizable)
- ➕ **Add / Edit / Delete Bookmarks** — Full CRUD with URL validation and favicon auto-fetch
- 🔀 **Drag & Drop Reorder** — Reorder bookmarks within and across sections
- 🔍 **Smart Search** — Filter bookmarks in real-time or search the web (Ctrl+K shortcut)
- 🕐 **Live Clock & Date** — 12h/24h format with personalized greeting
- 📝 **Quick Notes Widget** — Collapsible note-taking panel with auto-save
- 🖼️ **Wallpaper Changer** — 8 preset gradient wallpapers + custom image upload
- ⬇️ **Import Browser Bookmarks** — Import your existing Chrome/Brave bookmarks
- ⚙️ **Settings Panel** — Clock format, search engine, display toggles, and more
- 💾 **Persistent Storage** — All data saved via `chrome.storage.local`
- 📱 **Responsive Layout** — Works on all screen sizes
- ✨ **Smooth Animations** — Staggered fade-in, hover effects, micro-interactions

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI Framework |
| Tailwind CSS 3 | Styling |
| Vite 6 | Build Tool |
| @dnd-kit | Drag & Drop |
| Lucide React | Icons |
| Chrome Manifest V3 | Extension API |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Bookmarks/     # BookmarkGrid, BookmarkSection, BookmarkCard, BookmarkForm
│   ├── Header/        # Header, Clock, SearchBar
│   ├── Notes/         # QuickNotes
│   ├── Settings/      # SettingsModal
│   ├── UI/            # GlassCard, Modal, Button
│   └── Wallpaper/     # WallpaperPicker
├── context/           # AppContext (global state)
├── hooks/             # useClock, useBookmarks, useStorage
└── utils/             # storage, bookmarkImporter, constants, defaults
```

---

## 🚀 Build Instructions

### Prerequisites
- **Node.js** 18+ installed
- **npm** 9+ installed

### 1. Install Dependencies
```bash
cd BookMarksManager
npm install
```

### 2. Development (preview in browser)
```bash
npm run dev
```
Open `http://localhost:5173/newtab.html` in your browser.

> **Note:** Chrome extension APIs (bookmarks, storage) won't work in dev mode. The app automatically falls back to `localStorage` for development.

### 3. Production Build
```bash
npm run build
```
This generates a `dist/` folder ready to load as a Chrome extension.

---

## 📦 Loading the Extension in Chrome / Brave

1. Run `npm run build` to generate the `dist/` folder
2. Open your browser and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `dist/` folder inside `BookMarksManager/`
6. Open a **new tab** — your dashboard is now active! 🎉

### Updating After Changes
1. Run `npm run build` again
2. Go to `chrome://extensions/`
3. Click the **refresh icon** on the BookMarks Manager card

---

## ⚙️ Configuration

### Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+K` / `⌘+K` | Focus search bar |
| `Escape` | Close modals |
| `Enter` (in search) | Search the web |

### Settings Options
- **Clock**: 12h/24h format, show/hide seconds
- **Search Engine**: Google, DuckDuckGo, Bing
- **Display**: Show/hide greeting, show/hide quick notes
- **Wallpaper**: 8 gradient presets + custom image upload (max 5MB)
- **User Name**: Personalized greeting ("Good Morning, John")
- **Import**: Import Chrome/Brave bookmarks with folder → section mapping
- **Reset**: Clear all data and restore defaults

---

## 🔒 Permissions

| Permission | Reason |
|---|---|
| `storage` | Save bookmarks, notes, settings persistently |
| `bookmarks` | Import existing browser bookmarks |

No data leaves your browser. Everything is stored locally.

---

## 📄 License

MIT
