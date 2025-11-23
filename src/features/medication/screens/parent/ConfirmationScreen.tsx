/**
 * ConfirmationScreen - Success confirmation after taking medication
 *
 * Shows large checkmark and success message.
 * Auto-returns to home after 3 seconds.
 *
 * Accessibility:
 * - WCAG AAA compliance
 * - Large success icon (120px)
 * - Voice feedback with expo-speech
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { speakConfirmation, stopSpeaking } from '../../../notifications/services/voice';
import { isVoiceGuidanceEnabled } from '../../../settings/services/settings';

type Props = ParentScreenProps<'Confirmation'>;

const ConfirmationScreen = ({ route, navigation }: Props) => {
  const { medicationName, takenAt } = route.params;

  useEffect(() => {
    // Speak confirmation message if voice guidance is enabled
    const speakConfirmationMessage = async () => {
      try {
        const voiceEnabled = await isVoiceGuidanceEnabled();
        if (voiceEnabled) {
          await speakConfirmation(medicationName);
        }
      } catch (error) {
        console.error('Error speaking confirmation:', error);
      }
    };

    speakConfirmationMessage();

    // Auto-return to home after 3 seconds
    const timer = setTimeout(() => {
      navigation.navigate('Home');
    }, 3000);

    return () => {
      clearTimeout(timer);
      // Stop any ongoing speech when leaving screen
      stopSpeaking();
    };
  }, [navigation, medicationName]);

  const handleGoHome = () => {
    // Stop any ongoing speech before navigation
    stopSpeaking();
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Success icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon} accessibilityLabel="성공">
          ✓
        </Text>
      </View>

      {/* Success message */}
      <Text style={styles.title} accessibilityLabel="잘하셨어요!" accessibilityRole="header">
        잘하셨어요!
      </Text>

      {/* Medication name */}
      <Text style={styles.medicationName} accessibilityLabel={`복용한 약: ${medicationName}`}>
        {medicationName}
      </Text>

      {/* Time taken */}
      <Text
        style={styles.time}
        accessibilityLabel={`복용 시간: ${new Date(takenAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })}`}
      >
        {new Date(takenAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>

      {/* Home button */}
      <TouchableOpacity
        style={styles.homeButton}
        onPress={handleGoHome}
        activeOpacity={0.7}
        accessibilityLabel="홈으로 가기 버튼"
        accessibilityHint="홈 화면으로 이동합니다"
        accessibilityRole="button"
      >
        <Text style={styles.homeButtonText}>홈으로</Text>
      </TouchableOpacity>

      {/* Auto-return hint */}
      <Text style={styles.hint}>3초 후 자동으로 돌아갑니다</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#22C55E', // Success green
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 80,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 24,
  },
  medicationName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  time: {
    fontSize: 24,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
  },
  homeButton: {
    backgroundColor: '#3B82F6', // Primary blue
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  homeButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
  },
});

export default ConfirmationScreen;
