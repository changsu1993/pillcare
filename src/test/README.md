# PillCare Test Suite Documentation

## Overview

This document outlines the comprehensive test suite for the PillCare React Native + Expo application. The tests focus on critical services and business logic for medication management for elderly users.

## Test Structure

```
src/
  test/
    setup.ts              # Jest test configuration and global mocks
    test-utils.tsx        # Reusable test utilities and mock factories
    README.md             # This documentation
  shared/
    services/
      __tests__/
        supabase.test.ts  # Authentication service tests
        api.test.ts       # API service tests
        oauth.test.ts     # OAuth flows tests
  features/
    auth/
      components/
        __tests__/
          SocialLoginButtons.test.tsx
      screens/
        __tests__/
          SignInScreen.test.tsx
          SignUpScreen.test.tsx
    notifications/
      services/
        __tests__/
          notifications.test.ts
    settings/
      services/
        __tests__/
          settings.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern='settings'

# Run tests in watch mode
npm run test:watch

# Run services tests only
npm run test:services

# Run component tests only
npm run test:components
```

## Test Categories

### 1. Settings Service Tests (30 tests)
- **File**: `src/features/settings/services/__tests__/settings.test.ts`
- **Coverage**: AsyncStorage operations, settings persistence
- **Key tests**:
  - Default settings for elderly users (voice guidance, vibration enabled)
  - Settings merge with defaults
  - Error handling with fail-safe defaults
  - Voice speed settings (0.7, 0.85, 1.0)
  - Settings reset functionality

### 2. Notifications Service Tests (30 tests)
- **File**: `src/features/notifications/services/__tests__/notifications.test.ts`
- **Coverage**: Push notifications, medication reminders
- **Key tests**:
  - Permission request flow (iOS/Android)
  - Medication reminder scheduling
  - Notification cancellation
  - Expo push token retrieval
  - Missed medication alerts
  - Android notification channel setup

### 3. OAuth Service Tests (18 tests)
- **File**: `src/shared/services/__tests__/oauth.test.ts`
- **Coverage**: Google and Apple sign-in flows
- **Key tests**:
  - Google OAuth flow initialization
  - Apple native authentication (iOS)
  - Apple OAuth fallback (Android)
  - Session creation from OAuth callback
  - User cancellation handling
  - Error handling for OAuth failures

### 4. Supabase Auth Tests
- **File**: `src/shared/services/__tests__/supabase.test.ts`
- **Coverage**: Authentication functions
- **Key tests**:
  - Sign up with metadata
  - Sign in with email/password
  - Password reset
  - Email lookup by phone/name
  - Email masking for privacy

### 5. API Service Tests
- **File**: `src/shared/services/__tests__/api.test.ts`
- **Coverage**: Medication, family, profile APIs
- **Key tests**:
  - CRUD operations for medications
  - Medication log creation (taken/missed)
  - Family connection management
  - Invitation code generation
  - Adherence rate calculation
  - Push token storage

### 6. Component Tests (Auth)
- **SocialLoginButtons**: Google/Apple button rendering and interaction
- **SignInScreen**: Form validation, navigation, API calls
- **SignUpScreen**: Registration flow, password validation, role selection

## Mock Setup

The test setup (`src/test/setup.ts`) includes mocks for:

- `@react-native-async-storage/async-storage`
- `expo-notifications`
- `expo-web-browser`
- `expo-apple-authentication`
- `expo-auth-session`
- `expo-constants`
- `@supabase/supabase-js`
- `@react-navigation/native`
- `react-native` (Platform, Alert, Appearance)
- `react-native-css-interop` (NativeWind support)

## Test Utilities

### Mock Data Factories

```typescript
import {
  createMockUser,
  createMockMedication,
  createMockMedicationLog,
  createMockFamilyConnection,
  createMockAppointment,
  createMockScheduledMedication,
  createMockMissedMedicationEvent,
  createMockNotificationPreferences,
  createMockAppSettings,
} from './test-utils';
```

### Navigation Mocks

```typescript
import {
  createMockNavigation,
  createMockRoute,
} from './test-utils';
```

## Coverage Thresholds

Current configuration in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 60,
    functions: 60,
    lines: 60,
    statements: 60,
  },
}
```

## Known Limitations

1. **NativeWind CSS Interop**: Component tests that use `@testing-library/react-native` may encounter issues with NativeWind's CSS interop. The mock setup includes workarounds for `react-native-css-interop`.

2. **Platform-specific tests**: Tests that depend on `Platform.OS` use a custom mock that allows changing the platform value between tests.

3. **Expo modules**: Some Expo modules require specific mocking patterns due to their native dependencies.

## Recommendations

### Increase Coverage
- Add integration tests for complete user flows
- Add E2E tests with Playwright/Detox for critical paths
- Add visual regression tests for UI components

### Test Priority by Business Impact
1. **High**: Medication reminders, notification delivery
2. **High**: Authentication and family connections
3. **Medium**: Adherence tracking and reports
4. **Medium**: Profile management
5. **Low**: Settings and preferences

### Future Test Additions
- [ ] Medication calendar view tests
- [ ] Adherence chart component tests
- [ ] Voice guidance service tests
- [ ] Deep linking tests
- [ ] Offline mode tests
- [ ] Data synchronization tests

## CI/CD Integration

For GitHub Actions, use the following workflow:

```yaml
- name: Run tests
  run: npm run test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```
