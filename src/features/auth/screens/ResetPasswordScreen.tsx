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
import { useTranslation } from 'react-i18next';
import { updatePassword } from '../../../shared/services/supabase';
import { AuthScreenProps } from '../../../shared/types/navigation.types';

type Props = AuthScreenProps<'ResetPassword'>;

const MIN_PASSWORD_LENGTH = 6;

const ResetPasswordScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation(['auth', 'common']);
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
      Alert.alert(t('auth:error.inputError'), t('auth:error.emptyNewPassword'));
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      Alert.alert(
        t('auth:error.inputError'),
        t('auth:error.passwordMinLength', { count: MIN_PASSWORD_LENGTH })
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('auth:error.inputError'), t('auth:error.passwordMismatch'));
      return;
    }

    try {
      setIsLoading(true);
      await updatePassword(newPassword);

      Alert.alert(
        t('auth:message.passwordChangeComplete'),
        t('auth:message.passwordChangeSuccess'),
        [
          {
            text: t('common:button.confirm'),
            onPress: () => navigation.navigate('SignIn'),
          },
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('auth:error.passwordChangeFailed2');

      Alert.alert(t('auth:error.passwordChangeFailed'), errorMessage);
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
          contentContainerClassName="flex-grow px-6 py-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-8">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
              <Text className="text-base text-primary">{`← ${t('auth:nav.back')}`}</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-bold text-gray-900 mb-2">
              {t('auth:title.newPassword')}
            </Text>
            <Text className="text-base text-gray-500">
              {email
                ? t('auth:subtitle.newPasswordWithEmail', { email })
                : t('auth:subtitle.newPasswordDefault')}
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1">
            {/* New Password input */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                {t('auth:label.newPassword')}
              </Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder={t('auth:placeholder.newPassword')}
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
                  {isPasswordLongEnough ? 'v' : 'o'}{' '}
                  {t('auth:validation.minChars', { count: MIN_PASSWORD_LENGTH })}
                </Text>
              </View>
            </View>

            {/* Confirm Password input */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                {t('auth:label.confirmPassword')}
              </Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder={t('auth:placeholder.confirmPassword')}
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
                      ? `v ${t('auth:validation.passwordsMatch')}`
                      : `o ${t('auth:validation.passwordsNotMatch')}`}
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
                <Text className="text-lg font-semibold text-white">
                  {t('auth:button.changePassword')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Sign In link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-sm text-gray-500">{t('auth:link.rememberPassword')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')} disabled={isLoading}>
                <Text className="text-sm font-semibold text-primary">
                  {t('auth:button.signIn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;
