/**
 * ParentOnboarding1Screen - Taking Medication
 *
 * Explains the core 2-button interaction for medication reminders.
 * Shows mock UI of the "Took it / Missed it" buttons.
 *
 * Accessibility:
 * - WCAG AAA (7:1 contrast)
 * - 72px button height
 * - Large touch targets
 */

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import ProgressDots from '../../components/ProgressDots';
import { ParentOnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = {
  navigation: StackNavigationProp<ParentOnboardingStackParamList, 'Step1'>;
};

const ParentOnboarding1Screen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation(['onboarding', 'common']);

  const handleNext = () => {
    navigation.navigate('Step2');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Progress indicator */}
      <View className="px-8 pt-4">
        <ProgressDots total={3} current={0} variant="parent" />
      </View>

      {/* Content */}
      <View
        className="flex-1 justify-center items-center px-8"
        accessibilityLabel={t('onboarding:parent.step1.accessibilityLabel')}
        accessibilityHint={t('onboarding:parent.step1.accessibilityHint')}
      >
        {/* Icon */}
        <OnboardingIllustration type="pill" variant="parent" />

        {/* Heading */}
        <Text className="text-3xl font-bold text-gray-900 text-center mt-8 leading-10">
          {t('onboarding:parent.step1.heading')}
        </Text>

        {/* Mock UI Preview */}
        <View className="w-full mt-8 p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
          <Text className="text-xl text-gray-700 text-center mb-4">
            {t('onboarding:parent.step1.previewTitle')}
          </Text>
          <View className="flex-row gap-4">
            {/* Mock "Took it" button */}
            <View className="flex-1 h-16 bg-success rounded-xl justify-center items-center">
              <Text className="text-xl font-bold text-white">
                {t('onboarding:parent.step1.tookButton')}
              </Text>
            </View>
            {/* Mock "Missed it" button */}
            <View className="flex-1 h-16 bg-gray-500 rounded-xl justify-center items-center">
              <Text className="text-xl font-bold text-white">
                {t('onboarding:parent.step1.missedButton')}
              </Text>
            </View>
          </View>
        </View>

        {/* Instruction */}
        <Text className="text-2xl text-gray-700 text-center mt-6">
          {t('onboarding:parent.step1.instruction')}
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

export default ParentOnboarding1Screen;
