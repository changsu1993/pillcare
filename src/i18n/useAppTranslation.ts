/**
 * useAppTranslation Hook
 *
 * Custom hook that wraps useTranslation with app-specific functionality.
 * Provides type-safe translations and language switching.
 */

import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import {
  changeLanguage,
  getCurrentLanguage,
  SUPPORTED_LANGUAGES,
  LanguageCode,
  Namespace,
} from './index';

/**
 * Custom translation hook with additional utilities
 */
export const useAppTranslation = (namespace?: Namespace | Namespace[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { t, i18n } = useTranslation(namespace as any);

  const currentLanguage = getCurrentLanguage();

  const setLanguage = useCallback(async (code: LanguageCode) => {
    await changeLanguage(code);
  }, []);

  const isKorean = currentLanguage === 'ko';
  const isEnglish = currentLanguage === 'en';

  return {
    t,
    i18n,
    currentLanguage,
    setLanguage,
    isKorean,
    isEnglish,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
};

export default useAppTranslation;
