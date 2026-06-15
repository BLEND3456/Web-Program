import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

const THEME_USER_SET_KEY = 'theme_user_set';

const getStoredTheme = () => {
  if (localStorage.getItem(THEME_USER_SET_KEY) !== '1') {
    return 'light';
  }
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getStoredTheme);

  const setTheme = (next) => {
    localStorage.setItem(THEME_USER_SET_KEY, '1');
    setThemeState(next);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    if (theme === 'light' && localStorage.getItem(THEME_USER_SET_KEY) !== '1') {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    localStorage.setItem(THEME_USER_SET_KEY, '1');
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
