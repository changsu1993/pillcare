/**
 * ChildWelcomeScreen - Child Onboarding Entry
 *
 * Welcome screen for adult children users.
 * Clean design with value proposition.
 *
 * Accessibility:
 * - WCAG AA (4.5:1 contrast)
 * - 48px button height
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import { ChildOnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = {
  navigation: StackNavigationProp<ChildOnboardingStackParamList, 'Welcome'>;
  onSkip: () => void;
};

const ChildWelcomeScreen: React.FC<Props> = ({ navigation, onSkip }) => {
  const { t } = useTranslation(['onboarding', 'common']);

  const handleStart = () => {
    navigation.navigate('Step1');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        {/* Logo */}
        <OnboardingIllustration type="logo" variant="child" size={64} />

        {/* App name */}
        <Text
          className="text-3xl font-bold text-primary text-center mt-6"
          accessibilityRole="header"
        >
          {t('common:appName')}
        </Text>

        {/* Tagline */}
        <Text className="text-lg text-gray-600 text-center mt-3 leading-7">
          {t('onboarding:child.welcome.tagline')}
        </Text>
      </View>

      {/* Bottom buttons */}
      <View className="px-6 pb-8">
        <OnboardingButton
          label={t('onboarding:common.startTutorial')}
          onPress={handleStart}
          variant="child"
          type="primary"
          accessibilityHint={t('onboarding:accessibility.startHint')}
        />

        <TouchableOpacity
          className="flex-row items-center justify-center mt-4 py-3"
          onPress={onSkip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding:common.skip')}
          accessibilityHint={t('onboarding:accessibility.skipHint')}
        >
          <Text className="text-base text-primary">{t('onboarding:common.skip')}</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChildWelcomeScreen;
