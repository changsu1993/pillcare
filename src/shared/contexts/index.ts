/**
 * Shared Contexts Index
 *
 * Re-exports all shared context providers and hooks.
 */

export {
  ThemeProvider,
  useTheme,
  useIsDarkMode,
  useThemeColors,
  getThemeModeLabel,
} from './ThemeContext';

export type { ThemeMode } from './ThemeContext';
