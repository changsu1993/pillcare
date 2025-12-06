/**
 * ParentOnboarding2Screen - Voice Guidance
 *
 * Introduces the voice guidance accessibility feature.
 * Shows example of spoken medication reminder.
 *
 * Accessibility:
 * - WCAG AAA (7:1 contrast)
 * - 72px button height
 * - Visual representation of audio
 */

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import ProgressDots from '../../components/ProgressDots';
import { ParentOnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = {
  navigation: StackNavigationProp<ParentOnboardingStackParamList, 'Step2'>;
};

const ParentOnboarding2Screen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation(['onboarding', 'common']);

  const handleNext = () => {
    navigation.navigate('Step3');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Progress indicator */}
      <View className="px-8 pt-4">
        <ProgressDots total={3} current={1} variant="parent" />
      </View>

      {/* Content */}
      <View
        className="flex-1 justify-center items-center px-8"
        accessibilityLabel={t('onboarding:parent.step2.accessibilityLabel')}
        accessibilityHint={t('onboarding:parent.step2.accessibilityHint')}
      >
        {/* Icon */}
        <OnboardingIllustration type="speaker" variant="parent" />

        {/* Heading */}
        <Text className="text-3xl font-bold text-gray-900 text-center mt-8 leading-10">
          {t('onboarding:parent.step2.heading')}
        </Text>

        {/* Sound wave visual with example text */}
        <View className="w-full mt-8 p-6 bg-gray-100 rounded-2xl">
          {/* Sound wave indicators */}
          <View className="flex-row justify-center items-end gap-1 mb-4">
            <View className="w-1 h-4 bg-success rounded-full" />
            <View className="w-1 h-6 bg-success rounded-full" />
            <View className="w-1 h-8 bg-success rounded-full" />
            <View className="w-1 h-10 bg-success rounded-full" />
            <View className="w-1 h-8 bg-success rounded-full" />
            <View className="w-1 h-6 bg-success rounded-full" />
            <View className="w-1 h-4 bg-success rounded-full" />
          </View>

          {/* Example speech */}
          <View className="flex-row justify-center items-center">
            <Ionicons name="chatbubble-ellipses" size={24} color="#6B7280" />
            <Text className="text-2xl italic text-gray-700 ml-2">
              {t('onboarding:parent.step2.exampleSpeech')}
            </Text>
          </View>
        </View>

        {/* Tip */}
        <Text className="text-2xl text-gray-600 text-center mt-6">
          {t('onboarding:parent.step2.tip')}
        </Text>
      </View>

      {/* Bottom button */}
      <View className="px-8 pb-8">
        <OnboardingButton
          label={t('onboarding:common.next')}
          onPress={handleNext}
          variant="parent"
          type="primary"
          accessibilityHint={t('onboarding:accessibility.nextHint')}
        />
      </View>
    </SafeAreaView>
  );
};

export default ParentOnboarding2Screen;
