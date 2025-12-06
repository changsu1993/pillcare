/**
 * ChildOnboarding1Screen - Connecting with Parent
 *
 * Explains the family connection feature and invitation code system.
 *
 * Accessibility:
 * - WCAG AA (4.5:1 contrast)
 * - 48px button height
 * - Skip button always accessible
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import ProgressDots from '../../components/ProgressDots';
import { ChildOnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = {
  navigation: StackNavigationProp<ChildOnboardingStackParamList, 'Step1'>;
  onSkip: () => void;
};

const ChildOnboarding1Screen: React.FC<Props> = ({ navigation, onSkip }) => {
  const { t } = useTranslation(['onboarding', 'common']);

  const handleNext = () => {
    navigation.navigate('Step2');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with progress and skip */}
      <View className="flex-row items-center justify-between px-6 pt-4">
        <ProgressDots total={4} current={0} variant="child" />
        <TouchableOpacity
          onPress={onSkip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding:common.skip')}
          accessibilityHint={t('onboarding:accessibility.skipHint')}
        >
          <Text className="text-sm text-gray-500">{t('onboarding:common.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Icon */}
        <OnboardingIllustration type="connection" variant="child" />

        {/* Title */}
        <Text className="text-xl font-bold text-gray-800 text-center mt-6">
          {t('onboarding:child.step1.heading')}
        </Text>

        {/* Description */}
        <Text className="text-base text-gray-600 text-center mt-3 leading-6 px-4">
          {t('onboarding:child.step1.subDescription')}
        </Text>

        {/* Code input preview */}
        <View className="w-full mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <View className="flex-row justify-center items-center gap-2">
            {['A', 'B', 'C', '-', '1', '2', '3'].map((char, index) => (
              <View
                key={index}
                className={`w-8 h-10 justify-center items-center rounded-lg ${
                  char === '-' ? 'bg-transparent' : 'bg-white border border-gray-300'
                }`}
              >
                <Text className="text-lg font-semibold text-gray-800">{char}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tip */}
        <Text className="text-sm text-gray-500 text-center mt-4">
          {t('onboarding:child.step1.tip')}
        </Text>
      </View>

      {/* Bottom button */}
      <View className="px-6 pb-8">
        <OnboardingButton
          label={t('onboarding:common.next')}
          onPress={handleNext}
          variant="child"
          type="primary"
          accessibilityHint={t('onboarding:accessibility.nextHint')}
        />
      </View>
    </SafeAreaView>
  );
};

export default ChildOnboarding1Screen;
