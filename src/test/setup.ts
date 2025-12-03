/**
 * Jest Test Setup
 *
 * Global test configuration and mocks for PillCare app.
 * This file runs before each test file.
 */

// Note: @testing-library/react-native v12.4+ has built-in matchers
// No need to import extend-expect separately

// Mock react-native-url-polyfill (must be before any Supabase imports)
jest.mock('react-native-url-polyfill/auto', () => ({}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id-123'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[xxx]' }),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: {
    MAX: 5,
    HIGH: 4,
    DEFAULT: 3,
    LOW: 2,
    MIN: 1,
  },
  AndroidNotificationVisibility: {
    PUBLIC: 1,
    PRIVATE: 0,
    SECRET: -1,
  },
  AndroidNotificationPriority: {
    MAX: 2,
    HIGH: 1,
    DEFAULT: 0,
    LOW: -1,
    MIN: -2,
  },
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    TIME_INTERVAL: 'timeInterval',
    DATE: 'date',
  },
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn().mockResolvedValue({
    type: 'success',
    url: 'pillcare://auth/callback#access_token=test-token&refresh_token=refresh-token',
  }),
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
}));

// Mock expo-apple-authentication
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn().mockResolvedValue({
    identityToken: 'apple-identity-token',
    user: 'apple-user-id',
    email: 'test@apple.com',
    fullName: { givenName: 'Test', familyName: 'User' },
  }),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'pillcare://auth/callback'),
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  AuthSession: {
    makeRedirectUri: jest.fn(() => 'pillcare://auth/callback'),
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const MockIcon = () => Text;
  return {
    Ionicons: MockIcon,
    MaterialIcons: MockIcon,
    FontAwesome: MockIcon,
    Feather: MockIcon,
  };
});

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: 'test-project-id',
        },
      },
    },
    easConfig: {
      projectId: 'test-project-id',
    },
  },
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  createNavigationContainerRef: () => ({ current: null }),
}));

// Mock react-native Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj: any) => obj.ios || obj.default),
}));

// Mock react-native Appearance for NativeWind CSS interop
jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  setColorScheme: jest.fn(),
}));

// Mock react-native-css-interop
jest.mock('react-native-css-interop', () => ({
  cssInterop: jest.fn((component: any) => component),
  remapProps: jest.fn((component: any) => component),
  useColorScheme: jest.fn(() => 'light'),
}));

// Mock react-native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock Supabase client
const mockSupabaseAuth = {
  getUser: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    error: null,
  }),
  signUp: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null },
    error: null,
  }),
  signInWithPassword: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: {} },
    error: null,
  }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
  updateUser: jest.fn().mockResolvedValue({ error: null }),
  signInWithOAuth: jest.fn().mockResolvedValue({
    data: { url: 'https://accounts.google.com/oauth', provider: 'google' },
    error: null,
  }),
  signInWithIdToken: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id' }, session: {} },
    error: null,
  }),
  setSession: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id' }, session: {} },
    error: null,
  }),
};

const mockSupabaseFrom = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    })),
    removeChannel: jest.fn(),
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

// Export mock functions for test access
export const mockSupabase = {
  auth: mockSupabaseAuth,
  from: mockSupabaseFrom,
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless debugging
  log: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
  info: jest.fn(),
  debug: jest.fn(),
};
