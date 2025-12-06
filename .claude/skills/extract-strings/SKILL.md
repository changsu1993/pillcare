---
name: extract-strings
description: Extract hardcoded Korean strings from codebase for i18n
version: 1.0.0
permissions:
  - file:read
  - bash:execute
---

# Extract Hardcoded Strings

Systematically extract hardcoded Korean strings from React Native components for internationalization.

## Search Patterns

### Korean Text in JSX
```bash
# Find Korean characters in TSX files
grep -rn "[가-힣]" src/ --include="*.tsx" --include="*.ts"

# Find strings in Text components
grep -rn "<Text[^>]*>[^<]*[가-힣][^<]*</Text>" src/ --include="*.tsx"

# Find placeholder/label attributes
grep -rn "placeholder=\"[^\"]*[가-힣]" src/ --include="*.tsx"
grep -rn "label=\"[^\"]*[가-힣]" src/ --include="*.tsx"

# Find Alert messages
grep -rn "Alert.alert([^)]*[가-힣]" src/ --include="*.tsx" --include="*.ts"
```

## String Categories

### By Feature (Namespace)
| Namespace | Description | Example Keys |
|-----------|-------------|--------------|
| common | Shared strings | loading, error, confirm |
| auth | Authentication | signIn, signUp, forgotPassword |
| medication | Medication feature | addMedication, dosage, reminder |
| family | Family connection | connectParent, invitationCode |
| settings | Settings | notifications, voiceGuidance |
| onboarding | Tutorial | welcome, getStarted |
| home | Home screens | todayMedications, adherenceRate |
| reports | Reports/Export | weeklyReport, exportPdf |

### String Types
| Type | Example | Key Convention |
|------|---------|----------------|
| Button | "저장" | button.save |
| Label | "이메일" | label.email |
| Message | "저장되었습니다" | message.saved |
| Error | "오류가 발생했습니다" | error.generic |
| Title | "약 추가하기" | title.addMedication |
| Placeholder | "이메일을 입력하세요" | placeholder.email |
| Alert Title | "알림" | alert.title.notification |
| Alert Message | "정말 삭제하시겠습니까?" | alert.message.confirmDelete |

## Extraction Process

### Step 1: Scan by Feature
```
src/features/auth/         → auth.json
src/features/medication/   → medication.json
src/features/family/       → family.json
src/features/settings/     → settings.json
src/features/onboarding/   → onboarding.json
src/features/home/         → home.json
src/features/reports/      → reports.json
src/shared/                → common.json
```

### Step 2: Create Key Names
```
// Before
<Text>불러오는 중...</Text>

// After (Key: common:loading)
<Text>{t('common:loading')}</Text>
```

### Step 3: Generate JSON
```json
{
  "loading": "불러오는 중...",
  "loadingProfile": "프로필 설정 중..."
}
```

## Output Format

### Extraction Report
```markdown
## Extracted Strings Report

### auth.json (15 strings)
| Key | Korean | Location |
|-----|--------|----------|
| title.signIn | 로그인 | SignInScreen.tsx:45 |
| button.signIn | 로그인 | SignInScreen.tsx:78 |
...

### medication.json (32 strings)
...
```

### JSON Output
```json
{
  "title": {
    "signIn": "로그인",
    "signUp": "회원가입"
  },
  "button": {
    "signIn": "로그인",
    "signUp": "회원가입"
  },
  "placeholder": {
    "email": "이메일을 입력하세요",
    "password": "비밀번호를 입력하세요"
  }
}
```

## Exclusions
- Developer comments
- Console.log messages (dev only)
- Test file strings
- Type definitions

## Quality Checks
- [ ] No duplicate keys
- [ ] Consistent key naming
- [ ] All user-facing strings captured
- [ ] Context preserved for translators
- [ ] Pluralization cases identified
- [ ] Dynamic strings with interpolation marked

## Post-Extraction
1. Create namespace JSON files
2. Update components with t() calls
3. Run validation skill
4. Test in app
