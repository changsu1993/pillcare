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
  StyleSheet,
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
            <Text style={styles.title}>비밀번호 찾기</Text>
            <Text style={styles.subtitle}>
              가입하신 이메일 주소를 입력하시면{'\n'}비밀번호 재설정 링크를 보내드립니다
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
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
              style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
              accessibilityLabel="비밀번호 재설정 이메일 보내기"
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>비밀번호 재설정 이메일 보내기</Text>
              )}
            </TouchableOpacity>

            {/* Back to sign in link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>비밀번호가 기억나셨나요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')} disabled={isLoading}>
                <Text style={styles.link}>로그인하기</Text>
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
    lineHeight: 24,
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

export default ForgotPasswordScreen;
