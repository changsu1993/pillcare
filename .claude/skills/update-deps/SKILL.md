---
name: update-deps
description: Update dependencies with security and Expo compatibility checks
version: 1.0.0
permissions:
  - bash
  - file:read
  - file:write
---

# Update Dependencies

Safely update project dependencies with compatibility verification.

## Update Process

### 1. Security Audit
```bash
npm audit
```
- List vulnerabilities by severity
- Identify critical updates needed

### 2. Check Outdated
```bash
npm outdated
```
- Current vs latest versions
- Highlight breaking changes (major versions)

### 3. Expo Compatibility
```bash
npx expo-doctor
```
- Verify Expo SDK compatibility
- Check React Native alignment
- Identify incompatible packages

### 4. Update Strategy

| Update Type | Risk | Action |
|-------------|------|--------|
| Patch (0.0.x) | Low | Auto-update safe |
| Minor (0.x.0) | Medium | Review changelog |
| Major (x.0.0) | High | Manual review required |

### 5. Recommended Order
1. Security vulnerabilities (critical/high)
2. Expo SDK and related packages
3. React Native core packages
4. Navigation packages
5. Other dependencies

### 6. Post-Update Verification
```bash
npm run typecheck
npm run lint
npm test
npx expo start
```

## Expo-Specific Packages

These must be updated together:
- expo
- react-native
- react-native-screens
- react-native-safe-area-context
- react-native-gesture-handler
- react-native-reanimated

Use `npx expo install` for these packages.

## Output
- Updated packages list
- Breaking changes to watch
- Remaining vulnerabilities
- Test results summary
