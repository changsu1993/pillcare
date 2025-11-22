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
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChildStackScreenProps } from '../../types/navigation.types';
import { connectWithCode, getConnectedParent } from '../../services/api';

type Props = ChildStackScreenProps<'EnterCode'>;

const CODE_LENGTH = 6;

const EnterCodeScreen: React.FC<Props> = ({ navigation }) => {
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
      setErrorMessage('6자리 코드를 모두 입력해 주세요');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const result = await connectWithCode(codeToUse);

      if (result.success) {
        setIsSuccess(true);
        setParentName(result.parentName || '부모님');
      } else {
        setErrorMessage(result.error || '연결에 실패했습니다');
        // Shake animation could be added here
      }
    } catch (err) {
      console.error('Connection error:', err);
      setErrorMessage('연결에 실패했습니다.\n다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCode = () => {
    setCode(Array(CODE_LENGTH).fill(''));
    setErrorMessage(null);
    inputRefs.current[0]?.focus();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSuccessContinue = () => {
    // Navigate back to settings or home
    navigation.goBack();
  };

  // Success State
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={100} color="#22C55E" />
          </View>
          <Text style={styles.successTitle}>연결 완료!</Text>
          <Text style={styles.successMessage}>
            {parentName}님과 가족으로 연결되었습니다.{'\n'}
            이제 부모님의 복약 현황을 확인할 수 있습니다.
          </Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={handleSuccessContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.successButtonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={48} color="#3B82F6" />
            </View>
            <Text style={styles.title}>가족 연결</Text>
            <Text style={styles.subtitle}>
              부모님이 알려주신 6자리 초대 코드를{'\n'}입력해 주세요
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            <View style={styles.codeInputRow}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled,
                    errorMessage && styles.codeInputError,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  selectTextOnFocus
                  accessibilityLabel={`코드 ${index + 1}번째 자리`}
                />
              ))}
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Clear Button */}
            {code.some((d) => d) && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCode}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#6B7280" />
                <Text style={styles.clearButtonText}>코드 지우기</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Connect Button */}
          <TouchableOpacity
            style={[
              styles.connectButton,
              code.join('').length !== CODE_LENGTH && styles.connectButtonDisabled,
            ]}
            onPress={() => handleConnect()}
            disabled={isLoading || code.join('').length !== CODE_LENGTH}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="link" size={24} color="#FFFFFF" />
                <Text style={styles.connectButtonText}>연결하기</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
            <Text style={styles.helpText}>
              코드는 24시간 동안만 유효합니다.{'\n'}
              부모님께 새 코드를 요청해 주세요.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  codeContainer: {
    marginBottom: 32,
  },
  codeInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  codeInput: {
    width: 48,
    height: 64,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A1A1A',
  },
  codeInputFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  codeInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    height: 56,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  // Success State Styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  successButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EnterCodeScreen;
