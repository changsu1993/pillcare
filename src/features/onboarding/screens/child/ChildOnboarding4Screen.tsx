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

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import ProgressDots from '../../components/ProgressDots';
import { ChildOnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = {
  navigation: StackNavigationProp<ChildOnboardingStackParamList, 'Step4'>;
  onSkip: () => void;
};

const ChildOnboarding4Screen: React.FC<Props> = ({ navigation, onSkip }) => {
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
          accessibilityLabel="건너뛰기"
        >
          <Text className="text-sm text-gray-500">건너뛰기</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Icon */}
        <OnboardingIllustration type="bell" variant="child" />

        {/* Title */}
        <Text className="text-xl font-bold text-gray-800 text-center mt-6">미복용 알림 받기</Text>

        {/* Description */}
        <Text className="text-base text-gray-600 text-center mt-3 leading-6">
          부모님이 약을 안 드시면{'\n'}푸시 알림으로 알려드려요
        </Text>

        {/* Notification preview */}
        <View className="w-full mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Notification header */}
          <View className="flex-row items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
            <MaterialCommunityIcons name="pill" size={20} color="#3B82F6" />
            <Text className="text-sm font-bold text-gray-800 ml-2">PillCare</Text>
            <Text className="text-xs text-gray-400 ml-auto">지금</Text>
          </View>

          {/* Notification body */}
          <View className="p-4">
            <Text className="text-base text-gray-800 leading-6">
              어머니가 혈압약을{'\n'}복용하지 않았습니다
            </Text>
          </View>
        </View>

        {/* Tip */}
        <Text className="text-sm text-gray-500 text-center mt-4">설정에서 알림을 관리하세요</Text>
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

export default ChildOnboarding4Screen;
