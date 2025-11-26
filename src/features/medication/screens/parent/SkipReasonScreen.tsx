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
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import {
  logMedicationMissed,
  getMedication,
  createMissedMedicationEvent,
} from '../../../../shared/services/api';
import { speakSkipPrompt, stopSpeaking } from '../../../notifications/services/voice';
import { isVoiceGuidanceEnabled } from '../../../settings/services/settings';

type Props = ParentScreenProps<'SkipReason'>;

type SkipReason = 'forgot' | 'no_medication' | 'felt_sick' | 'at_hospital' | 'other';

interface ReasonOption {
  key: SkipReason;
  label: string;
  icon: string;
}

const REASONS: ReasonOption[] = [
  { key: 'forgot', label: '깜빡했어요', icon: '😴' },
  { key: 'no_medication', label: '약이 없어요', icon: '💊' },
  { key: 'felt_sick', label: '속이 안 좋아요', icon: '🤢' },
  { key: 'at_hospital', label: '병원에 있어요', icon: '🏥' },
  { key: 'other', label: '기타', icon: '❓' },
];

const SkipReasonScreen = ({ route, navigation }: Props) => {
  const { medicationId, scheduledTime } = route.params;
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
        await createMissedMedicationEvent(
          medicationId,
          medication.name,
          new Date(scheduledTime),
          reason
        );

        console.log('미복용 이벤트 생성 완료 - 자녀에게 알림 전송됨');
      } catch (eventError) {
        // Log error but don't block the main flow
        console.error('미복용 이벤트 생성 실패:', eventError);
        // Continue to navigate - the main log was saved
      }

      // Navigate back to home
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error logging skipped medication:', error);
      Alert.alert('오류', '기록을 저장할 수 없습니다. 다시 시도해주세요.', [{ text: '확인' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>저장 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Title */}
      <Text style={styles.title} accessibilityLabel="왜 못 드셨나요?" accessibilityRole="header">
        왜 못 드셨나요?
      </Text>

      {/* Reason buttons */}
      <View style={styles.buttonsContainer}>
        {REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.key}
            style={styles.reasonButton}
            onPress={() => handleReasonSelect(reason.key)}
            activeOpacity={0.7}
            accessibilityLabel={`${reason.label} 선택`}
            accessibilityHint={`${reason.label}을 이유로 선택합니다`}
            accessibilityRole="button"
          >
            <Text style={styles.reasonIcon}>{reason.icon}</Text>
            <Text style={styles.reasonText}>{reason.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityLabel="뒤로 가기"
        accessibilityRole="button"
      >
        <Text style={styles.backButtonText}>뒤로</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    color: '#1A1A1A',
    marginTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  buttonsContainer: {
    flex: 1,
    gap: 16,
  },
  reasonButton: {
    backgroundColor: '#FFFFFF',
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reasonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  reasonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  backButton: {
    backgroundColor: '#E5E7EB',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});

export default SkipReasonScreen;
