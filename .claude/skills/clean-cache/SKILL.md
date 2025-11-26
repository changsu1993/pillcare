---
name: clean-cache
description: Clean all caches and reset development environment
version: 1.0.0
permissions:
  - bash
---

# Clean Cache and Reset Environment

Clear all caches when experiencing build issues.

## When to Use
- Mysterious build errors
- "Unable to resolve module" errors
- Metro bundler crashes
- Stale cache issues
- After major dependency updates

## Clean Process

### 1. Stop Running Processes
```bash
# Kill Expo/Metro processes
pkill -f "expo" || true
pkill -f "metro" || true
pkill -f "react-native" || true
```

### 2. Clear Caches

**Metro Bundler**
```bash
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*
```

**NPM Cache**
```bash
npm cache clean --force
```

**Watchman (if installed)**
```bash
watchman watch-del-all 2>/dev/null || true
```

**iOS (macOS only)**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
cd ios && pod cache clean --all 2>/dev/null || true
```

**Android**
```bash
cd android && ./gradlew clean 2>/dev/null || true
```

### 3. Reinstall Dependencies
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### 4. Start Fresh
```bash
npx expo start --clear
```

## Quick Clean (Minimal)
For minor issues:
```bash
npx expo start --clear
```

## Full Clean (Nuclear Option)
For persistent issues - runs all steps above.

## Verification
- Metro starts without errors
- App builds successfully
- No module resolution errors
