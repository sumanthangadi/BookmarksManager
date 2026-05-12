import React from 'react';
import ReactDOM from 'react-dom/client';
import BookmarkPopup from './components/Popup/BookmarkPopup';
import { AppProvider } from './context/AppContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <BookmarkPopup />
    </AppProvider>
  </React.StrictMode>
);
