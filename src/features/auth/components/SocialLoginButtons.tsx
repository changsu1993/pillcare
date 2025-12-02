/**
 * SocialLoginButtons - Social Login Button Component
 *
 * Reusable component for Google and Apple sign-in buttons.
 * Displays loading states and handles authentication flow.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  signInWithGoogle,
  signInWithApple,
  isAppleAuthAvailable,
} from '../../../shared/services/oauth';

interface SocialLoginButtonsProps {
  disabled?: boolean;
  onAuthStart?: () => void;
  onAuthEnd?: () => void;
}

const SocialLoginButtons = ({
  disabled = false,
  onAuthStart,
  onAuthEnd,
}: SocialLoginButtonsProps) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isAppleLoading, setIsAppleLoading] = useState<boolean>(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState<boolean>(false);

  useEffect(() => {
    checkAppleAuthAvailability();
  }, []);

  const checkAppleAuthAvailability = async () => {
    const available = await isAppleAuthAvailable();
    setAppleAuthAvailable(available);
  };

  const handleGoogleSignIn = async () => {
    if (disabled || isGoogleLoading || isAppleLoading) return;

    try {
      setIsGoogleLoading(true);
      onAuthStart?.();
      await signInWithGoogle();
      // Navigation handled by auth state change in App.tsx
    } catch (error) {
      console.error('Google sign-in error:', error);
      const message = error instanceof Error ? error.message : 'Google 로그인에 실패했습니다.';

      if (!message.includes('취소')) {
        Alert.alert('로그인 실패', message);
      }
    } finally {
      setIsGoogleLoading(false);
      onAuthEnd?.();
    }
  };

  const handleAppleSignIn = async () => {
    if (disabled || isGoogleLoading || isAppleLoading) return;

    try {
      setIsAppleLoading(true);
      onAuthStart?.();
      await signInWithApple();
      // Navigation handled by auth state change in App.tsx
    } catch (error) {
      console.error('Apple sign-in error:', error);
      const message = error instanceof Error ? error.message : 'Apple 로그인에 실패했습니다.';

      if (!message.includes('취소')) {
        Alert.alert('로그인 실패', message);
      }
    } finally {
      setIsAppleLoading(false);
      onAuthEnd?.();
    }
  };

  const isLoading = isGoogleLoading || isAppleLoading;

  return (
    <View className="w-full gap-3">
      {/* Google Sign-In Button */}
      <TouchableOpacity
        className={`h-14 rounded-xl flex-row items-center justify-center bg-white border-2 border-gray-200 ${
          isLoading || disabled ? 'opacity-60' : ''
        }`}
        onPress={handleGoogleSignIn}
        disabled={isLoading || disabled}
        activeOpacity={0.7}
      >
        {isGoogleLoading ? (
          <ActivityIndicator color="#4285F4" />
        ) : (
          <>
            <View className="w-6 h-6 mr-3 items-center justify-center">
              <Ionicons name="logo-google" size={22} color="#4285F4" />
            </View>
            <Text className="text-base font-semibold text-gray-700">Google로 계속하기</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Apple Sign-In Button */}
      {appleAuthAvailable && (
        <TouchableOpacity
          className={`h-14 rounded-xl flex-row items-center justify-center bg-black ${
            isLoading || disabled ? 'opacity-60' : ''
          }`}
          onPress={handleAppleSignIn}
          disabled={isLoading || disabled}
          activeOpacity={0.7}
        >
          {isAppleLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <View className="w-6 h-6 mr-3 items-center justify-center">
                <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
              </View>
              <Text className="text-base font-semibold text-white">Apple로 계속하기</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SocialLoginButtons;
