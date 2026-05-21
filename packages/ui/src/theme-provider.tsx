'use client';

import * as React from 'react';

type ResolvedTheme = 'light' | 'dark';
export type Theme = ResolvedTheme | 'system';
type ThemeAttribute = 'class' | `data-${string}`;

export interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: ThemeAttribute | ThemeAttribute[];
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
  forcedTheme?: Theme;
  themes?: readonly Theme[];
  value?: Partial<Record<ResolvedTheme, string>>;
  disableTransitionOnChange?: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  themes: readonly Theme[];
  forcedTheme?: Theme;
}

const DEFAULT_THEMES: readonly Theme[] = ['light', 'dark', 'system'];
const STORAGE_KEY = 'lms-theme';
const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function isSupportedTheme(value: string | null, themes: readonly Theme[]): value is Theme {
  return value === 'light' || value === 'dark' || (value === 'system' && themes.includes('system'));
}

function disableTransitions(): () => void {
  const style = document.createElement('style');
  style.appendChild(document.createTextNode('*,*::before,*::after{transition:none!important}'));
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    style.remove();
  };
}

function applyTheme(
  attribute: ThemeAttribute | ThemeAttribute[],
  resolvedTheme: ResolvedTheme,
  value?: Partial<Record<ResolvedTheme, string>>,
): void {
  const root = document.documentElement;
  const attributes = Array.isArray(attribute) ? attribute : [attribute];
  const themeValue = value?.[resolvedTheme] ?? resolvedTheme;

  attributes.forEach((item) => {
    if (item === 'class') {
      root.classList.remove('light', 'dark');
      root.classList.add(themeValue);
      return;
    }

    root.setAttribute(item, themeValue);
  });
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = STORAGE_KEY,
  forcedTheme,
  themes = DEFAULT_THEMES,
  value,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(forcedTheme ?? defaultTheme);
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>('light');

  React.useEffect(() => {
    setSystemTheme(getSystemTheme());

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => setSystemTheme(media.matches ? 'dark' : 'light');

    media.addEventListener('change', syncSystemTheme);
    return () => media.removeEventListener('change', syncSystemTheme);
  }, []);

  React.useEffect(() => {
    if (forcedTheme) return;

    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      if (isSupportedTheme(storedTheme, themes)) {
        setThemeState(storedTheme);
      }
    } catch {
      setThemeState(defaultTheme);
    }
  }, [defaultTheme, forcedTheme, storageKey, themes]);

  const activeTheme = forcedTheme ?? theme;
  const resolvedTheme =
    activeTheme === 'system' && enableSystem
      ? systemTheme
      : activeTheme === 'dark'
        ? 'dark'
        : 'light';

  React.useEffect(() => {
    const cleanup = disableTransitionOnChange ? disableTransitions() : undefined;
    applyTheme(attribute, resolvedTheme, value);

    if (cleanup) {
      window.setTimeout(cleanup, 1);
    }
  }, [attribute, disableTransitionOnChange, resolvedTheme, value]);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      if (forcedTheme) return;

      setThemeState(nextTheme);

      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // Ignore blocked storage; the in-memory theme still updates for this session.
      }
    },
    [forcedTheme, storageKey],
  );

  const contextValue = React.useMemo<ThemeContextValue>(
    () => ({
      theme: activeTheme,
      setTheme,
      resolvedTheme,
      systemTheme,
      themes,
      forcedTheme,
    }),
    [activeTheme, forcedTheme, resolvedTheme, setTheme, systemTheme, themes],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);

  if (context) return context;

  return {
    theme: 'system',
    setTheme: () => undefined,
    resolvedTheme: 'light',
    systemTheme: 'light',
    themes: DEFAULT_THEMES,
  };
}
