/**
 * SkipReasonScreen - Select reason for skipping medication
 *
 * Large buttons with icons for easy selection.
 * Each button logs the reason and returns to home.
 *
 * Accessibility:
 * - WCAG AAA compliance
 * - 72px button height
 * - Clear icons and labels
 * - Voice guidance with expo-speech
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import {
  logMedicationMissed,
  getMedication,
  createMissedMedicationEvent,
  sendMissedMedicationPushNotification,
} from '../../../../shared/services/api';
import { speakSkipPrompt, stopSpeaking } from '../../../notifications/services/voice';
import { isVoiceGuidanceEnabled } from '../../../settings/services/settings';
import type { SkipReasonLabelKey } from '../../../../i18n/types';

type Props = ParentScreenProps<'SkipReason'>;

type SkipReason = 'forgot' | 'no_medication' | 'felt_sick' | 'at_hospital' | 'other';

interface ReasonOption {
  key: SkipReason;
  labelKey: SkipReasonLabelKey;
  icon: string;
}

const REASONS: ReasonOption[] = [
  { key: 'forgot', labelKey: 'skipReason.forgot', icon: '😴' },
  { key: 'no_medication', labelKey: 'skipReason.noMedicine', icon: '💊' },
  { key: 'felt_sick', labelKey: 'skipReason.feltSick', icon: '🤢' },
  { key: 'at_hospital', labelKey: 'skipReason.atHospital', icon: '🏥' },
  { key: 'other', labelKey: 'skipReason.other', icon: '❓' },
];

const SkipReasonScreen = ({ route, navigation }: Props) => {
  const { medicationId, scheduledTime } = route.params;
  const { t } = useTranslation(['medication', 'common']);
  const [isLoading, setIsLoading] = useState(false);

  // Speak skip prompt when screen appears
  useEffect(() => {
    const speakPrompt = async () => {
      try {
        const voiceEnabled = await isVoiceGuidanceEnabled();
        if (voiceEnabled) {
          await speakSkipPrompt();
        }
      } catch (error) {
        console.error('Error speaking skip prompt:', error);
      }
    };

    speakPrompt();

    return () => {
      // Stop any ongoing speech when leaving screen
      stopSpeaking();
    };
  }, []);

  const handleReasonSelect = async (reason: SkipReason) => {
    try {
      setIsLoading(true);

      // Stop any ongoing speech
      stopSpeaking();

      // Log the skipped medication with reason
      await logMedicationMissed(medicationId, new Date(scheduledTime), reason);

      // Get medication details for the event
      try {
        const medication = await getMedication(medicationId);

        // Create missed medication event for child notifications
        const missedEvent = await createMissedMedicationEvent(
          medicationId,
          medication.name,
          new Date(scheduledTime),
          reason
        );

        // Send push notification to connected children
        await sendMissedMedicationPushNotification(missedEvent);
      } catch (eventError) {
        // Log error but don't block the main flow
        console.error('미복용 이벤트 생성 실패:', eventError);
        // Continue to navigate - the main log was saved
      }

      // Navigate back to home
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error logging skipped medication:', error);
      Alert.alert(t('alert.loadError'), t('alert.saveLogError'), [
        { text: t('common:button.confirm') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-xl text-gray-900 mt-4">{t('message.saving')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-6">
      {/* Title */}
      <Text
        className="text-4xl font-bold text-gray-900 text-center mb-8 mt-4"
        accessibilityLabel={t('skipReason.title')}
        accessibilityRole="header"
      >
        {t('skipReason.title')}
      </Text>

      {/* Reason buttons */}
      <View className="flex-1 gap-4">
        {REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.key}
            className="bg-white h-[72px] flex-row items-center px-6 rounded-2xl border-2 border-gray-200 shadow-sm"
            onPress={() => handleReasonSelect(reason.key)}
            activeOpacity={0.7}
            accessibilityLabel={t('accessibility.selectReason', {
              reason: t(reason.labelKey),
            })}
            accessibilityHint={t('accessibility.selectReasonHint', {
              reason: t(reason.labelKey),
            })}
            accessibilityRole="button"
          >
            <Text className="text-3xl mr-4">{reason.icon}</Text>
            <Text className="text-2xl font-semibold text-gray-900 flex-1">
              {t(reason.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Back button */}
      <TouchableOpacity
        className="bg-gray-200 h-[60px] justify-center items-center rounded-xl mt-4"
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityLabel={t('accessibility.goBackButton')}
        accessibilityRole="button"
      >
        <Text className="text-xl font-semibold text-gray-900">{t('button.goBack')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SkipReasonScreen;
