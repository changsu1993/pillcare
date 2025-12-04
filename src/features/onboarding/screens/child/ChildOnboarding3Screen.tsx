/**
 * ChildOnboarding3Screen - Understanding Reports
 *
 * Explains the adherence reporting feature with visual chart preview.
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
  navigation: StackNavigationProp<ChildOnboardingStackParamList, 'Step3'>;
  onSkip: () => void;
};

const ChildOnboarding3Screen: React.FC<Props> = ({ navigation, onSkip }) => {
  const handleNext = () => {
    navigation.navigate('Step4');
  };

  // Sample bar heights for the mini chart (percentages)
  const barHeights = [100, 80, 100, 60, 100, 100, 80];
  const days = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with progress and skip */}
      <View className="flex-row items-center justify-between px-6 pt-4">
        <ProgressDots total={4} current={2} variant="child" />
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
        <OnboardingIllustration type="chart" variant="child" />

        {/* Title */}
        <Text className="text-xl font-bold text-gray-800 text-center mt-6">복약 현황 리포트</Text>

        {/* Description */}
        <Text className="text-base text-gray-600 text-center mt-3 leading-6">
          주간/월간 복약률을 한눈에{'\n'}확인할 수 있어요
        </Text>

        {/* Mini bar chart preview */}
        <View className="w-full mt-6 p-4 bg-gray-50 rounded-xl">
          {/* Chart bars */}
          <View className="flex-row justify-between items-end h-24 mb-2">
            {barHeights.map((height, index) => (
              <View key={index} className="items-center flex-1">
                <View
                  className={`w-6 rounded-t-md ${height >= 80 ? 'bg-success' : 'bg-warning'}`}
                  style={{ height: (height / 100) * 80 }}
                />
              </View>
            ))}
          </View>

          {/* Day labels */}
          <View className="flex-row justify-between">
            {days.map((day, index) => (
              <View key={index} className="items-center flex-1">
                <Text className="text-xs text-gray-500">{day}</Text>
              </View>
            ))}
          </View>

          {/* Weekly stat */}
          <View className="mt-4 pt-3 border-t border-gray-200">
            <Text className="text-base font-bold text-primary text-center">
              이번 주 복약률: 85%
            </Text>
          </View>
        </View>

        {/* Tip */}
        <Text className="text-sm text-gray-500 text-center mt-4">리포트 탭에서 확인하세요</Text>
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

export default ChildOnboarding3Screen;
