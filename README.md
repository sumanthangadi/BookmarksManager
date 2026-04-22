# BookMarks Manager & Habit Tracker Dashboard

A premium Chrome Extension "New Tab" override that combines a powerful bookmark manager with a real-time synchronized Habit Tracker.

## Features
- **Dark Red Glassmorphism UI**: High-end aesthetic with smooth animations.
- **Advanced Bookmarks**: Reorderable sections, drag-and-drop support, and compact grid layout.
- **Habit Tracker**: Real-time sync with Firebase, weekly schedule table, and daily performance stats.
- **Customizable**: Change wallpapers and manage layouts easily.

## Installation & Setup

### 1. Prerequisites
- **Node.js**: Ensure you have Node.js installed (v18+ recommended).
- **Chrome Browser**: To run the extension.

### 2. Clone and Install
If you are setting this up on a new machine:
```bash
git clone https://github.com/sumanthangadi/BookmarksManager.git
cd BookmarksManager
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (this is already done on your current setup) and add your Firebase credentials:
```env
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
VITE_FIREBASE_MEASUREMENT_ID="..."
```

### 4. Build the Project
Run the following command to generate the production-ready extension:
```bash
npm run build
```
This will create a `dist` folder.

### 5. Load into Chrome
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked**.
5. Select the `dist` folder located inside your project directory.

## Development
To run the project in development mode with hot-reloading:
```bash
npm run dev
```
Note: To see the "New Tab" experience, you must use the `dist` folder in the Chrome Extensions page.

## Technologies
- **Frontend**: React, Vite, Tailwind CSS.
- **Database**: Firebase Firestore.
- **Icons**: Lucide React.
- **Drag & Drop**: @dnd-kit.
