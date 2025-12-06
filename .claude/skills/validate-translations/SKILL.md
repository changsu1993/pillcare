---
name: validate-translations
description: Validate translation files for completeness and consistency
version: 1.0.0
permissions:
  - file:read
  - bash:execute
---

# Validate Translations

Check translation files for completeness, consistency, and common issues.

## Validation Checks

### 1. Completeness Check
Compare all language files against base language (Korean).

```typescript
// Pseudo-code for validation
function validateCompleteness(base: object, target: object, path = ''): string[] {
  const missing: string[] = [];
  for (const key of Object.keys(base)) {
    const newPath = path ? `${path}.${key}` : key;
    if (!(key in target)) {
      missing.push(newPath);
    } else if (typeof base[key] === 'object') {
      missing.push(...validateCompleteness(base[key], target[key], newPath));
    }
  }
  return missing;
}
```

### 2. Interpolation Check
Ensure all interpolation variables match.

```json
// Korean
{ "greeting": "{{name}}님, 안녕하세요" }

// English - VALID
{ "greeting": "Hello, {{name}}" }

// English - INVALID (missing variable)
{ "greeting": "Hello there" }
```

### 3. Placeholder Consistency
```bash
# Find interpolation patterns
grep -o "{{[^}]*}}" src/i18n/locales/ko/*.json | sort | uniq
grep -o "{{[^}]*}}" src/i18n/locales/en/*.json | sort | uniq
```

### 4. JSON Syntax Validation
```bash
# Validate JSON files
for file in src/i18n/locales/*/*.json; do
  python3 -m json.tool "$file" > /dev/null || echo "Invalid: $file"
done
```

### 5. Empty String Check
```bash
# Find empty strings
grep -rn '": ""' src/i18n/locales/
grep -rn '": " "' src/i18n/locales/
```

### 6. Duplicate Key Check
```bash
# Check for duplicate keys in JSON
cat src/i18n/locales/ko/common.json | python3 -c "
import json, sys
from collections import Counter
data = json.load(sys.stdin)
# Flatten and count
"
```

## Validation Report Format

```markdown
# Translation Validation Report

Generated: 2024-XX-XX

## Summary
| Language | Total Keys | Translated | Missing | Completion |
|----------|------------|------------|---------|------------|
| ko (base)| 150        | 150        | 0       | 100%       |
| en       | 150        | 145        | 5       | 96.7%      |
| ja       | 150        | 120        | 30      | 80%        |

## Missing Translations

### English (en)
- [ ] medication.refillAlert.title
- [ ] medication.refillAlert.message
- [ ] settings.export.pdfOption
- [ ] settings.export.csvOption
- [ ] onboarding.step5.description

### Japanese (ja)
- [ ] (30 keys - see full list)

## Interpolation Mismatches
| Key | Expected | Actual (en) |
|-----|----------|-------------|
| greeting | {{name}} | (missing) |

## Warnings
- `auth.error.generic` - Very long string (>100 chars)
- `medication.dosage` - Contains HTML tags

## Action Items
1. Add 5 missing English translations
2. Review Japanese translations (80% complete)
3. Fix interpolation in `greeting` key
```

## Automated Script

### validate-i18n.ts
```typescript
import fs from 'fs';
import path from 'path';

const LOCALES_PATH = 'src/i18n/locales';
const BASE_LOCALE = 'ko';

interface ValidationResult {
  locale: string;
  namespace: string;
  missing: string[];
  interpolationErrors: string[];
  emptyStrings: string[];
}

function getNestedKeys(obj: object, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys.push(...getNestedKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function validateLocale(baseData: object, targetData: object): string[] {
  const baseKeys = getNestedKeys(baseData);
  const targetKeys = getNestedKeys(targetData);
  return baseKeys.filter(key => !targetKeys.includes(key));
}

// Run validation
const locales = fs.readdirSync(LOCALES_PATH)
  .filter(f => fs.statSync(path.join(LOCALES_PATH, f)).isDirectory());

console.log('Validating translations...');
// ... implementation
```

## CI Integration

### GitHub Action
```yaml
- name: Validate Translations
  run: |
    npx ts-node scripts/validate-i18n.ts
    if [ $? -ne 0 ]; then
      echo "Translation validation failed"
      exit 1
    fi
```

## Quality Thresholds

| Metric | Warning | Error |
|--------|---------|-------|
| Completion | <95% | <80% |
| Missing interpolations | >0 | >5 |
| Empty strings | >0 | >10 |

## Post-Validation
1. Fix all errors first
2. Address warnings
3. Re-run validation
4. Commit with validation passing
