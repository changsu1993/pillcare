/**
 * i18n TypeScript Types
 *
 * Provides type safety for translation keys.
 * Auto-generates types from Korean (base) translation files.
 */

import 'i18next';
import ko from './locales/ko';

// Type for all translation resources
export type TranslationResources = typeof ko;

// Extend i18next module for type safety
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: TranslationResources;
  }
}

// Helper type for nested key paths
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

// Type for translation keys by namespace
export type CommonKeys = NestedKeyOf<TranslationResources['common']>;
export type AuthKeys = NestedKeyOf<TranslationResources['auth']>;
export type MedicationKeys = NestedKeyOf<TranslationResources['medication']>;
export type FamilyKeys = NestedKeyOf<TranslationResources['family']>;
export type SettingsKeys = NestedKeyOf<TranslationResources['settings']>;
export type OnboardingKeys = NestedKeyOf<TranslationResources['onboarding']>;
export type HomeKeys = NestedKeyOf<TranslationResources['home']>;
export type ReportsKeys = NestedKeyOf<TranslationResources['reports']>;
