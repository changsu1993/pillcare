/**
 * ThemeContext - Global theme provider for dark mode support
 *
 * Provides theme state throughout the application.
 * Supports 'light', 'dark', and 'system' modes.
 * Persists user preference with AsyncStorage.
 * Uses React Native's useColorScheme() for system preference.
 *
 * Usage:
 * ```tsx
 * // Wrap app with provider
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * // Use in components
 * const { theme, isDarkMode, setTheme } = useTheme();
 *
 * // Apply dark mode classes
 * <View className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>
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
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for theme preference
const THEME_STORAGE_KEY = '@PillCare:theme';

/**
 * Theme mode options
 * - light: Always use light theme
 * - dark: Always use dark theme
 * - system: Follow system preference
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme context value type
 */
interface ThemeContextValue {
  /** Current theme mode setting ('light' | 'dark' | 'system') */
  themeMode: ThemeMode;
  /** Whether dark mode is currently active (resolved from themeMode) */
  isDarkMode: boolean;
  /** Loading state while reading from storage */
  isLoading: boolean;
  /** Set the theme mode */
  setTheme: (mode: ThemeMode) => Promise<void>;
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => Promise<void>;
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
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Get system color scheme
  const systemColorScheme = useColorScheme();

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // This will cause a re-render when system theme changes
      // Only affects users with 'system' theme mode
      if (__DEV__) {
        console.log('[ThemeContext] System color scheme changed:', colorScheme);
      }
    });

    return () => subscription.remove();
  }, []);

  /**
   * Load theme preference from AsyncStorage
   */
  const loadThemePreference = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);

      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setThemeMode(stored as ThemeMode);
        if (__DEV__) {
          console.log('[ThemeContext] Loaded theme preference:', stored);
        }
      } else {
        // Default to system
        setThemeMode('system');
      }
    } catch (error) {
      console.error('[ThemeContext] Error loading theme preference:', error);
      // Default to system on error
      setThemeMode('system');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set theme mode and persist to storage
   */
  const setTheme = useCallback(async (mode: ThemeMode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      if (__DEV__) {
        console.log('[ThemeContext] Theme preference saved:', mode);
      }
    } catch (error) {
      console.error('[ThemeContext] Error saving theme preference:', error);
      throw error;
    }
  }, []);

  /**
   * Toggle between light and dark modes
   * If currently on system, switches to the opposite of current system preference
   */
  const toggleTheme = useCallback(async () => {
    const currentIsDark =
      themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
    const newMode: ThemeMode = currentIsDark ? 'light' : 'dark';
    await setTheme(newMode);
  }, [themeMode, systemColorScheme, setTheme]);

  /**
   * Calculate whether dark mode is active
   * - If themeMode is 'light' or 'dark', use that directly
   * - If themeMode is 'system', use system preference
   */
  const isDarkMode = useMemo(() => {
    if (themeMode === 'light') return false;
    if (themeMode === 'dark') return true;
    // 'system' mode - use system preference, default to light if undefined
    return systemColorScheme === 'dark';
  }, [themeMode, systemColorScheme]);

  // Memoize context value to prevent unnecessary re-renders
  const value: ThemeContextValue = useMemo(
    () => ({
      themeMode,
      isDarkMode,
      isLoading,
      setTheme,
      toggleTheme,
    }),
    [themeMode, isDarkMode, isLoading, setTheme, toggleTheme]
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

/**
 * Hook to get theme-aware colors
 * Returns appropriate colors based on current theme
 *
 * Usage:
 * ```tsx
 * const colors = useThemeColors();
 * <View style={{ backgroundColor: colors.background }}>
 * ```
 */
export const useThemeColors = () => {
  const { isDarkMode } = useTheme();

  return useMemo(
    () => ({
      // Backgrounds
      background: isDarkMode ? '#1A1A1A' : '#F9FAFB',
      surface: isDarkMode ? '#1F2937' : '#FFFFFF',
      surfaceSecondary: isDarkMode ? '#374151' : '#F3F4F6',

      // Text
      textPrimary: isDarkMode ? '#FFFFFF' : '#1A1A1A',
      textSecondary: isDarkMode ? '#D1D5DB' : '#6B7280',
      textTertiary: isDarkMode ? '#9CA3AF' : '#9CA3AF',

      // Borders
      border: isDarkMode ? '#374151' : '#E5E7EB',
      borderLight: isDarkMode ? '#4B5563' : '#F3F4F6',

      // Primary colors (stay consistent)
      primary: '#3B82F6',
      primaryLight: isDarkMode ? '#1E40AF' : '#DBEAFE',

      // Status colors
      success: '#22C55E',
      successLight: isDarkMode ? '#166534' : '#DCFCE7',
      warning: '#F59E0B',
      warningLight: isDarkMode ? '#92400E' : '#FEF3C7',
      error: '#EF4444',
      errorLight: isDarkMode ? '#991B1B' : '#FEE2E2',

      // Switch colors
      switchTrackInactive: isDarkMode ? '#4B5563' : '#D1D5DB',
      switchThumbInactive: isDarkMode ? '#9CA3AF' : '#F3F4F6',
    }),
    [isDarkMode]
  );
};

/**
 * Get theme mode label in Korean
 */
export const getThemeModeLabel = (mode: ThemeMode): string => {
  switch (mode) {
    case 'light':
      return '라이트';
    case 'dark':
      return '다크';
    case 'system':
      return '시스템 설정';
  }
};

export default {
  ThemeProvider,
  useTheme,
  useIsDarkMode,
  useThemeColors,
  getThemeModeLabel,
};
