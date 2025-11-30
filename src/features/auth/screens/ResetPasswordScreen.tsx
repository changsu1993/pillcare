/**
 * ResetPasswordScreen - Set New Password
 *
 * Allows users to set a new password after password reset request.
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
import { updatePassword } from '../../../shared/services/supabase';
import { AuthScreenProps } from '../../../shared/types/navigation.types';

type Props = AuthScreenProps<'ResetPassword'>;

const MIN_PASSWORD_LENGTH = 6;

const ResetPasswordScreen = ({ navigation, route }: Props) => {
  const email = route.params?.email;

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isPasswordLongEnough = newPassword.length >= MIN_PASSWORD_LENGTH;
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid = isPasswordLongEnough && doPasswordsMatch;

  const handleResetPassword = async (): Promise<void> => {
    // Validation
    if (!newPassword.trim()) {
      Alert.alert('입력 오류', '새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('입력 오류', `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setIsLoading(true);
      await updatePassword(newPassword);

      Alert.alert(
        '비밀번호 변경 완료',
        '비밀번호가 성공적으로 변경되었습니다.\n새 비밀번호로 로그인해주세요.',
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
        error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다. 다시 시도해주세요.';

      Alert.alert('비밀번호 변경 실패', errorMessage);
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
            <Text className="text-[32px] font-bold text-gray-900 mb-2">새 비밀번호 설정</Text>
            <Text className="text-base text-gray-500">
              {email ? `${email} 계정의 새 비밀번호를 설정합니다` : '새 비밀번호를 설정해주세요'}
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1">
            {/* New Password input */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2">새 비밀번호</Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder="새 비밀번호를 입력하세요"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {/* Password requirement hint */}
              <View className="mt-2">
                <Text
                  className={`text-sm ${isPasswordLongEnough ? 'text-green-500' : 'text-error'}`}
                >
                  {isPasswordLongEnough ? 'v' : 'o'} {MIN_PASSWORD_LENGTH}자 이상
                </Text>
              </View>
            </View>

            {/* Confirm Password input */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2">비밀번호 확인</Text>
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
              {/* Password match hint */}
              {confirmPassword.length > 0 && (
                <View className="mt-2">
                  <Text className={`text-sm ${doPasswordsMatch ? 'text-green-500' : 'text-error'}`}>
                    {doPasswordsMatch
                      ? 'v 비밀번호가 일치합니다'
                      : 'o 비밀번호가 일치하지 않습니다'}
                  </Text>
                </View>
              )}
            </View>

            {/* Reset Password button */}
            <TouchableOpacity
              className={`h-14 rounded-xl items-center justify-center mt-2 bg-primary ${
                !isFormValid || isLoading ? 'opacity-60' : ''
              }`}
              onPress={handleResetPassword}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-lg font-semibold text-white">비밀번호 변경</Text>
              )}
            </TouchableOpacity>

            {/* Back to Sign In link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-sm text-gray-500">비밀번호가 기억나셨나요? </Text>
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

export default ResetPasswordScreen;
