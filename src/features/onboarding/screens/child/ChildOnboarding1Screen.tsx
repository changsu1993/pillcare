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

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import ProgressDots from '../../components/ProgressDots';
import { ChildOnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = {
  navigation: StackNavigationProp<ChildOnboardingStackParamList, 'Step1'>;
  onSkip: () => void;
};

const ChildOnboarding1Screen: React.FC<Props> = ({ navigation, onSkip }) => {
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
          accessibilityLabel="건너뛰기"
          accessibilityHint="튜토리얼을 건너뛰고 앱을 바로 시작합니다"
        >
          <Text className="text-sm text-gray-500">건너뛰기</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Icon */}
        <OnboardingIllustration type="connection" variant="child" />

        {/* Title */}
        <Text className="text-xl font-bold text-gray-800 text-center mt-6">부모님과 연결하기</Text>

        {/* Description */}
        <Text className="text-base text-gray-600 text-center mt-3 leading-6 px-4">
          부모님이 생성한 초대 코드를 입력하면{'\n'}복약 현황을 실시간으로 확인할 수 있어요
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
          설정 {'>'} 가족 연결에서 초대 코드를 입력하세요
        </Text>
      </View>

      {/* Bottom button */}
      <View className="px-6 pb-8">
        <OnboardingButton
          label="다음"
          onPress={handleNext}
          variant="child"
          type="primary"
          accessibilityHint="다음 화면으로 이동합니다"
        />
      </View>
    </SafeAreaView>
  );
};

export default ChildOnboarding1Screen;
