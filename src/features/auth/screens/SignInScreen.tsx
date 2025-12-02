/**
 * SignInScreen - User Login
 *
 * Allows users to sign in with email/password or social login.
 * Integrates with Supabase authentication.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn } from '../../../shared/services/supabase';
import { AuthScreenProps } from '../../../shared/types/navigation.types';
import SocialLoginButtons from '../components/SocialLoginButtons';

type Props = AuthScreenProps<'SignIn'>;

const SignInScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<boolean>(false);

  const isAnyLoading = isLoading || isOAuthLoading;

  const handleSignIn = async (): Promise<void> => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email.trim(), password);
      // Navigation will be handled automatically by App.js auth state change
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';

      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mb-6"
              disabled={isAnyLoading}
            >
              <Text className="text-base text-primary">← 뒤로</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-bold text-gray-900 mb-2">로그인</Text>
            <Text className="text-base text-gray-500">PillCare에 오신 것을 환영합니다</Text>
          </View>

          {/* Form */}
          <View className="flex-1">
            {/* Social Login Buttons */}
            <SocialLoginButtons
              disabled={isLoading}
              onAuthStart={() => setIsOAuthLoading(true)}
              onAuthEnd={() => setIsOAuthLoading(false)}
            />

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-sm text-gray-400">또는 이메일로 로그인</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Email input */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2">이메일</Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder="example@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isAnyLoading}
              />
            </View>

            {/* Password input */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2">비밀번호</Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isAnyLoading}
              />
            </View>

            {/* Forgot credentials links */}
            <View className="flex-row justify-center items-center mt-4 mb-2">
              <TouchableOpacity
                onPress={() => navigation.navigate('FindEmail')}
                disabled={isAnyLoading}
              >
                <Text className="text-sm text-gray-500">아이디 찾기</Text>
              </TouchableOpacity>
              <Text className="text-sm text-gray-300 mx-3">|</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={isAnyLoading}
              >
                <Text className="text-sm text-gray-500">비밀번호 찾기</Text>
              </TouchableOpacity>
            </View>

            {/* Sign in button */}
            <TouchableOpacity
              className={`h-14 rounded-xl items-center justify-center mt-2 bg-primary ${isAnyLoading ? 'opacity-60' : ''}`}
              onPress={handleSignIn}
              disabled={isAnyLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-lg font-semibold text-white">로그인</Text>
              )}
            </TouchableOpacity>

            {/* Sign up link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-sm text-gray-500">계정이 없으신가요? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SignUp')}
                disabled={isAnyLoading}
              >
                <Text className="text-sm font-semibold text-primary">회원가입</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignInScreen;
