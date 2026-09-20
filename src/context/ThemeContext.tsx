import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.js';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const storageKey = `kinora_theme_preference_${currentUser?.id || 'default'}`;

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'dark'; // Dark Mode is DEFAULT
  });

  // When user switches or logs in, load user-specific preference
  useEffect(() => {
    try {
      const userSaved = localStorage.getItem(storageKey);
      if (userSaved === 'light' || userSaved === 'dark') {
        setThemeState(userSaved);
      }
    } catch {
      // fallback
    }
  }, [storageKey]);

  // Synchronize document root classes and persistence
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // ignore
    }

    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme, storageKey]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
