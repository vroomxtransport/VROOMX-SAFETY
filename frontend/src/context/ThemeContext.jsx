import { createContext, useContext, useLayoutEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Light-only theme. Dark mode has been removed.
export const ThemeProvider = ({ children }) => {
  useLayoutEffect(() => {
    // Ensure dark class is never present
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('vroomx-theme');
  }, []);

  const value = {
    theme: 'light',
    isDark: false,
    toggleTheme: () => {},
    setLightTheme: () => {},
    setDarkTheme: () => {},
    setSystemTheme: () => {},
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
