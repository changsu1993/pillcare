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
import { useTranslation } from 'react-i18next';
import { resetPasswordForEmail } from '../../../shared/services/supabase';
import { AuthScreenProps } from '../../../shared/types/navigation.types';

type Props = AuthScreenProps<'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const { t } = useTranslation(['auth', 'common']);
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleResetPassword = async (): Promise<void> => {
    // Validation
    if (!email.trim()) {
      Alert.alert(t('auth:error.inputError'), t('auth:error.emptyEmail'));
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('auth:error.inputError'), t('auth:error.invalidEmailFormat'));
      return;
    }

    try {
      setIsLoading(true);
      await resetPasswordForEmail(email.trim());
      Alert.alert(t('auth:message.emailSent'), t('auth:message.resetEmailSent'), [
        {
          text: t('common:button.confirm'),
          onPress: () => navigation.navigate('SignIn'),
        },
      ]);
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('auth:error.resetEmailFailed');

      Alert.alert(t('auth:error.sendFailed'), errorMessage);
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
              <Text className="text-base text-primary">{`← ${t('auth:nav.back')}`}</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-bold text-gray-900 mb-2">
              {t('auth:title.forgotPassword')}
            </Text>
            <Text className="text-base text-gray-500 leading-6">
              {t('auth:subtitle.forgotPasswordDesc')}
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1">
            {/* Email input */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                {t('auth:label.email')}
              </Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder={t('auth:placeholder.emailExample')}
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                accessibilityLabel={t('auth:accessibility.emailInput')}
                accessibilityHint={t('auth:accessibility.emailInputHint')}
              />
            </View>

            {/* Reset password button */}
            <TouchableOpacity
              className={`h-14 rounded-xl items-center justify-center mt-2 bg-primary ${isLoading ? 'opacity-60' : ''}`}
              onPress={handleResetPassword}
              disabled={isLoading}
              accessibilityLabel={t('auth:accessibility.sendResetEmail')}
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-lg font-semibold text-white">
                  {t('auth:button.sendResetEmail')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to sign in link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-sm text-gray-500">{t('auth:link.rememberPassword')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')} disabled={isLoading}>
                <Text className="text-sm font-semibold text-primary">
                  {t('auth:link.goToSignIn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
