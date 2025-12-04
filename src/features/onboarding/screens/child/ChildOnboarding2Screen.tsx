/**
 * ChildOnboarding2Screen - Managing Medications
 *
 * Shows how to add and edit parent's medications.
 *
 * Accessibility:
 * - WCAG AA (4.5:1 contrast)
 * - 48px button height
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
  navigation: StackNavigationProp<ChildOnboardingStackParamList, 'Step2'>;
  onSkip: () => void;
};

const ChildOnboarding2Screen: React.FC<Props> = ({ navigation, onSkip }) => {
  const handleNext = () => {
    navigation.navigate('Step3');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with progress and skip */}
      <View className="flex-row items-center justify-between px-6 pt-4">
        <ProgressDots total={4} current={1} variant="child" />
        <TouchableOpacity
          onPress={onSkip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="건너뛰기"
        >
          <Text className="text-sm text-gray-500">건너뛰기</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Icon */}
        <OnboardingIllustration type="medication" variant="child" />

        {/* Title */}
        <Text className="text-xl font-bold text-gray-800 text-center mt-6">약 등록하기</Text>

        {/* Description */}
        <Text className="text-base text-gray-600 text-center mt-3 leading-6">
          부모님이 드시는 약을 등록하고{'\n'}복용 시간을 설정할 수 있어요
        </Text>

        {/* Medication list preview */}
        <View className="w-full mt-6 bg-gray-50 rounded-xl overflow-hidden">
          {/* Medication item 1 */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-success-100 rounded-full justify-center items-center mr-3">
                <Text className="text-success font-bold">H</Text>
              </View>
              <Text className="text-base font-medium text-gray-800">혈압약</Text>
            </View>
            <Text className="text-sm text-gray-500">09:00</Text>
          </View>

          {/* Medication item 2 */}
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-warning-100 rounded-full justify-center items-center mr-3">
                <Text className="text-warning-700 font-bold">D</Text>
              </View>
              <Text className="text-base font-medium text-gray-800">당뇨약</Text>
            </View>
            <Text className="text-sm text-gray-500">09:00, 18:00</Text>
          </View>
        </View>

        {/* Tip */}
        <Text className="text-sm text-gray-500 text-center mt-4">약 관리 탭에서 추가하세요</Text>
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

export default ChildOnboarding2Screen;
