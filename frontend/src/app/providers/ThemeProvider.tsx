import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Provides app-wide dark/light theme state persisted in local storage. */
export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('htown-theme') : null;
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.classList.toggle('theme-light', mode === 'light');
    document.documentElement.classList.toggle('theme-dark', mode === 'dark');
    window.localStorage.setItem('htown-theme', mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      toggleMode: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Returns current theme state and toggle action. */
export function useThemeMode(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider.');
  }

  return context;
}
