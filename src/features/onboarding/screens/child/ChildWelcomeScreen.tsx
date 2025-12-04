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

import OnboardingIllustration from '../../components/OnboardingIllustration';
import OnboardingButton from '../../components/OnboardingButton';
import { ChildOnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = {
  navigation: StackNavigationProp<ChildOnboardingStackParamList, 'Welcome'>;
  onSkip: () => void;
};

const ChildWelcomeScreen: React.FC<Props> = ({ navigation, onSkip }) => {
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
          PillCare
        </Text>

        {/* Tagline */}
        <Text className="text-lg text-gray-600 text-center mt-3 leading-7">
          부모님의 건강한 복약 습관을{'\n'}함께 관리하세요
        </Text>
      </View>

      {/* Bottom buttons */}
      <View className="px-6 pb-8">
        <OnboardingButton
          label="튜토리얼 시작"
          onPress={handleStart}
          variant="child"
          type="primary"
          accessibilityHint="튜토리얼을 시작합니다"
        />

        <TouchableOpacity
          className="flex-row items-center justify-center mt-4 py-3"
          onPress={onSkip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="건너뛰기"
          accessibilityHint="튜토리얼을 건너뛰고 앱을 바로 시작합니다"
        >
          <Text className="text-base text-primary">건너뛰기</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChildWelcomeScreen;
