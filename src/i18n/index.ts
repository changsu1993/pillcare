/**
 * i18n Configuration
 *
 * Internationalization setup using i18next for React Native.
 * Supports Korean (default), English, and future languages.
 *
 * Features:
 * - Device language detection
 * - Language persistence via AsyncStorage
 * - Fallback to Korean if translation missing
 * - Type-safe translation keys
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation resources
import ko from './locales/ko';
import en from './locales/en';

// Storage key for persisted language preference
const LANGUAGE_STORAGE_KEY = '@pillcare_language';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'ko', name: '한국어', nativeName: '한국어' },
  { code: 'en', name: 'English', nativeName: 'English' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/**
 * Custom language detector for React Native
 * Checks AsyncStorage first, then falls back to device locale
 */
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Check for saved language preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && SUPPORTED_LANGUAGES.some((l) => l.code === savedLanguage)) {
        callback(savedLanguage);
        return;
      }

      // Fall back to device locale
      const deviceLocale = Localization.getLocales()[0]?.languageCode || 'ko';
      const supportedLocale = SUPPORTED_LANGUAGES.some((l) => l.code === deviceLocale)
        ? deviceLocale
        : 'ko';

      callback(supportedLocale);
    } catch {
      // Default to Korean on error
      callback('ko');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch (error) {
      if (__DEV__) {
        console.error('[i18n] Error saving language preference:', error);
      }
    }
  },
};

// Namespaces used in the app
export const NAMESPACES = [
  'common',
  'auth',
  'medication',
  'family',
  'settings',
  'onboarding',
  'home',
  'reports',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

// Initialize i18next
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko,
      en,
    },
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: NAMESPACES as unknown as string[],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
    compatibilityJSON: 'v4', // Use v4 for better pluralization
  });

/**
 * Change the current language
 */
export const changeLanguage = async (languageCode: LanguageCode): Promise<void> => {
  await i18n.changeLanguage(languageCode);
};

/**
 * Get the current language code
 */
export const getCurrentLanguage = (): LanguageCode => {
  return i18n.language as LanguageCode;
};

export default i18n;
