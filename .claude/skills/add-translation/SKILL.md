---
name: add-translation
description: Add translations for a new language to existing i18n setup
version: 1.0.0
permissions:
  - file:write
  - file:read
---

# Add Translation for New Language

Add complete translations for a new language based on existing Korean (ko) base.

## Arguments Required
- **Language Code**: ISO 639-1 code (e.g., `en`, `ja`, `zh-CN`)
- **Language Name**: Display name (e.g., `English`, `日本語`)

## Supported Languages

| Code | Name | Status | Notes |
|------|------|--------|-------|
| ko | 한국어 | Base | Default language |
| en | English | Priority | US English |
| ja | 日本語 | Secondary | Polite form |
| zh-CN | 简体中文 | Secondary | Simplified Chinese |
| zh-TW | 繁體中文 | Future | Traditional Chinese |
| vi | Tiếng Việt | Future | Vietnamese |

## Translation Process

### Step 1: Create Language Directory
```bash
mkdir -p src/i18n/locales/{lang_code}
```

### Step 2: Copy Structure from Korean
```bash
# Copy all JSON files
cp src/i18n/locales/ko/*.json src/i18n/locales/{lang_code}/
cp src/i18n/locales/ko/index.ts src/i18n/locales/{lang_code}/
```

### Step 3: Translate Each Namespace

#### common.json
```json
{
  "ko": { "loading": "불러오는 중..." },
  "en": { "loading": "Loading..." },
  "ja": { "loading": "読み込み中..." },
  "zh-CN": { "loading": "加载中..." }
}
```

#### Healthcare-Specific Terms

| Korean | English | Japanese | Chinese |
|--------|---------|----------|---------|
| 약 | Medication | お薬 | 药物 |
| 복용 | Take (medicine) | 服用 | 服用 |
| 알림 | Reminder | リマインダー | 提醒 |
| 복용률 | Adherence Rate | 服薬率 | 服药率 |
| 가족 연결 | Family Connection | 家族連携 | 家庭连接 |

### Step 4: Update i18n Config
```typescript
// src/i18n/index.ts
import en from './locales/en';
// Add to resources
resources: { ko, en }
```

### Step 5: Add Language Selector
```typescript
// Available languages for settings
export const LANGUAGES = [
  { code: 'ko', name: '한국어', nativeName: '한국어' },
  { code: 'en', name: 'English', nativeName: 'English' },
] as const;
```

## Translation Guidelines

### For English
- Use simple, direct language
- Active voice preferred
- Avoid medical jargon
- "Take your medication" not "Administer your pharmaceutical"

### For Japanese
- Use です/ます form (polite)
- Appropriate keigo for elderly context
- お薬 (polite) rather than 薬

### For Chinese
- Simplified characters (zh-CN)
- Formal but friendly tone
- Clear medical terminology

## Pluralization

### English (has plural forms)
```json
{
  "medicationCount": "{{count}} medication",
  "medicationCount_plural": "{{count}} medications"
}
```

### Korean/Japanese/Chinese (no grammatical plural)
```json
{
  "medicationCount": "약 {{count}}개"
}
```

## Date/Time Formatting

| Locale | Date Format | Time Format |
|--------|-------------|-------------|
| ko | YYYY년 M월 D일 | HH:mm |
| en | MMM D, YYYY | h:mm A |
| ja | YYYY年M月D日 | HH:mm |
| zh-CN | YYYY年M月D日 | HH:mm |

## File Checklist

For each new language, create:
- [ ] common.json
- [ ] auth.json
- [ ] medication.json
- [ ] family.json
- [ ] settings.json
- [ ] onboarding.json
- [ ] home.json
- [ ] reports.json
- [ ] index.ts (exports)

## Post-Translation
1. Update i18n/index.ts resources
2. Add to LANGUAGES constant
3. Update settings screen language picker
4. Run validate-translations skill
5. Test all screens in new language
