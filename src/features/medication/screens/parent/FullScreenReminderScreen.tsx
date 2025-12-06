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
import { useTranslation } from 'react-i18next';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { speakMedicationReminder, stopSpeaking } from '../../../notifications/services/voice';
import { isVoiceGuidanceEnabled, isVibrationEnabled } from '../../../settings/services/settings';
import { getMedication } from '../../../../shared/services/api';
import { Medication } from '../../../../shared/types/database.types';

type Props = ParentScreenProps<'FullScreenReminder'>;

const FullScreenReminderScreen = ({ route, navigation }: Props) => {
  const { medicationId, scheduledTime } = route.params;
  const { t } = useTranslation(['medication', 'common']);

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
        setError(t('alert.loadMedicationError'));
      } finally {
        setLoading(false);
      }
    };

    fetchMedication();
  }, [medicationId, t]);

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
      medicationName: medication?.name || t('label.name'),
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
        <Text className="text-2xl text-gray-900 mt-4">{t('message.loadingMedication')}</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !medication) {
    return (
      <SafeAreaView className="flex-1 bg-warning items-center justify-center p-6">
        <Text className="text-8xl mb-4">⚠️</Text>
        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
          {error || t('message.medicationNotFound')}
        </Text>
        <TouchableOpacity
          className="bg-gray-600 px-8 py-4 rounded-2xl"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-xl font-bold text-white">{t('button.goBack')}</Text>
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
        accessibilityLabel={t('accessibility.medicationName', { name: medication.name })}
        accessibilityRole="header"
      >
        {medication.name}
      </Text>

      {/* Dosage */}
      <Text
        className="text-4xl font-semibold text-gray-900 text-center mb-3"
        accessibilityLabel={`${t('label.dosage')}: ${medication.dosage}`}
      >
        {medication.dosage}
      </Text>

      {/* Time */}
      <Text
        className="text-3xl font-medium text-gray-900 text-center mb-12"
        accessibilityLabel={t('message.takenAt', {
          time: new Date(scheduledTime).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })}
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
          accessibilityLabel={t('accessibility.tookButton')}
          accessibilityHint={t('accessibility.tookHint')}
          accessibilityRole="button"
        >
          <Text className="text-xl font-bold text-white">{t('button.tookIt')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-gray-600 h-[72px] rounded-2xl justify-center items-center shadow-lg"
          onPress={handleSkipped}
          activeOpacity={0.7}
          accessibilityLabel={t('accessibility.didNotTakeButton')}
          accessibilityHint={t('accessibility.didNotTakeHint')}
          accessibilityRole="button"
        >
          <Text className="text-xl font-bold text-white">{t('button.didNotTake')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FullScreenReminderScreen;
