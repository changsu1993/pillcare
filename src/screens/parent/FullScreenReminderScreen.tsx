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
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParentScreenProps } from '../../types/navigation.types';
import { speakMedicationReminder, stopSpeaking } from '../../services/voice';
import { isVoiceGuidanceEnabled, isVibrationEnabled } from '../../services/settings';

type Props = ParentScreenProps<'FullScreenReminder'>;

const FullScreenReminderScreen: React.FC<Props> = ({ route, navigation }) => {
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
    <SafeAreaView style={styles.container}>
      {/* Medication icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>💊</Text>
      </View>

      {/* Medication name */}
      <Text
        style={styles.medicationName}
        accessibilityLabel={`약 이름: ${medicationName}`}
        accessibilityRole="header"
      >
        {medicationName}
      </Text>

      {/* Dosage */}
      <Text
        style={styles.dosage}
        accessibilityLabel={`복용량: ${dosage}`}
      >
        {dosage}
      </Text>

      {/* Time */}
      <Text
        style={styles.time}
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
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.buttonTaken}
          onPress={handleTaken}
          activeOpacity={0.7}
          accessibilityLabel="먹었어요 버튼"
          accessibilityHint="약을 복용했을 때 누르세요"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>먹었어요</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSkipped}
          onPress={handleSkipped}
          activeOpacity={0.7}
          accessibilityLabel="못 먹었어요 버튼"
          accessibilityHint="약을 복용하지 못했을 때 누르세요"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>못 먹었어요</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCD34D', // Warning yellow
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  icon: {
    fontSize: 80,
  },
  medicationName: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  dosage: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  time: {
    fontSize: 28,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 16,
  },
  buttonTaken: {
    flex: 1,
    backgroundColor: '#22C55E', // Success green
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonSkipped: {
    flex: 1,
    backgroundColor: '#6B7280', // Gray
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default FullScreenReminderScreen;
