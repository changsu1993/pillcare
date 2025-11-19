/**
 * PillCare - Main App Entry Point
 *
 * Handles:
 * - Navigation setup (Stack + Bottom Tabs)
 * - Authentication state management
 * - Role-based routing (Parent vs Child app)
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { User } from '@supabase/supabase-js';

// Services
import { getCurrentUser, onAuthStateChange } from './src/services/supabase';
import { getUserProfile } from './src/services/api';

// Types
import { UserRole } from './src/types/database.types';

// Navigation
import ParentNavigator from './src/navigation/ParentNavigator';
import ChildNavigator from './src/navigation/ChildNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Check initial auth state
    checkUser();

    // Listen to auth changes
    const authListener = onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      if (session?.user) {
        setUser(session.user);
        await loadUserRole(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    // Cleanup
    return () => {
      authListener?.data?.subscription?.unsubscribe();
    };
  }, []);

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
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole(null);
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

  // Role-based navigation
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {!user ? (
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
