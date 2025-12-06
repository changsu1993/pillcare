/**
 * ParentWelcomeScreen - Parent Onboarding Entry
 *
 * Welcome screen for elderly parent users.
 * Large text, simple 2-button UI, high contrast.
 *
 * Accessibility:
 * - WCAG AAA (7:1 contrast)
 * - 72px button height
 * - 36pt heading, 24pt body
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import { ParentOnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = {
  navigation: StackNavigationProp<ParentOnboardingStackParamList, 'Welcome'>;
  onSkip: () => void;
};

const ParentWelcomeScreen: React.FC<Props> = ({ navigation, onSkip }) => {
  const { t } = useTranslation(['onboarding', 'common']);

  const handleStart = () => {
    navigation.navigate('Step1');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-8">
        {/* Logo */}
        <OnboardingIllustration type="logo" variant="parent" size={96} />

        {/* Title */}
        <Text
          className="text-4xl font-bold text-gray-900 text-center mt-8"
          accessibilityRole="header"
        >
          {t('onboarding:parent.welcome.title')}
        </Text>

        {/* Subtitle */}
        <Text
          className="text-2xl text-gray-700 text-center mt-4"
          accessibilityLabel={t('onboarding:parent.welcome.subtitle')}
        >
          {t('onboarding:parent.welcome.subtitle')}
        </Text>
      </View>

      {/* Bottom buttons */}
      <View className="px-8 pb-8">
        <OnboardingButton
          label={t('onboarding:common.getStarted')}
          onPress={handleStart}
          variant="parent"
          type="primary"
          accessibilityHint={t('onboarding:accessibility.startHint')}
        />

        <TouchableOpacity
          className="mt-6 py-4 items-center"
          onPress={onSkip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding:common.skip')}
          accessibilityHint={t('onboarding:accessibility.skipHint')}
        >
          <Text className="text-xl text-gray-600 underline">{t('onboarding:common.skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ParentWelcomeScreen;
