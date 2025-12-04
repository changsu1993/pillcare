/**
 * PillCare - Main App Entry Point
 *
 * Handles:
 * - Navigation setup (Stack + Bottom Tabs)
 * - Authentication state management
 * - Role-based routing (Parent vs Child app)
 */

import './global.css';
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
import { ThemeProvider, useTheme } from './src/shared/contexts/ThemeContext';

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
 * Theme-aware StatusBar component
 * Adjusts status bar style based on current theme
 */
const ThemedStatusBar = () => {
  const { isDarkMode } = useTheme();
  return <StatusBar style={isDarkMode ? 'light' : 'dark'} />;
};

/**
 * Main App Content component (needs to be inside ThemeProvider)
 */
const AppContent = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const isPasswordRecoveryRef = useRef<boolean>(false);
  const { isDarkMode } = useTheme();

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

      if (session?.user) {
        setUser(session.user);
        await loadUserRole();
      } else {
        setUser(null);
        setUserRole(null);
        isPasswordRecoveryRef.current = false;
        setIsPasswordRecovery(false);
      }
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
    // 알림 응답 리스너 (사용자가 알림을 탭했을 때)
    const notificationResponseSubscription = registerNotificationResponseListener(
      (response) => {
        if (__DEV__) {
          console.log('알림 응답:', response);
        }
        handleNotificationResponse(response);
      }
    );

    // Foreground 알림 리스너 (앱이 열려있을 때 알림 수신)
    const foregroundSubscription = registerForegroundNotificationListener(
      (notification) => {
        if (__DEV__) {
          console.log('Foreground 알림 수신:', notification);
        }
        // 앱이 열려있을 때는 자동으로 화면 전환
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
   * 알림 응답 처리 (사용자가 알림을 탭했을 때)
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
      // 부모 앱: FullScreenReminderScreen으로 이동
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
      // 자녀 앱: 홈 화면으로 이동 (부모님 복약 현황 확인)
      // Note: 자녀 Navigator의 Home 탭으로 이동
      if (__DEV__) {
        console.log('Missed medication notification tapped - navigating to home');
      }
      navigationRef.current?.navigate('HomeTab');
    }
  };

  /**
   * Foreground 알림 처리 (앱이 열려있을 때)
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
      // 부모 앱: 자동으로 FullScreenReminderScreen으로 이동
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

  const loadUserRole = async () => {
    try {
      const profile = await getUserProfile();
      setUserRole(profile?.role || null);
      if (__DEV__) {
        console.log('User role:', profile?.role);
      }

      // Initialize push token after user is loaded
      initializePushToken();
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole(null);
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
        <Text className={`mt-4 text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>PillCare 로딩 중...</Text>
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
    });
  }

  return (
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
      ) : !userRole ? (
        // Logged in but no role assigned yet
        <View className={`flex-1 justify-center items-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className={`mt-4 text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>프로필 설정 중...</Text>
        </View>
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
  );
};

/**
 * Main App component - wraps everything with providers
 */
export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}
