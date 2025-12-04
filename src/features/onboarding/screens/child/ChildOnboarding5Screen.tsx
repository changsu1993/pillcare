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
        <Text className="text-2xl font-bold text-success-600 text-center mt-6">준비 완료!</Text>

        {/* Message */}
        <Text className="text-base text-gray-600 text-center mt-3 leading-6">
          이제 부모님의 건강한 복약{'\n'}습관을 함께 관리하세요
        </Text>
      </View>

      {/* Bottom section */}
      <View className="px-6 pb-8">
        {/* Primary CTA - Connect parent */}
        <OnboardingButton
          label="부모님 연결하러 가기"
          onPress={onConnectParent}
          variant="child"
          type="primary"
          accessibilityHint="부모님 연결 화면으로 이동합니다"
        />

        {/* Secondary CTA - Go home */}
        <View className="mt-3">
          <OnboardingButton
            label="홈으로 가기"
            onPress={onComplete}
            variant="child"
            type="outline"
            accessibilityHint="홈 화면으로 이동합니다"
          />
        </View>

        {/* Don't show again checkbox */}
        <TouchableOpacity
          className="flex-row items-center justify-center mt-6 py-3"
          onPress={onToggleDontShow}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: dontShowAgain }}
          accessibilityLabel="다시 보지 않기"
          accessibilityHint={dontShowAgain ? '선택 해제하려면 누르세요' : '선택하려면 누르세요'}
        >
          <View
            className={`w-5 h-5 rounded border justify-center items-center mr-2 ${
              dontShowAgain ? 'bg-primary border-primary' : 'bg-white border-gray-400'
            }`}
          >
            {dontShowAgain && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
          <Text className="text-sm text-gray-600">다시 보지 않기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChildOnboarding5Screen;
