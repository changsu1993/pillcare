/**
 * ForgotPasswordScreen - Password Reset Request
 *
 * Allows users to request a password reset email.
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
import { resetPasswordForEmail } from '../../../shared/services/supabase';
import { AuthScreenProps } from '../../../shared/types/navigation.types';

type Props = AuthScreenProps<'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleResetPassword = async (): Promise<void> => {
    // Validation
    if (!email.trim()) {
      Alert.alert('입력 오류', '이메일을 입력해주세요.');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('입력 오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      await resetPasswordForEmail(email.trim());
      Alert.alert(
        '이메일 전송 완료',
        '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.',
        [
          {
            text: '확인',
            onPress: () => navigation.navigate('SignIn'),
          },
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '비밀번호 재설정 이메일 전송에 실패했습니다. 이메일 주소를 확인해주세요.';

      Alert.alert('전송 실패', errorMessage);
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
          <View className="mb-8">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
              <Text className="text-base text-primary">← 뒤로</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-bold text-gray-900 mb-2">비밀번호 찾기</Text>
            <Text className="text-base text-gray-500 leading-6">
              가입하신 이메일 주소를 입력하시면{'\n'}비밀번호 재설정 링크를 보내드립니다
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1">
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
                editable={!isLoading}
                accessibilityLabel="이메일 입력"
                accessibilityHint="비밀번호 재설정을 위한 이메일 주소를 입력하세요"
              />
            </View>

            {/* Reset password button */}
            <TouchableOpacity
              className={`h-14 rounded-xl items-center justify-center mt-2 bg-primary ${isLoading ? 'opacity-60' : ''}`}
              onPress={handleResetPassword}
              disabled={isLoading}
              accessibilityLabel="비밀번호 재설정 이메일 보내기"
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-lg font-semibold text-white">
                  비밀번호 재설정 이메일 보내기
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to sign in link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-sm text-gray-500">비밀번호가 기억나셨나요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')} disabled={isLoading}>
                <Text className="text-sm font-semibold text-primary">로그인하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
