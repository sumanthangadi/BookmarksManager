import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from '../styles/themes';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('dark-glass');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load initial theme from chrome storage
    const loadTheme = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          const data = await chrome.storage.sync.get('theme');
          if (data.theme && THEMES[data.theme]) {
            setThemeId(data.theme);
          }
        }
      } catch (e) {
        console.error('Failed to load theme:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    // Apply theme CSS variables to document.documentElement
    const currentTheme = THEMES[themeId] || THEMES['dark-glass'];
    
    Object.entries(currentTheme.colors).forEach(([variable, value]) => {
      document.documentElement.style.setProperty(variable, value);
    });

  }, [themeId]);

  const setTheme = async (newThemeId) => {
    if (!THEMES[newThemeId]) return;
    
    setThemeId(newThemeId);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        await chrome.storage.sync.set({ theme: newThemeId });
      }
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ themeId, setTheme, theme: THEMES[themeId] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
