/**
 * EnterCodeScreen - Child code entry screen
 *
 * Modern, clean design with:
 * - 6 separate input boxes for digits
 * - Auto-advance on input
 * - Numeric keyboard only
 * - Error handling and success confirmation
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ChildStackScreenProps } from '../../../../shared/types/navigation.types';
import { connectWithCode } from '../../../../shared/services/api';

type Props = ChildStackScreenProps<'EnterCode'>;

const CODE_LENGTH = 6;

const EnterCodeScreen = ({ navigation }: Props) => {
  const { t } = useTranslation(['family', 'common']);
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [parentName, setParentName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');

    if (numericValue.length <= 1) {
      const newCode = [...code];
      newCode[index] = numericValue;
      setCode(newCode);
      setErrorMessage(null);

      // Auto-advance to next input
      if (numericValue && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all digits entered
      if (numericValue && index === CODE_LENGTH - 1) {
        const fullCode = newCode.join('');
        if (fullCode.length === CODE_LENGTH) {
          Keyboard.dismiss();
          handleConnect(fullCode);
        }
      }
    } else if (numericValue.length > 1) {
      // Handle paste - distribute digits across inputs
      const digits = numericValue.slice(0, CODE_LENGTH - index).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      setErrorMessage(null);

      // Focus appropriate input after paste
      const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();

      // Auto-submit if full code pasted
      const fullCode = newCode.join('');
      if (fullCode.length === CODE_LENGTH) {
        Keyboard.dismiss();
        handleConnect(fullCode);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleConnect = async (fullCode?: string) => {
    const codeToUse = fullCode || code.join('');

    if (codeToUse.length !== CODE_LENGTH) {
      setErrorMessage(t('family:message.enterFullCode'));
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const result = await connectWithCode(codeToUse);

      if (result.success) {
        setIsSuccess(true);
        setParentName(result.parentName || t('family:label.parent'));
      } else {
        setErrorMessage(result.error || t('family:message.connectionFailed'));
        // Shake animation could be added here
      }
    } catch (err) {
      console.error('Connection error:', err);
      setErrorMessage(t('family:message.connectionFailedRetry'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCode = () => {
    setCode(Array(CODE_LENGTH).fill(''));
    setErrorMessage(null);
    inputRefs.current[0]?.focus();
  };

  const handleSuccessContinue = () => {
    // Navigate back to settings or home
    navigation.goBack();
  };

  // Success State
  if (isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <View className="flex-1 justify-center items-center p-8">
          <View className="mb-6">
            <Ionicons name="checkmark-circle" size={100} color="#22C55E" />
          </View>
          <Text className="text-4xl font-bold text-success mb-4">
            {t('family:title.connectionComplete')}
          </Text>
          <Text className="text-lg text-gray-600 text-center leading-7 mb-10">
            {t('family:message.connectedWith', { name: parentName })}
          </Text>
          <TouchableOpacity
            className="bg-success px-12 py-4 rounded-2xl shadow-lg"
            onPress={handleSuccessContinue}
            activeOpacity={0.8}
          >
            <Text className="text-lg font-bold text-white">{t('common:button.confirm')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 p-6">
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full bg-blue-100 justify-center items-center mb-5">
              <Ionicons name="people" size={48} color="#3B82F6" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-3">
              {t('family:title.connection')}
            </Text>
            <Text className="text-base text-gray-500 text-center leading-6">
              {t('family:instructions.enterCodeDescription')}
            </Text>
          </View>

          {/* Code Input */}
          <View className="mb-8">
            <View className="flex-row justify-center gap-2">
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className={`w-12 h-16 border-2 rounded-xl bg-white text-3xl font-bold text-center text-gray-900 ${
                    digit
                      ? 'border-primary bg-blue-50'
                      : errorMessage
                        ? 'border-error bg-red-50'
                        : 'border-gray-300'
                  }`}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  selectTextOnFocus
                  accessibilityLabel={t('family:label.codeDigit', { position: index + 1 })}
                />
              ))}
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View className="flex-row items-center justify-center mt-4 gap-2">
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text className="text-sm text-error text-center">{errorMessage}</Text>
              </View>
            )}

            {/* Clear Button */}
            {code.some((d) => d) && (
              <TouchableOpacity
                className="flex-row items-center justify-center mt-4 gap-1.5"
                onPress={handleClearCode}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#6B7280" />
                <Text className="text-sm text-gray-500">{t('family:button.clearCode')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Connect Button */}
          <TouchableOpacity
            className={`flex-row items-center justify-center h-14 rounded-2xl gap-2.5 shadow-md ${
              code.join('').length !== CODE_LENGTH ? 'bg-gray-400' : 'bg-primary'
            }`}
            onPress={() => handleConnect()}
            disabled={isLoading || code.join('').length !== CODE_LENGTH}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="link" size={24} color="#FFFFFF" />
                <Text className="text-lg font-bold text-white">{t('family:button.connect')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <View className="flex-row items-start justify-center mt-6 gap-2">
            <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
            <Text className="text-xs text-gray-400 leading-5">
              {t('family:message.codeValidityInfo')}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EnterCodeScreen;
