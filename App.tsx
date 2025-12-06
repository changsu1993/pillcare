/**
 * PillCare - Main App Entry Point
 *
 * Handles:
 * - Navigation setup (Stack + Bottom Tabs)
 * - Authentication state management
 * - Role-based routing (Parent vs Child app)
 * - Onboarding flow for new users
 */

import './global.css';
import './src/i18n'; // Initialize i18n
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { ActivityIndicator, View, Text } from 'react-native';
import { User } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

// Services
import { getCurrentUser, onAuthStateChange, supabase } from './src/shared/services/supabase';
import { getUserProfile, savePushToken } from './src/shared/services/api';
import {
  registerNotificationResponseListener,
  registerForegroundNotificationListener,
  getExpoPushToken,
} from './src/features/notifications/services/notifications';

// Types
import { UserRole, NotificationData, MissedMedicationNotificationData } from './src/shared/types/database.types';

// Navigation
import ParentNavigator from './src/navigation/ParentNavigator';
import ChildNavigator from './src/navigation/ChildNavigator';
import AuthNavigator from './src/features/auth/navigation/AuthNavigator';

// Screens
import ResetPasswordScreen from './src/features/auth/screens/ResetPasswordScreen';

// Contexts
import { SettingsProvider } from './src/features/settings/contexts/SettingsContext';
import { ThemeProvider, useTheme } from './src/shared/contexts';

// Onboarding
import {
  OnboardingNavigator,
  isOnboardingCompleted,
  setOnboardingCompleted,
  setDontShowAgain,
} from './src/features/onboarding';

