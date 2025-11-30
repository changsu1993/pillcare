/**
 * PillCare - Main App Entry Point
 *
 * Handles:
 * - Navigation setup (Stack + Bottom Tabs)
 * - Authentication state management
 * - Role-based routing (Parent vs Child app)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
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

// Deep linking configuration
const linking = {
  prefixes: [Linking.createURL('/'), 'pillcare://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const isPasswordRecoveryRef = useRef<boolean>(false);

  useEffect(() => {
    // Check initial auth state
    checkUser();

    // Listen to auth changes
    const authListener = onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      console.log('isPasswordRecoveryRef.current:', isPasswordRecoveryRef.current);

      // Handle password recovery event
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery mode activated via PASSWORD_RECOVERY event');
        isPasswordRecoveryRef.current = true;
        setIsPasswordRecovery(true);
        setUser(session?.user || null);
        return;
      }

      // If in password recovery mode, don't load user role
      // This prevents the app from showing the home screen during password reset
      if (isPasswordRecoveryRef.current && session?.user) {
        console.log('In password recovery mode - skipping role load');
        setUser(session.user);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        await loadUserRole(session.user.id);
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

      console.log('[Deep Link] Received URL:', url);

      // Extract tokens from URL if present
      if (url.includes('access_token') || url.includes('refresh_token')) {
        try {
          // Parse URL to extract tokens
          const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');

          console.log('[Deep Link] Parsed params:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            type,
          });

          if (accessToken && refreshToken && type === 'recovery') {
            // Set password recovery mode BEFORE setting session
            // This ensures the auth listener doesn't try to load user role
            console.log('[Deep Link] Password recovery type detected - setting recovery mode');
            isPasswordRecoveryRef.current = true;
            setIsPasswordRecovery(true);

            // Set session with tokens
            console.log('[Deep Link] Calling setSession with tokens');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('[Deep Link] Error setting session:', error);
              isPasswordRecoveryRef.current = false;
              setIsPasswordRecovery(false);
            } else {
              console.log('[Deep Link] Session set successfully - should show ResetPasswordScreen');
            }
          }
        } catch (error) {
          console.error('[Deep Link] Error parsing deep link:', error);
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
        console.log('알림 응답:', response);
        handleNotificationResponse(response);
      }
    );

    // Foreground 알림 리스너 (앱이 열려있을 때 알림 수신)
    const foregroundSubscription = registerForegroundNotificationListener(
      (notification) => {
        console.log('Foreground 알림 수신:', notification);
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
      console.log('Missed medication notification tapped - navigating to home');
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
        await loadUserRole(currentUser.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserRole = async (userId: string) => {
    try {
      const profile = await getUserProfile();
      setUserRole(profile?.role || null);
      console.log('User role:', profile?.role);

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
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Error initializing push token:', error);
      // Non-critical error - app can continue without push token
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>PillCare 로딩 중...</Text>
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
  console.log('[Render] State:', {
    isPasswordRecovery,
    hasUser: !!user,
    userRole,
  });

  return (
    <SettingsProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <StatusBar style="auto" />
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>프로필 설정 중...</Text>
          </View>
        ) : userRole === 'parent' ? (
          // Parent app (elderly-optimized UI)
          <ParentNavigator />
        ) : userRole === 'child' ? (
          // Child app (monitoring UI)
          <ChildNavigator />
        ) : (
          // Unknown role
          <View style={styles.container}>
            <Text style={styles.errorText}>
              알 수 없는 사용자 역할입니다.{'\n'}
              설정을 확인해주세요.
            </Text>
          </View>
        )}
      </NavigationContainer>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  title: {
    fontSize: 48,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    lineHeight: 26,
  },
});
