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
  StyleSheet,
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← 뒤로</Text>
            </TouchableOpacity>
            <Text style={styles.title}>새 비밀번호 설정</Text>
            <Text style={styles.subtitle}>
              {email ? `${email} 계정의 새 비밀번호를 설정합니다` : '새 비밀번호를 설정해주세요'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* New Password input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>새 비밀번호</Text>
              <TextInput
                style={styles.input}
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
              <View style={styles.hintContainer}>
                <Text
                  style={[
                    styles.hintText,
                    isPasswordLongEnough ? styles.hintValid : styles.hintInvalid,
                  ]}
                >
                  {isPasswordLongEnough ? 'v' : 'o'} {MIN_PASSWORD_LENGTH}자 이상
                </Text>
              </View>
            </View>

            {/* Confirm Password input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <TextInput
                style={styles.input}
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
                <View style={styles.hintContainer}>
                  <Text
                    style={[
                      styles.hintText,
                      doPasswordsMatch ? styles.hintValid : styles.hintInvalid,
                    ]}
                  >
                    {doPasswordsMatch
                      ? 'v 비밀번호가 일치합니다'
                      : 'o 비밀번호가 일치하지 않습니다'}
                  </Text>
                </View>
              )}
            </View>

            {/* Reset Password button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                (!isFormValid || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>비밀번호 변경</Text>
              )}
            </TouchableOpacity>

            {/* Back to Sign In link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>비밀번호가 기억나셨나요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')} disabled={isLoading}>
                <Text style={styles.link}>로그인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  hintContainer: {
    marginTop: 8,
  },
  hintText: {
    fontSize: 14,
  },
  hintValid: {
    color: '#10B981',
  },
  hintInvalid: {
    color: '#EF4444',
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default ResetPasswordScreen;
