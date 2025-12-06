---
name: setup-i18n
description: Initialize i18n infrastructure with i18next for React Native
version: 1.0.0
permissions:
  - file:write
  - bash:execute
---

# Setup Internationalization (i18n)

Initialize complete i18n infrastructure for React Native with i18next.

## Prerequisites
- React Native / Expo project
- TypeScript configured

## Installation

```bash
# Install i18next packages
npx expo install i18next react-i18next expo-localization

# Install async storage for language persistence
npx expo install @react-native-async-storage/async-storage
```

## Directory Structure

```
src/i18n/
├── index.ts                 # i18n configuration
├── types.ts                 # TypeScript types
├── languageDetector.ts      # Device language detection
└── locales/
    ├── ko/                  # Korean (default)
    │   ├── common.json      # Common strings
    │   ├── auth.json        # Authentication
    │   ├── medication.json  # Medication feature
    │   ├── family.json      # Family connection
    │   ├── settings.json    # Settings
    │   ├── onboarding.json  # Onboarding
    │   └── index.ts         # Namespace exports
    ├── en/                  # English
    │   └── ...
    └── index.ts             # All locales export
```

## Configuration Template

### src/i18n/index.ts
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ko from './locales/ko';
import en from './locales/en';

const LANGUAGE_KEY = '@pillcare_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      const deviceLanguage = Localization.locale.split('-')[0];
      callback(deviceLanguage || 'ko');
    } catch {
      callback('ko');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: { ko, en },
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: ['common', 'auth', 'medication', 'family', 'settings', 'onboarding'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

### src/i18n/types.ts
```typescript
import ko from './locales/ko';

export type TranslationResources = typeof ko;
export type Namespace = keyof TranslationResources;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: TranslationResources;
  }
}
```

## Namespace Template (JSON)

### locales/ko/common.json
```json
{
  "appName": "필케어",
  "loading": "불러오는 중...",
  "error": "오류가 발생했습니다",
  "retry": "다시 시도",
  "cancel": "취소",
  "confirm": "확인",
  "save": "저장",
  "delete": "삭제",
  "edit": "수정",
  "back": "뒤로",
  "next": "다음",
  "done": "완료",
  "yes": "예",
  "no": "아니오"
}
```

## App Integration

### App.tsx
```typescript
import './src/i18n'; // Import at the top

// In component:
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
// Usage: t('common:loading')
```

## Supported Languages
| Code | Language | Status |
|------|----------|--------|
| ko | Korean | Default |
| en | English | Supported |
| ja | Japanese | Future |
| zh-CN | Chinese (Simplified) | Future |

## Post-Setup Checklist
- [ ] Install dependencies
- [ ] Create directory structure
- [ ] Configure i18n instance
- [ ] Add TypeScript types
- [ ] Import in App.tsx
- [ ] Create base translation files
- [ ] Test language switching
