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
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { speakConfirmation, stopSpeaking } from '../../../notifications/services/voice';
import { isVoiceGuidanceEnabled } from '../../../settings/services/settings';

type Props = ParentScreenProps<'Confirmation'>;

const ConfirmationScreen = ({ route, navigation }: Props) => {
  const { medicationName, takenAt } = route.params;
  const { t } = useTranslation(['medication', 'common']);

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
    <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
      {/* Success icon */}
      <View className="w-[120px] h-[120px] rounded-full bg-success justify-center items-center mb-8">
        <Text
          className="text-[80px] font-bold text-white"
          accessibilityLabel={t('accessibility.success')}
        >
          ✓
        </Text>
      </View>

      {/* Success message */}
      <Text
        className="text-5xl font-bold text-gray-900 text-center mb-6"
        accessibilityLabel={t('message.wellDone')}
        accessibilityRole="header"
      >
        {t('message.wellDone')}
      </Text>

      {/* Medication name */}
      <Text
        className="text-3xl font-semibold text-gray-900 text-center mb-3"
        accessibilityLabel={t('accessibility.medicationName', { name: medicationName })}
      >
        {medicationName}
      </Text>

      {/* Time taken */}
      <Text
        className="text-2xl font-medium text-gray-500 text-center mb-12"
        accessibilityLabel={t('message.takenAt', {
          time: new Date(takenAt).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })}
      >
        {new Date(takenAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>

      {/* Home button */}
      <TouchableOpacity
        className="bg-primary px-12 py-5 rounded-2xl min-w-[200px] items-center shadow-md"
        onPress={handleGoHome}
        activeOpacity={0.7}
        accessibilityLabel={t('accessibility.goHomeButton')}
        accessibilityHint={t('accessibility.goHomeHint')}
        accessibilityRole="button"
      >
        <Text className="text-2xl font-bold text-white">{t('button.goHome')}</Text>
      </TouchableOpacity>

      {/* Auto-return hint */}
      <Text className="text-lg text-gray-400 text-center mt-6">{t('message.autoReturnHint')}</Text>
    </SafeAreaView>
  );
};

export default ConfirmationScreen;
