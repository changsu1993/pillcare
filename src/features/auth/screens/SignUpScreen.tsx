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
import { useTranslation } from 'react-i18next';
import { signUp } from '../../../shared/services/supabase';
import { AuthScreenProps } from '../../../shared/types/navigation.types';
import { UserRole } from '../../../shared/types/database.types';

type Props = AuthScreenProps<'SignUp'>;

const SignUpScreen = ({ navigation }: Props) => {
  const { t } = useTranslation(['auth', 'common']);
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
      Alert.alert(t('auth:error.inputError'), t('auth:error.emptyRequiredFields'));
      return;
    }

    // SECURITY: Enforce strong password policy
    // Reference: OWASP - Identification and Authentication Failures (A07:2021)
    // Requirements: At least 8 characters, at least one letter, at least one number
    if (password.length < 8) {
      Alert.alert(t('auth:error.inputError'), t('auth:error.invalidPasswordMin8'));
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
      Alert.alert(t('auth:error.inputError'), t('auth:error.invalidPasswordFormat'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('auth:error.inputError'), t('auth:error.passwordMismatch'));
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
        throw new Error(t('auth:error.signUpFailed'));
      }

      Alert.alert(t('auth:message.signUpComplete'), t('auth:message.signUpWelcome'), [
        {
          text: t('common:button.confirm'),
          onPress: () => navigation.navigate('SignIn'),
        },
      ]);
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('auth:error.signUpFailedDetail');

      Alert.alert(t('auth:error.signUpFailed'), errorMessage);
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
          <View className="mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
              <Text className="text-base text-primary">{`← ${t('auth:nav.back')}`}</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-bold text-gray-900 mb-2">
              {t('auth:title.signUp')}
            </Text>
            <Text className="text-base text-gray-500">{t('auth:subtitle.getStarted')}</Text>
          </View>

          {/* Form */}
          <View className="flex-1">
            {/* Role selection */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                {t('auth:label.userType')}
              </Text>
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
                    {t('auth:role.parentShort')}
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
                    {t('auth:role.childShort')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                {t('auth:label.nameRequired')}
              </Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder={t('auth:placeholder.nameExample')}
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            {/* Email input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                {t('auth:label.emailRequired')}
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
              />
            </View>

            {/* Phone input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                {t('auth:label.phoneOptional')}
              </Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder={t('auth:placeholder.phoneExample')}
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
                {t('auth:label.passwordRequired')}
              </Text>
              <TextInput
                className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
                placeholder={t('auth:placeholder.password')}
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
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                {t('auth:label.confirmPasswordRequired')}
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
                <Text className="text-lg font-semibold text-white">{t('auth:button.signUp')}</Text>
              )}
            </TouchableOpacity>

            {/* Sign in link */}
            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-sm text-gray-500">{t('auth:link.hasAccount')} </Text>
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

export default SignUpScreen;
