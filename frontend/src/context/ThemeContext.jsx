import { createContext, useContext, useLayoutEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Dark mode is disabled platform-wide. This provider forces light mode
// and exports no-op functions so existing consumers don't break.
export const ThemeProvider = ({ children }) => {
  // Force light mode on mount and clear any stored dark preference
  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('vroomx-theme', 'light');
  }, []);

  const value = {
    theme: 'light',
    isDark: false,
    toggleTheme: () => {},
    setLightTheme: () => {},
    setDarkTheme: () => {},
    setSystemTheme: () => {}
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
