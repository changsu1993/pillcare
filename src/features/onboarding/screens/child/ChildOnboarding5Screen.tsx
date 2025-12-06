/**
 * ChildOnboarding5Screen - Completion
 *
 * Final onboarding screen with CTAs and "Don't show again" option.
 *
 * Accessibility:
 * - WCAG AA (4.5:1 contrast)
 * - 48px button height
 * - Clear checkbox
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
  onConnectParent: () => void;
};

const ChildOnboarding5Screen: React.FC<Props> = ({
  dontShowAgain,
  onToggleDontShow,
  onComplete,
  onConnectParent,
}) => {
  const { t } = useTranslation(['onboarding', 'common']);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Progress indicator - all dots filled */}
      <View className="px-6 pt-4">
        <ProgressDots total={4} current={3} variant="child" />
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Checkmark icon */}
        <OnboardingIllustration type="checkmark" variant="child" size={72} />

        {/* Title */}
        <Text className="text-2xl font-bold text-success-600 text-center mt-6">
          {t('onboarding:child.step5.completionTitle')}
        </Text>

        {/* Message */}
        <Text className="text-base text-gray-600 text-center mt-3 leading-6">
          {t('onboarding:child.step5.completionMessage')}
        </Text>
      </View>

      {/* Bottom section */}
      <View className="px-6 pb-8">
        {/* Primary CTA - Connect parent */}
        <OnboardingButton
          label={t('onboarding:common.goToConnectParent')}
          onPress={onConnectParent}
          variant="child"
          type="primary"
          accessibilityHint={t('onboarding:accessibility.connectParentHint')}
        />

        {/* Secondary CTA - Go home */}
        <View className="mt-3">
          <OnboardingButton
            label={t('onboarding:common.goHome')}
            onPress={onComplete}
            variant="child"
            type="outline"
            accessibilityHint={t('onboarding:accessibility.goHomeHint')}
          />
        </View>

        {/* Don't show again checkbox */}
        <TouchableOpacity
          className="flex-row items-center justify-center mt-6 py-3"
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
            className={`w-5 h-5 rounded border justify-center items-center mr-2 ${
              dontShowAgain ? 'bg-primary border-primary' : 'bg-white border-gray-400'
            }`}
          >
            {dontShowAgain && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
          <Text className="text-sm text-gray-600">{t('onboarding:common.dontShowAgain')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChildOnboarding5Screen;
