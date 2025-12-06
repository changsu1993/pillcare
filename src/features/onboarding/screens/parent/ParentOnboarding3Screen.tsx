/**
 * ParentOnboarding3Screen - Completion
 *
 * Final onboarding screen with celebration and "Don't show again" option.
 *
 * Accessibility:
 * - WCAG AAA (7:1 contrast)
 * - 72px button height
 * - Clear checkbox with large touch target
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import ProgressDots from '../../components/ProgressDots';

type Props = {
  dontShowAgain: boolean;
  onToggleDontShow: () => void;
  onComplete: () => void;
};

const ParentOnboarding3Screen: React.FC<Props> = ({
  dontShowAgain,
  onToggleDontShow,
  onComplete,
}) => {
  const { t } = useTranslation(['onboarding', 'common']);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Progress indicator */}
      <View className="px-8 pt-4">
        <ProgressDots total={3} current={2} variant="parent" />
      </View>

      {/* Content */}
      <View
        className="flex-1 justify-center items-center px-8"
        accessibilityLabel={t('onboarding:parent.step3.accessibilityLabel')}
      >
        {/* Checkmark icon */}
        <OnboardingIllustration type="checkmark" variant="parent" size={96} />

        {/* Title */}
        <Text className="text-4xl font-bold text-success-700 text-center mt-8">
          {t('onboarding:parent.step3.completionTitle')}
        </Text>

        {/* Message */}
        <Text className="text-2xl text-gray-700 text-center mt-4 leading-9">
          {t('onboarding:parent.step3.completionMessage')}
        </Text>
      </View>

      {/* Bottom section */}
      <View className="px-8 pb-8">
        {/* Start button */}
        <OnboardingButton
          label={t('onboarding:common.getStarted')}
          onPress={onComplete}
          variant="parent"
          type="primary"
          accessibilityHint={t('onboarding:accessibility.startAppHint')}
        />

        {/* Don't show again checkbox */}
        <TouchableOpacity
          className="flex-row items-center justify-center mt-6 py-4"
          onPress={onToggleDontShow}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: dontShowAgain }}
          accessibilityLabel={t('onboarding:common.dontShowAgain')}
          accessibilityHint={
            dontShowAgain
              ? t('onboarding:accessibility.dontShowAgainChecked')
              : t('onboarding:accessibility.dontShowAgainUnchecked')
          }
        >
          <View
            className={`w-8 h-8 rounded-lg border-2 justify-center items-center mr-3 ${
              dontShowAgain ? 'bg-success border-success' : 'bg-white border-gray-400'
            }`}
          >
            {dontShowAgain && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
          </View>
          <Text className="text-xl text-gray-700">{t('onboarding:common.dontShowAgain')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ParentOnboarding3Screen;
