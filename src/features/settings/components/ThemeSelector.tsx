/**
 * ThemeSelector - Theme mode selection with light/dark/system options
 *
 * Accessibility:
 * - WCAG AAA compliance
 * - 72px min-height for large touch targets
 * - Clear emoji indicators (sun/moon/phone)
 * - Selected state announcements for screen readers
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

/** Theme mode options */
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeSelectorProps {
  /** Current theme mode setting */
  themeMode: ThemeMode;
  /** Callback when theme mode is changed */
  onThemeChange: (mode: ThemeMode) => void;
  /** Whether dark mode is currently active (for styling) */
  isDarkMode: boolean;
  /** Whether controls are disabled (e.g., during save) */
  isDisabled?: boolean;
}

/**
 * Get translation key for theme mode
 */
const getThemeLabelKey = (
  mode: ThemeMode
): 'settings:theme.light' | 'settings:theme.dark' | 'settings:theme.system' => {
  switch (mode) {
    case 'light':
      return 'settings:theme.light';
    case 'dark':
      return 'settings:theme.dark';
    case 'system':
      return 'settings:theme.system';
    default:
      return 'settings:theme.system';
  }
};

/**
 * Get emoji indicator for theme mode
 */
const getThemeIcon = (mode: ThemeMode): string => {
  switch (mode) {
    case 'light':
      return '\u2600\uFE0F'; // Sun
    case 'dark':
      return '\u{1F319}'; // Crescent Moon
    case 'system':
      return '\u{1F4F1}'; // Mobile Phone
    default:
      return '\u{1F4F1}';
  }
};

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  themeMode,
  onThemeChange,
  isDarkMode,
  isDisabled = false,
}) => {
  const { t } = useTranslation(['settings', 'common']);

  /**
   * Get button styles based on selection and dark mode state
   */
  const getButtonStyles = (mode: ThemeMode): string => {
    if (themeMode === mode) {
      return 'bg-primary border-primary';
    }
    return isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200';
  };

  /**
   * Get text color based on selection and dark mode state
   */
  const getTextColor = (mode: ThemeMode): string => {
    if (themeMode === mode) {
      return 'text-white';
    }
    return isDarkMode ? 'text-gray-100' : 'text-gray-900';
  };

  return (
    <View
      className={`p-6 rounded-2xl border-2 shadow-sm ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('settings:title.theme')}
    >
      <Text
        className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
      >
        {t('settings:title.theme')}
      </Text>
      <View className="flex-row gap-3">
        {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            className={`flex-1 min-h-[72px] items-center justify-center rounded-xl border-2 ${getButtonStyles(mode)}`}
            onPress={() => onThemeChange(mode)}
            activeOpacity={0.7}
            disabled={isDisabled}
            accessibilityLabel={t(getThemeLabelKey(mode))}
            accessibilityRole="radio"
            accessibilityState={{ selected: themeMode === mode }}
          >
            <Text className="text-4xl mb-1" accessibilityElementsHidden>
              {getThemeIcon(mode)}
            </Text>
            <Text className={`text-xl font-semibold ${getTextColor(mode)}`}>
              {t(getThemeLabelKey(mode))}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ThemeSelector;
