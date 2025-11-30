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

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Vibration, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { speakMedicationReminder, stopSpeaking } from '../../../notifications/services/voice';
import { isVoiceGuidanceEnabled, isVibrationEnabled } from '../../../settings/services/settings';
import { getMedication } from '../../../../shared/services/api';
import { Medication } from '../../../../shared/types/database.types';

type Props = ParentScreenProps<'FullScreenReminder'>;

const FullScreenReminderScreen = ({ route, navigation }: Props) => {
  const { medicationId, scheduledTime } = route.params;

  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch medication details from API
  useEffect(() => {
    const fetchMedication = async () => {
      try {
        setLoading(true);
        setError(null);
        const medicationData = await getMedication(medicationId);
        setMedication(medicationData);
      } catch (err) {
        console.error('Error fetching medication:', err);
        setError('약 정보를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchMedication();
  }, [medicationId]);

  // Initialize notifications (vibration and voice) after medication is loaded
  useEffect(() => {
    if (!medication) return;

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
          await speakMedicationReminder(medication.name, medication.dosage);
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
  }, [medication]);

  const handleTaken = () => {
    // Stop any ongoing speech before navigation
    stopSpeaking();

    // Navigate to confirmation screen
    navigation.replace('Confirmation', {
      medicationName: medication?.name || '약',
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

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-warning items-center justify-center p-6">
        <ActivityIndicator size="large" color="#1F2937" />
        <Text className="text-2xl text-gray-900 mt-4">약 정보 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !medication) {
    return (
      <SafeAreaView className="flex-1 bg-warning items-center justify-center p-6">
        <Text className="text-8xl mb-4">⚠️</Text>
        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
          {error || '약 정보를 찾을 수 없습니다'}
        </Text>
        <TouchableOpacity
          className="bg-gray-600 px-8 py-4 rounded-2xl"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-xl font-bold text-white">돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-warning items-center justify-center p-6">
      {/* Medication icon */}
      <View className="mb-8">
        <Text className="text-8xl">💊</Text>
      </View>

      {/* Medication name */}
      <Text
        className="text-5xl font-bold text-gray-900 text-center mb-4"
        accessibilityLabel={`약 이름: ${medication.name}`}
        accessibilityRole="header"
      >
        {medication.name}
      </Text>

      {/* Dosage */}
      <Text
        className="text-4xl font-semibold text-gray-900 text-center mb-3"
        accessibilityLabel={`복용량: ${medication.dosage}`}
      >
        {medication.dosage}
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
