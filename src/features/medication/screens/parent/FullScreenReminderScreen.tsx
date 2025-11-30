/**
 * FullScreenReminderScreen - Full-screen medication reminder
 *
 * Displays when it's time to take medication.
 * Large text, high contrast, simple 2-button interface.
 *
 * Accessibility:
 * - WCAG AAA compliance (7:1 contrast)
 * - 72px button height
 * - 48pt medication name
 * - Voice guidance with expo-speech
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { speakMedicationReminder, stopSpeaking } from '../../../notifications/services/voice';
import { isVoiceGuidanceEnabled, isVibrationEnabled } from '../../../settings/services/settings';

type Props = ParentScreenProps<'FullScreenReminder'>;

const FullScreenReminderScreen = ({ route, navigation }: Props) => {
  const { medicationId, scheduledTime } = route.params;

  // TODO: Fetch medication details from API
  const medicationName = '혈압약';
  const dosage = '1알';

  useEffect(() => {
    // Initialize notifications (vibration and voice)
    const initializeReminder = async () => {
      try {
        // Check vibration setting and vibrate if enabled
        const vibrationEnabled = await isVibrationEnabled();
        if (vibrationEnabled) {
          // Vibration pattern: [duration, pause, duration, pause, ...]
          Vibration.vibrate([500, 500, 500, 500, 500]);
        }

        // Check voice setting and speak if enabled
        const voiceEnabled = await isVoiceGuidanceEnabled();
        if (voiceEnabled) {
          await speakMedicationReminder(medicationName, dosage);
        }
      } catch (error) {
        console.error('Error initializing reminder:', error);
      }
    };

    initializeReminder();

    return () => {
      Vibration.cancel();
      // Stop any ongoing speech when leaving screen
      stopSpeaking();
    };
  }, [medicationName, dosage]);

  const handleTaken = () => {
    // Stop any ongoing speech before navigation
    stopSpeaking();

    // Navigate to confirmation screen
    navigation.replace('Confirmation', {
      medicationName,
      takenAt: new Date().toISOString(),
    });
  };

  const handleSkipped = () => {
    // Stop any ongoing speech before navigation
    stopSpeaking();

    // Navigate to skip reason screen
    navigation.replace('SkipReason', {
      medicationId,
      scheduledTime,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-warning items-center justify-center p-6">
      {/* Medication icon */}
      <View className="mb-8">
        <Text className="text-8xl">💊</Text>
      </View>

      {/* Medication name */}
      <Text
        className="text-5xl font-bold text-gray-900 text-center mb-4"
        accessibilityLabel={`약 이름: ${medicationName}`}
        accessibilityRole="header"
      >
        {medicationName}
      </Text>

      {/* Dosage */}
      <Text
        className="text-4xl font-semibold text-gray-900 text-center mb-3"
        accessibilityLabel={`복용량: ${dosage}`}
      >
        {dosage}
      </Text>

      {/* Time */}
      <Text
        className="text-3xl font-medium text-gray-900 text-center mb-12"
        accessibilityLabel={`복용 시간: ${new Date(scheduledTime).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })}`}
      >
        {new Date(scheduledTime).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>

      {/* Action buttons */}
      <View className="flex-row w-full justify-between gap-4">
        <TouchableOpacity
          className="flex-1 bg-success h-[72px] rounded-2xl justify-center items-center shadow-lg"
          onPress={handleTaken}
          activeOpacity={0.7}
          accessibilityLabel="먹었어요 버튼"
          accessibilityHint="약을 복용했을 때 누르세요"
          accessibilityRole="button"
        >
          <Text className="text-xl font-bold text-white">먹었어요</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-gray-600 h-[72px] rounded-2xl justify-center items-center shadow-lg"
          onPress={handleSkipped}
          activeOpacity={0.7}
          accessibilityLabel="못 먹었어요 버튼"
          accessibilityHint="약을 복용하지 못했을 때 누르세요"
          accessibilityRole="button"
        >
          <Text className="text-xl font-bold text-white">못 먹었어요</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FullScreenReminderScreen;
