/**
 * SignUpScreen - User Registration
 *
 * Allows new users to create an account.
 * Collects: email, password, name, phone, role (parent/child)
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
import { signUp } from '../../../shared/services/supabase';
import { AuthScreenProps } from '../../../shared/types/navigation.types';
import { UserRole } from '../../../shared/types/database.types';

type Props = AuthScreenProps<'SignUp'>;

const SignUpScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<UserRole>('child'); // Default to 'child'
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSignUp = async (): Promise<void> => {
    // Validation
    if (!email.trim() || !password || !name.trim()) {
      Alert.alert('입력 오류', '필수 항목을 모두 입력해주세요.');
      return;
    }

    // SECURITY: Enforce strong password policy
    // Reference: OWASP - Identification and Authentication Failures (A07:2021)
    // Requirements: At least 8 characters, at least one letter, at least one number
    if (password.length < 8) {
      Alert.alert('비밀번호 오류', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
      Alert.alert('비밀번호 오류', '비밀번호는 영문자와 숫자를 모두 포함해야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('비밀번호 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setIsLoading(true);

      // Sign up with Supabase
      // The database trigger will automatically create the user profile
      const data = await signUp(email.trim(), password, {
        name: name.trim(),
        phone: phone.trim(),
        role: role, // Include role in metadata for trigger
      });

      if (!data?.user) {
        throw new Error('회원가입에 실패했습니다.');
      }

      Alert.alert('회원가입 완료', '환영합니다! 로그인해주세요.', [
        {
          text: '확인',
          onPress: () => navigation.navigate('SignIn'),
        },
      ]);
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage =
        error instanceof Error ? error.message : '회원가입에 실패했습니다. 다시 시도해주세요.';

      Alert.alert('회원가입 실패', errorMessage);
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
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
              <Text className="text-base text-primary">← 뒤로</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-bold text-gray-900 mb-2">회원가입</Text>
            <Text className="text-base text-gray-500">PillCare 시작하기</Text>
          </View>

          {/* Form */}
          <View className="flex-1">
            {/* Role selection */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">사용자 유형</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className={`flex-1 h-[52px] border-2 rounded-xl items-center justify-center ${
                    role === 'parent' ? 'border-primary bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setRole('parent')}
                  disabled={isLoading}
                >
                  <Text
                    className={`text-base font-semibold ${
                      role === 'parent' ? 'text-primary' : 'text-gray-500'
                    }`}
                  >
                    부모 (복약 관리)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 h-[52px] border-2 rounded-xl items-center justify-center ${
                    role === 'child' ? 'border-primary bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setRole('child')}
                  disabled={isLoading}
                >
                  <Text
                    className={`text-base font-semibold ${
                      role === 'child' ? 'text-primary' : 'text-gray-500'
                    }`}
                  >
                    자녀 (모니터링)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">이름 *</Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder="홍길동"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            {/* Email input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">이메일 *</Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder="example@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Phone input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">전화번호 (선택)</Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder="010-1234-5678"
                placeholderTextColor="#9CA3AF"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            {/* Password input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                비밀번호 * (8자 이상, 영문+숫자 포함)
              </Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Confirm password input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">비밀번호 확인 *</Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder="비밀번호를 다시 입력하세요"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Sign up button */}
            <TouchableOpacity
              className={`h-14 rounded-xl items-center justify-center mt-2 bg-primary ${isLoading ? 'opacity-60' : ''}`}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-lg font-semibold text-white">회원가입</Text>
              )}
            </TouchableOpacity>

            {/* Sign in link */}
            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-sm text-gray-500">이미 계정이 있으신가요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')} disabled={isLoading}>
                <Text className="text-sm font-semibold text-primary">로그인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
