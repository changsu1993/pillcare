/**
 * ThemeContext - Global theme provider for dark mode support
 *
 * Provides theme mode management throughout the application.
 * Supports light, dark, and system-based theme selection.
 * Persists theme preference with AsyncStorage.
 *
 * Usage:
 * ```tsx
 * // Wrap app with provider
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * // Use in components
 * const { isDarkMode, themeMode, setTheme } = useTheme();
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Storage key for persisting theme preference */
const THEME_STORAGE_KEY = '@pillcare_theme_mode';

/** Theme mode options */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme context value type
 */
interface ThemeContextValue {
  /** Whether dark mode is currently active */
  isDarkMode: boolean;
  /** Current theme mode setting */
  themeMode: ThemeMode;
  /** Set theme mode */
  setTheme: (mode: ThemeMode) => Promise<void>;
  /** Loading state while theme is being loaded from storage */
  isLoading: boolean;
}

// Create context with undefined initial value
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme provider component
 */
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      setIsLoading(true);
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setThemeMode(storedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('[ThemeContext] Error loading theme:', error);
      // Keep default 'system' on error
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = useCallback(async (mode: ThemeMode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('[ThemeContext] Error saving theme:', error);
      throw error;
    }
  }, []);

  // Calculate isDarkMode based on themeMode and system preference
  const isDarkMode = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: ThemeContextValue = useMemo(
    () => ({
      isDarkMode,
      themeMode,
      setTheme,
      isLoading,
    }),
    [isDarkMode, themeMode, setTheme, isLoading]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

/**
 * Hook to check if dark mode is active
 * Convenience hook for common use case
 */
export const useIsDarkMode = (): boolean => {
  const { isDarkMode } = useTheme();
  return isDarkMode;
};

export default {
  ThemeProvider,
  useTheme,
  useIsDarkMode,
};
