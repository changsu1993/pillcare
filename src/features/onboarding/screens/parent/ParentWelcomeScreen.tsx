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

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import { ParentOnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = {
  navigation: StackNavigationProp<ParentOnboardingStackParamList, 'Welcome'>;
  onSkip: () => void;
};

const ParentWelcomeScreen: React.FC<Props> = ({ navigation, onSkip }) => {
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
          PillCare에 오신 것을{'\n'}환영합니다
        </Text>

        {/* Subtitle */}
        <Text
          className="text-2xl text-gray-700 text-center mt-4"
          accessibilityLabel="간단한 사용법을 알려드릴게요"
        >
          간단한 사용법을 알려드릴게요
        </Text>
      </View>

      {/* Bottom buttons */}
      <View className="px-8 pb-8">
        <OnboardingButton
          label="시작하기"
          onPress={handleStart}
          variant="parent"
          type="primary"
          accessibilityHint="튜토리얼을 시작합니다"
        />

        <TouchableOpacity
          className="mt-6 py-4 items-center"
          onPress={onSkip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="건너뛰기"
          accessibilityHint="튜토리얼을 건너뛰고 앱을 바로 시작합니다"
        >
          <Text className="text-xl text-gray-600 underline">건너뛰기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ParentWelcomeScreen;