// Deep linking configuration
const linking = {
  prefixes: [Linking.createURL('/'), 'pillcare://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

/**
 * ThemedStatusBar - Status bar that adapts to dark mode
 */
const ThemedStatusBar = () => {
  const { isDarkMode } = useTheme();
  return <StatusBar style={isDarkMode ? 'light' : 'dark'} />;
};

/**
 * AppContent - Main app content wrapped with theme context
 */
function AppContent() {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingChecked, setOnboardingChecked] = useState<boolean>(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const isPasswordRecoveryRef = useRef<boolean>(false);
  const isRoleLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    // Check initial auth state
    checkUser();

    // Listen to auth changes
    // SECURITY: Only log auth events in development mode
    // Reference: OWASP - Security Logging and Monitoring Failures (A09:2021)
    const authListener = onAuthStateChange(async (event, session) => {
      if (__DEV__) {
        console.log('Auth event:', event);
        console.log('isPasswordRecoveryRef.current:', isPasswordRecoveryRef.current);
      }

      // Handle password recovery event
      if (event === 'PASSWORD_RECOVERY') {
        if (__DEV__) {
          console.log('Password recovery mode activated via PASSWORD_RECOVERY event');
        }
        isPasswordRecoveryRef.current = true;
        setIsPasswordRecovery(true);
        setUser(session?.user || null);
        return;
      }

      // If in password recovery mode, don't load user role
      // This prevents the app from showing the home screen during password reset
      if (isPasswordRecoveryRef.current && session?.user) {
        if (__DEV__) {
          console.log('In password recovery mode - skipping role load');
        }
        setUser(session.user);
        return;
      }

      // Only handle significant auth events (not token refresh)
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          setUser(session.user);
          await loadUserRole();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        setShowOnboarding(false);
        setOnboardingChecked(false);
        isPasswordRecoveryRef.current = false;
        setIsPasswordRecovery(false);
        isRoleLoadedRef.current = false;
      }
      // Ignore TOKEN_REFRESHED and other events to prevent flickering
    });

    // Handle deep link URL for password recovery
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      if (__DEV__) {
        console.log('[Deep Link] Received URL:', url);
      }

      // Extract tokens from URL if present
      if (url.includes('access_token') || url.includes('refresh_token')) {
        try {
          // Parse URL to extract tokens
          const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');

          if (__DEV__) {
            console.log('[Deep Link] Parsed params:', {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              type,
            });
          }

          if (accessToken && refreshToken && type === 'recovery') {
            // Set password recovery mode BEFORE setting session
            // This ensures the auth listener doesn't try to load user role
            if (__DEV__) {
              console.log('[Deep Link] Password recovery type detected - setting recovery mode');
            }
            isPasswordRecoveryRef.current = true;
            setIsPasswordRecovery(true);

            // Set session with tokens
            if (__DEV__) {
              console.log('[Deep Link] Calling setSession with tokens');
            }
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              if (__DEV__) {
                console.error('[Deep Link] Error setting session:', error);
              }
              isPasswordRecoveryRef.current = false;
              setIsPasswordRecovery(false);
            } else {
              if (__DEV__) {
                console.log('[Deep Link] Session set successfully - should show ResetPasswordScreen');
              }
            }
          }
        } catch (error) {
          if (__DEV__) {
            console.error('[Deep Link] Error parsing deep link:', error);
          }
        }
      }
    };

    // Check for initial URL
    Linking.getInitialURL().then(handleDeepLink);

    // Listen for URL changes
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Cleanup
    return () => {
      authListener?.data?.subscription?.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  useEffect(() => {
    // Notification response listener (when user taps notification)
    const notificationResponseSubscription = registerNotificationResponseListener(
      (response) => {
        if (__DEV__) {
          console.log('Notification response:', response);
        }
        handleNotificationResponse(response);
      }
    );

    // Foreground notification listener (when app is open)
    const foregroundSubscription = registerForegroundNotificationListener(
      (notification) => {
        if (__DEV__) {
          console.log('Foreground notification received:', notification);
        }
        // Auto-navigate when app is open
        handleForegroundNotification(notification);
      }
    );

    // Cleanup
    return () => {
      notificationResponseSubscription.remove();
      foregroundSubscription.remove();
    };
  }, [userRole]);

  /**
   * Handle notification response (when user taps notification)
   */
  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    const data = response.notification.request.content.data;

    if (!data || typeof data !== 'object' || !('type' in data)) {
      return;
    }

    // Parent app: medication reminder
    if (
      data.type === 'medication_reminder' &&
      'medicationId' in data &&
      'scheduledTime' in data &&
      userRole === 'parent'
    ) {
      // Parent app: Navigate to FullScreenReminderScreen
      navigationRef.current?.navigate('FullScreenReminder', {
        medicationId: String(data.medicationId),
        scheduledTime: String(data.scheduledTime),
      });
    }

    // Child app: missed medication notification
    if (
      data.type === 'missed_medication' &&
      userRole === 'child'
    ) {
      // Child app: Navigate to home screen to check parent's medication status
      // Note: Navigate to Home tab in Child Navigator
      if (__DEV__) {
        console.log('Missed medication notification tapped - navigating to home');
      }
      navigationRef.current?.navigate('HomeTab');
    }
  };

  /**
   * Foreground notification handling (when app is open)
   */
  const handleForegroundNotification = (
    notification: Notifications.Notification
  ) => {
    const data = notification.request.content.data;

    // Type guard to ensure data is NotificationData
    if (
      data &&
      typeof data === 'object' &&
      'type' in data &&
      data.type === 'medication_reminder' &&
      'medicationId' in data &&
      'scheduledTime' in data &&
      userRole === 'parent'
    ) {
      // Parent app: Auto-navigate to FullScreenReminderScreen
      setTimeout(() => {
        navigationRef.current?.navigate('FullScreenReminder', {
          medicationId: String(data.medicationId),
          scheduledTime: String(data.scheduledTime),
        });
      }, 500);
    }
  };

  const checkUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        await loadUserRole();
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load user role from profile - idempotent function
   * Uses ref to prevent multiple calls causing flickering
   */
  const loadUserRole = async () => {
    // Skip if already loaded to prevent flickering from multiple calls
    if (isRoleLoadedRef.current) {
      if (__DEV__) {
        console.log('loadUserRole skipped - already loaded');
      }
      return;
    }
    isRoleLoadedRef.current = true;

    try {
      const profile = await getUserProfile();
      setUserRole(profile?.role || null);
      if (__DEV__) {
        console.log('User role:', profile?.role);
      }

      // Check onboarding status for the role
      if (profile?.role) {
        const completed = await isOnboardingCompleted(profile.role);
        setShowOnboarding(!completed);
        setOnboardingChecked(true);
        if (__DEV__) {
          console.log('Onboarding completed:', completed, 'Show onboarding:', !completed);
        }
      }

      // Initialize push token after user is loaded
      initializePushToken();
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole(null);
      // Reset ref on error so it can be retried
      isRoleLoadedRef.current = false;
    }
  };

  /**
   * Handle onboarding completion
   */
  const handleOnboardingComplete = async () => {
    if (userRole) {
      try {
        await setOnboardingCompleted(userRole);
        setShowOnboarding(false);
        if (__DEV__) {
          console.log('Onboarding completed for role:', userRole);
        }
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Still hide onboarding even if storage fails
        setShowOnboarding(false);
      }
    }
  };

  /**
   * Handle navigation to family connection (child only)
   */
  const handleConnectParent = async () => {
    if (userRole === 'child') {
      try {
        await setOnboardingCompleted(userRole);
        setShowOnboarding(false);
        // Navigate to settings tab to enter code
        setTimeout(() => {
          navigationRef.current?.navigate('SettingsTab', {
            screen: 'EnterCode',
          });
        }, 100);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        setShowOnboarding(false);
      }
    }
  };

  /**
   * Initialize push token and save to database
   */
  const initializePushToken = async () => {
    try {
      const token = await getExpoPushToken();
      if (token) {
        await savePushToken(token);
        if (__DEV__) {
          console.log('Push token saved successfully');
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error initializing push token:', error);
      }
      // Non-critical error - app can continue without push token
    }
  };

  if (isLoading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className={`mt-4 text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          PillCare 로딩 중...
        </Text>
      </View>
    );
  }

  // Handler for successful password reset
  const handlePasswordResetSuccess = () => {
    isPasswordRecoveryRef.current = false;
    setIsPasswordRecovery(false);
    setUser(null);
    setUserRole(null);
  };

  // Role-based navigation
  if (__DEV__) {
    console.log('[Render] State:', {
      isPasswordRecovery,
      hasUser: !!user,
      userRole,
      showOnboarding,
      onboardingChecked,
    });
  }

  return (
    <SettingsProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <ThemedStatusBar />
        {isPasswordRecovery ? (
          // Password recovery mode - show reset password screen
          <ResetPasswordScreen
            navigation={{
              navigate: (screen: string) => {
                if (screen === 'SignIn') {
                  handlePasswordResetSuccess();
                }
              },
              goBack: handlePasswordResetSuccess,
            } as any}
            route={{ params: { email: user?.email } } as any}
          />
        ) : !user ? (
          // Not logged in - show auth screens
          <AuthNavigator />
        ) : !userRole || !onboardingChecked ? (
          // Logged in but no role assigned yet or checking onboarding
          <View className={`flex-1 justify-center items-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className={`mt-4 text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              프로필 설정 중...
            </Text>
          </View>
        ) : showOnboarding ? (
          // Show onboarding for new users
          <OnboardingNavigator
            role={userRole}
            onComplete={handleOnboardingComplete}
            onConnectParent={userRole === 'child' ? handleConnectParent : undefined}
          />
        ) : userRole === 'parent' ? (
          // Parent app (elderly-optimized UI)
          <ParentNavigator />
        ) : userRole === 'child' ? (
          // Child app (monitoring UI)
          <ChildNavigator />
        ) : (
          // Unknown role
          <View className={`flex-1 items-center justify-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <Text className={`text-lg text-error text-center leading-relaxed`}>
              알 수 없는 사용자 역할입니다.{'\n'}
              설정을 확인해주세요.
            </Text>
          </View>
        )}
      </NavigationContainer>
    </SettingsProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
