/**
 * ChildOnboarding4Screen - Push Notifications
 *
 * Explains the alert system for missed medications.
 *
 * Accessibility:
 * - WCAG AA (4.5:1 contrast)
 * - 48px button height
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import ProgressDots from '../../components/ProgressDots';
import { ChildOnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = {
  navigation: StackNavigationProp<ChildOnboardingStackParamList, 'Step4'>;
  onSkip: () => void;
};

const ChildOnboarding4Screen: React.FC<Props> = ({ navigation, onSkip }) => {
  const { t } = useTranslation(['onboarding', 'common']);

  const handleNext = () => {
    navigation.navigate('Step5');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with progress and skip */}
      <View className="flex-row items-center justify-between px-6 pt-4">
        <ProgressDots total={4} current={3} variant="child" />
        <TouchableOpacity
          onPress={onSkip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding:common.skip')}
        >
          <Text className="text-sm text-gray-500">{t('onboarding:common.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Icon */}
        <OnboardingIllustration type="bell" variant="child" />

        {/* Title */}
        <Text className="text-xl font-bold text-gray-800 text-center mt-6">
          {t('onboarding:child.step4.heading')}
        </Text>

        {/* Description */}
        <Text className="text-base text-gray-600 text-center mt-3 leading-6">
          {t('onboarding:child.step4.subDescription')}
        </Text>

        {/* Notification preview */}
        <View className="w-full mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Notification header */}
          <View className="flex-row items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
            <MaterialCommunityIcons name="pill" size={20} color="#3B82F6" />
            <Text className="text-sm font-bold text-gray-800 ml-2">{t('common:appName')}</Text>
            <Text className="text-xs text-gray-400 ml-auto">
              {t('onboarding:child.step4.notificationNow')}
            </Text>
          </View>

          {/* Notification body */}
          <View className="p-4">
            <Text className="text-base text-gray-800 leading-6">
              {t('onboarding:child.step4.notificationMessage')}
            </Text>
          </View>
        </View>

        {/* Tip */}
        <Text className="text-sm text-gray-500 text-center mt-4">
          {t('onboarding:child.step4.tip')}
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

export default ChildOnboarding4Screen;
